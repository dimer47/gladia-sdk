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
  next: string | null;
  items: T[];
}

export interface FileResponse {
  id: string;
  filename: string | null;
  source: string | null;
  audio_duration: number | null;
  number_of_channels: number | null;
}

export interface GladiaClientConfig {
  /** Defaults to GLADIA_API_KEY when available. Optional for a custom proxy URL. */
  apiKey?: string;
  baseUrl?: string;
  /** Alias for baseUrl. Defaults to GLADIA_API_URL then https://api.gladia.io. */
  apiUrl?: string;
  region?: 'us-west' | 'eu-west';
  headers?: Record<string, string>;
  httpTimeout?: number;
  httpRetry?: Partial<HttpRetryConfig>;
  websocketRetry?: Partial<WebSocketRetryConfig>;
  /** Custom WebSocket constructor (for Node < 21, pass `ws`) */
  WebSocket?: unknown;
}

export interface HttpRetryConfig {
  maxAttempts: number;
  statusCodes: (number | readonly [number, number])[];
  delay: (attempt: number) => number;
}

export interface WebSocketRetryConfig {
  maxAttempts: number;
  delay: (attempt: number) => number;
  closeCodes: (number | readonly [number, number])[];
  /** Maximum time allowed for each WebSocket connection attempt. */
  timeout: number;
}
