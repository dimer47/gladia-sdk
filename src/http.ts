import {
  GladiaApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  GladiaTimeoutError,
  type ApiErrorBody,
  type ApiErrorContext,
} from './errors.js';
import type { HttpRetryConfig } from './types/common.js';

export interface HttpClientConfig {
  apiKey?: string;
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: Partial<HttpRetryConfig>;
}

const SENSITIVE_HEADERS = new Set(['x-gladia-key', 'authorization', 'cookie']);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const defaultDelay = (attempt: number) => Math.min(300 * 2 ** (attempt - 1), 10_000);

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;
  private readonly retry: HttpRetryConfig;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = { ...config.headers };
    if (config.apiKey) this.defaultHeaders['x-gladia-key'] = config.apiKey;
    this.timeout = config.timeout ?? 10_000;
    this.retry = {
      maxAttempts: config.retry?.maxAttempts ?? 2,
      statusCodes: config.retry?.statusCodes ?? [408, 413, 429, [500, 599]],
      delay: config.retry?.delay ?? defaultDelay,
    };
  }

  async get<T>(path: string, query?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
    return this.requestJson<T>(this.buildUrl(path, query), { method: 'GET', signal });
  }
  async post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.requestJson<T>(this.buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
      signal,
    });
  }
  async patch(path: string, body?: unknown, signal?: AbortSignal): Promise<void> {
    await this.requestVoid(this.buildUrl(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body == null ? undefined : JSON.stringify(body),
      signal,
    });
  }
  async postForm<T>(path: string, body: FormData, signal?: AbortSignal): Promise<T> {
    return this.requestJson<T>(this.buildUrl(path), { method: 'POST', body, signal });
  }
  async postFormVoid(path: string, body: FormData, signal?: AbortSignal): Promise<void> {
    await this.requestVoid(this.buildUrl(path), { method: 'POST', body, signal });
  }
  async getVoid(path: string, signal?: AbortSignal): Promise<void> {
    await this.requestVoid(this.buildUrl(path), { method: 'GET', signal });
  }
  async delete(path: string, signal?: AbortSignal): Promise<void> {
    await this.requestVoid(this.buildUrl(path), { method: 'DELETE', signal });
  }
  async getBlob(path: string, signal?: AbortSignal): Promise<Blob> {
    return (await this.requestResponse(this.buildUrl(path), { method: 'GET', signal })).blob();
  }
  async getArrayBuffer(path: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    return (
      await this.requestResponse(this.buildUrl(path), { method: 'GET', signal })
    ).arrayBuffer();
  }

  private async requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await this.requestResponse(url, init);
    return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
  }
  private async requestVoid(url: string, init: RequestInit): Promise<void> {
    await this.requestResponse(url, init);
  }

  private async requestResponse(url: string, init: RequestInit): Promise<Response> {
    const maxAttempts = Math.max(1, this.retry.maxAttempts);
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await this.fetchFollowingRedirects(url, init);
        if (response.ok) return response;
        if (attempt < maxAttempts && matchesStatus(response.status, this.retry.statusCodes)) {
          await response.arrayBuffer();
          await delay(this.retry.delay(attempt), init.signal);
          continue;
        }
        await this.throwApiError(response, init.method ?? 'GET', response.url || url);
      } catch (error) {
        if (
          error instanceof GladiaApiError ||
          error instanceof GladiaTimeoutError ||
          init.signal?.aborted
        )
          throw error;
        if (attempt >= maxAttempts) throw error;
        await delay(this.retry.delay(attempt), init.signal);
      }
    }
  }

  private async fetchFollowingRedirects(initialUrl: string, init: RequestInit): Promise<Response> {
    let url = new URL(initialUrl);
    let method = init.method ?? 'GET';
    let body = init.body;
    let headers = {
      ...this.defaultHeaders,
      ...(init.headers as Record<string, string> | undefined),
    };
    for (let count = 0; count <= 20; count++) {
      const controller = new AbortController();
      const onAbort = () => controller.abort(init.signal?.reason);
      init.signal?.addEventListener('abort', onAbort, { once: true });
      const timer =
        this.timeout > 0 ? setTimeout(() => controller.abort(), this.timeout) : undefined;
      let response: Response;
      try {
        response = await fetch(url.toString(), {
          ...init,
          method,
          body,
          headers,
          signal: controller.signal,
          redirect: 'manual',
        });
      } catch (error) {
        if (controller.signal.aborted && !init.signal?.aborted)
          throw new GladiaTimeoutError(
            `${method} ${url.pathname} timed out after ${this.timeout}ms`,
          );
        throw error;
      } finally {
        if (timer) clearTimeout(timer);
        init.signal?.removeEventListener('abort', onAbort);
      }
      const responseHeaders = response.headers ?? new Headers();
      const location = responseHeaders.get('location');
      if (!REDIRECT_STATUSES.has(response.status) || !location) return response;
      if (count === 20) throw new Error(`Too many redirects for ${method} ${url}`);
      const nextUrl = new URL(location, url);
      if (nextUrl.origin !== url.origin)
        headers = Object.fromEntries(
          Object.entries(headers).filter(([key]) => !SENSITIVE_HEADERS.has(key.toLowerCase())),
        );
      if (response.status === 303 || ([301, 302].includes(response.status) && method === 'POST')) {
        method = 'GET';
        body = undefined;
      }
      await response.arrayBuffer();
      url = nextUrl;
    }
    throw new Error('Unreachable redirect state');
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(path, `${this.baseUrl}/`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value == null) continue;
      if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(key, String(item)));
      else
        url.searchParams.set(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        );
    }
    return url.toString();
  }

  private async throwApiError(response: Response, method: string, url: string): Promise<never> {
    let body: ApiErrorBody;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = { message: response.statusText, statusCode: response.status };
    }
    const headers = response.headers ?? new Headers();
    const responseHeaders: Record<string, string> = {};
    headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    const context: ApiErrorContext = { method, url, requestId: body.request_id, responseHeaders };
    if (response.status === 400) throw new BadRequestError(body, context);
    if (response.status === 401) throw new UnauthorizedError(body, context);
    if (response.status === 403) throw new ForbiddenError(body, context);
    if (response.status === 404) throw new NotFoundError(body, context);
    if (response.status === 422) throw new UnprocessableEntityError(body, context);
    throw new GladiaApiError(response.status, body, context);
  }
}

function matchesStatus(status: number, values: (number | readonly [number, number])[]): boolean {
  return values.some((value) =>
    typeof value === 'number' ? value === status : status >= value[0] && status <= value[1],
  );
}
function delay(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
