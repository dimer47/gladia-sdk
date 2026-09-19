import type { HttpClient } from '../http.js';
import type { components } from '../generated/openapi.js';
import type { HistoryParams } from '../types/operations.js';

export class HistoryResource {
  constructor(private readonly http: HttpClient) {}
  list(params?: HistoryParams, signal?: AbortSignal): Promise<components['schemas']['ListHistoryResponse']> {
    return this.http.get('/v1/history', params as Record<string, unknown>, signal);
  }
}
