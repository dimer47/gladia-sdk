import type { HttpClient } from '../http.js';
import type { components } from '../generated/openapi.js';
import type { PreRecordedRequest, PreRecordedCreatedResponse } from '../types/pre-recorded.js';
import type { TranscriptionPaginationParams } from '../types/operations.js';

type S = components['schemas'];
export class TranscriptionResource {
  constructor(private readonly http: HttpClient) {}
  create(request: PreRecordedRequest, signal?: AbortSignal): Promise<PreRecordedCreatedResponse> {
    return this.http.post('/v2/transcription', request, signal);
  }
  list(params?: TranscriptionPaginationParams, signal?: AbortSignal): Promise<S['ListTranscriptionResponse']> {
    return this.http.get('/v2/transcription', params as Record<string, unknown>, signal);
  }
  get(id: string, signal?: AbortSignal): Promise<S['PreRecordedResponse'] | S['StreamingResponse']> {
    return this.http.get(`/v2/transcription/${id}`, undefined, signal);
  }
  delete(id: string, signal?: AbortSignal): Promise<void> {
    return this.http.delete(`/v2/transcription/${id}`, signal);
  }
  getFile(id: string, signal?: AbortSignal): Promise<Blob> {
    return this.http.getBlob(`/v2/transcription/${id}/file`, signal);
  }
}
