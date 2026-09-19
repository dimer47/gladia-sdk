import type { HttpClient } from '../http.js';
import type { PaginationParams, PaginatedResponse } from '../types/common.js';
import type { LiveRequest, LiveCreatedResponse, LiveResponse, LiveRegion } from '../types/live.js';
import type { PatchLiveRequest } from '../types/live.js';
import { LiveSession } from '../live/session.js';
import type { WebSocketRetryConfig } from '../types/common.js';

export interface LiveStreamOptions extends LiveRequest {
  region?: LiveRegion;
  /** Custom WebSocket constructor (for Node < 21, pass `ws`) */
  WebSocket?: unknown;
  signal?: AbortSignal;
}

export class LiveResource {
  private readonly WebSocketCtor?: unknown;
  private readonly defaultRegion?: LiveRegion;
  private readonly retry?: Partial<WebSocketRetryConfig>;

  constructor(
    private readonly http: HttpClient,
    WebSocketCtor?: unknown,
    options: { region?: LiveRegion; retry?: Partial<WebSocketRetryConfig> } = {},
  ) {
    this.WebSocketCtor = WebSocketCtor;
    this.defaultRegion = options.region;
    this.retry = options.retry;
  }

  /**
   * Initialize a live transcription session (returns metadata + WebSocket URL).
   */
  async init(
    request?: LiveRequest,
    options?: { region?: LiveRegion; signal?: AbortSignal },
  ): Promise<LiveCreatedResponse> {
    const query: Record<string, unknown> = {};
    const region = options?.region ?? this.defaultRegion;
    if (region) {
      query['region'] = region;
    }
    return this.http.post<LiveCreatedResponse>(
      `/v2/live${buildQuery(query)}`,
      request ?? {},
      options?.signal,
    );
  }

  /**
   * Get a live session by ID.
   */
  async get(id: string, signal?: AbortSignal): Promise<LiveResponse> {
    return this.http.get<LiveResponse>(`/v2/live/${id}`, undefined, signal);
  }

  /**
   * List live sessions with pagination.
   */
  async list(
    params?: PaginationParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<LiveResponse>> {
    return this.http.get<PaginatedResponse<LiveResponse>>(
      '/v2/live',
      params as Record<string, unknown>,
      signal,
    );
  }

  /**
   * Delete a live session.
   */
  async delete(id: string, signal?: AbortSignal): Promise<void> {
    return this.http.delete(`/v2/live/${id}`, signal);
  }

  /** Attach post-session diagnostic metadata to a live job. */
  async patch(id: string, request: PatchLiveRequest, signal?: AbortSignal): Promise<void> {
    return this.http.patch(`/v2/live/${id}`, request, signal);
  }

  /**
   * Download the audio recording of a live session.
   */
  async getFile(id: string, signal?: AbortSignal): Promise<Blob> {
    return this.http.getBlob(`/v2/live/${id}/file`, signal);
  }

  /**
   * High-level helper: init a session and return a connected LiveSession.
   */
  async stream(options?: LiveStreamOptions): Promise<LiveSession> {
    const { region, WebSocket: wsCtor, signal, ...request } = options ?? {};
    const emitAcknowledgments = request.messages_config?.receive_acknowledgments ?? false;

    const messages_config = {
      ...request.messages_config,
      receive_acknowledgments: true,
    };
    const created = await this.init({ ...request, messages_config }, { region, signal });

    return new Promise<LiveSession>((resolve, reject) => {
      const session = new LiveSession(created.url, wsCtor ?? this.WebSocketCtor, this.retry, {
        signal,
        emitAcknowledgments,
        sessionId: created.id,
      });

      const onOpen = () => {
        session.off('open', onOpen);
        session.off('error', onError);
        resolve(session);
      };

      const onError = (err: { message?: string }) => {
        session.off('open', onOpen);
        session.off('error', onError);
        reject(new Error(err.message ?? 'WebSocket connection failed'));
      };

      session.on('open', onOpen);
      session.on('error', onError);
      if (signal?.aborted) onError({ message: 'Live session aborted' });
    });
  }
}

function buildQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value != null) params.set(key, String(value));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}
