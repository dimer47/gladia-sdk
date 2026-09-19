import type { HttpClient } from '../http.js';

export class ModelsResource {
  constructor(private readonly http: HttpClient) {}
  /** The current OpenAPI contract defines no response body for this operation. */
  list(signal?: AbortSignal): Promise<void> {
    return this.http.getVoid('/v1/models', signal);
  }
}
