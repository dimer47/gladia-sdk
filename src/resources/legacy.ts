import type { HttpClient } from '../http.js';
import type { AudioToTextRequest, VideoToTextRequest } from '../types/operations.js';

export type LegacyAudioRequest = Omit<AudioToTextRequest, 'audio'> & { audio?: Blob | Uint8Array };
export type LegacyVideoRequest = Omit<VideoToTextRequest, 'video'> & { video?: Blob | Uint8Array };

/** @deprecated Gladia v1 media-to-text endpoints. Prefer preRecorded. */
export class LegacyResource {
  constructor(private readonly http: HttpClient) {}

  async audioToText(request: LegacyAudioRequest, signal?: AbortSignal): Promise<void> {
    return this.http.postFormVoid('/audio/text/audio-transcription', toForm(request, 'audio'), signal);
  }

  async videoToText(request: LegacyVideoRequest, signal?: AbortSignal): Promise<void> {
    return this.http.postFormVoid('/video/text/video-transcription', toForm(request, 'video'), signal);
  }
}

function toForm(request: Record<string, unknown>, fileKey: string): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(request)) {
    if (value == null) continue;
    if (key === fileKey && (value instanceof Blob || value instanceof Uint8Array)) {
      const blob = value instanceof Blob ? value : new Blob([value as BlobPart]);
      form.append(key, blob, fileKey);
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}
