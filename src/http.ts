import {
  GladiaApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  type ApiErrorBody,
} from './errors.js';

export interface HttpClientConfig {
  apiKey: string;
  baseUrl: string;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: HttpClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
  }

  async get<T>(path: string, query?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: 'GET', signal });
  }

  async post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
      signal,
    });
  }

  async postForm<T>(path: string, formData: FormData, signal?: AbortSignal): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      body: formData,
      signal,
    });
  }

  async delete(path: string, signal?: AbortSignal): Promise<void> {
    const url = this.buildUrl(path);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers(),
      signal,
    });
    if (!res.ok) {
      await this.throwApiError(res);
    }
  }

  async getBlob(path: string, signal?: AbortSignal): Promise<Blob> {
    const url = this.buildUrl(path);
    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
      signal,
    });
    if (!res.ok) {
      await this.throwApiError(res);
    }
    return res.blob();
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value == null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, String(v));
          }
        } else if (typeof value === 'object') {
          url.searchParams.set(key, JSON.stringify(value));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private headers(): Record<string, string> {
    return { 'x-gladia-key': this.apiKey };
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      ...this.headers(),
      ...(init.headers as Record<string, string> | undefined),
    };

    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
      await this.throwApiError(res);
    }
    return (await res.json()) as T;
  }

  private async throwApiError(res: Response): Promise<never> {
    let body: ApiErrorBody;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = { message: res.statusText, statusCode: res.status };
    }

    switch (res.status) {
      case 400:
        throw new BadRequestError(body);
      case 401:
        throw new UnauthorizedError(body);
      case 403:
        throw new ForbiddenError(body);
      case 404:
        throw new NotFoundError(body);
      case 422:
        throw new UnprocessableEntityError(body);
      default:
        throw new GladiaApiError(res.status, body);
    }
  }
}
