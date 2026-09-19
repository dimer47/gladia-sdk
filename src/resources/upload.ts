import type { HttpClient } from '../http.js';
import type { UploadResponse } from '../types/upload.js';

export class UploadResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Upload a file (Blob, File, Uint8Array, or Node.js Buffer) to Gladia.
   */
  async fromFile(
    file: Blob | Uint8Array,
    filename = 'audio',
    signal?: AbortSignal,
  ): Promise<UploadResponse> {
    const form = new FormData();
    const blob = file instanceof Blob ? file : new Blob([file as BlobPart]);
    form.append('audio', blob, filename);
    return this.http.postForm<UploadResponse>('/v2/upload', form, signal);
  }

  /**
   * Upload from a remote URL.
   */
  async fromUrl(audioUrl: string, signal?: AbortSignal): Promise<UploadResponse> {
    return this.http.post<UploadResponse>('/v2/upload', { audio_url: audioUrl }, signal);
  }
}
