import type { HttpClient } from '../http.js';
import type { PaginationParams, PaginatedResponse } from '../types/common.js';
import type { LiveRequest, LiveCreatedResponse, LiveResponse, LiveRegion } from '../types/live.js';
import { LiveSession } from '../live/session.js';

export interface LiveStreamOptions extends LiveRequest {
  region?: LiveRegion;
  /** Custom WebSocket constructor (for Node < 21, pass `ws`) */
  WebSocket?: unknown;
  signal?: AbortSignal;
}

export class LiveResource {
  private readonly WebSocketCtor?: unknown;

  constructor(
    private readonly http: HttpClient,
    WebSocketCtor?: unknown,
  ) {
    this.WebSocketCtor = WebSocketCtor;
  }

  /**
   * Initialize a live transcription session (returns metadata + WebSocket URL).
   */
  async init(
    request?: LiveRequest,
    options?: { region?: LiveRegion; signal?: AbortSignal },
  ): Promise<LiveCreatedResponse> {
    const query: Record<string, unknown> = {};
    if (options?.region) {
      query['region'] = options.region;
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

    const created = await this.init(request, { region, signal });

    return new Promise<LiveSession>((resolve, reject) => {
      const session = new LiveSession(
        created.url,
        wsCtor ?? this.WebSocketCtor,
      );

      const onReady = () => {
        session.off('ready', onReady);
        session.off('error', onError);
        resolve(session);
      };

      const onError = (err: { message?: string }) => {
        session.off('ready', onReady);
        session.off('error', onError);
        reject(new Error(err.message ?? 'WebSocket connection failed'));
      };

      session.on('ready', onReady);
      session.on('error', onError);
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
