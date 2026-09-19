import type { HttpClient } from '../http.js';
import type { UploadResponse } from '../types/upload.js';

export class UploadResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Upload a file (Blob, File, Uint8Array, or Node.js Buffer) to Gladia.
   */
  async fromFile(
    file: Blob | Uint8Array | string,
    filename = 'audio',
    signal?: AbortSignal,
  ): Promise<UploadResponse> {
    if (typeof file === 'string') {
      // Variable imports keep the browser bundle free of statically resolved Node built-ins.
      const fsModule = 'node:fs/promises';
      const pathModule = 'node:path';
      const [{ readFile }, { basename }] = await Promise.all([
        import(fsModule),
        import(pathModule),
      ]);
      const bytes = await readFile(file);
      return this.fromFile(bytes, filename === 'audio' ? basename(file) : filename, signal);
    }
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
