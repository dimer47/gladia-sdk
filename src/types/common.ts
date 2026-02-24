export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface PaginationParams {
  offset?: number;
  limit?: number;
  date?: string;
  before_date?: string;
  after_date?: string;
  status?: JobStatus[];
  custom_metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  first: string;
  current: string;
  next?: string | null;
  items: T[];
}

export interface FileResponse {
  id?: string;
  filename?: string | null;
  source?: string | null;
  audio_duration?: number | null;
  number_of_channels?: number | null;
}

export interface GladiaClientConfig {
  apiKey: string;
  baseUrl?: string;
  /** Custom WebSocket constructor (for Node < 21, pass `ws`) */
  WebSocket?: unknown;
}
