import type { GladiaClientConfig } from './types/common.js';
import { HttpClient } from './http.js';
import { UploadResource } from './resources/upload.js';
import { PreRecordedResource } from './resources/pre-recorded.js';
import { LiveResource } from './resources/live.js';
import { TranscriptionResource } from './resources/transcription.js';
import { HistoryResource } from './resources/history.js';
import { ModelsResource } from './resources/models.js';
import { LegacyResource } from './resources/legacy.js';

const DEFAULT_BASE_URL = 'https://api.gladia.io';

export class GladiaClient {
  readonly upload: UploadResource;
  readonly preRecorded: PreRecordedResource;
  readonly live: LiveResource;
  readonly transcription: TranscriptionResource;
  readonly history: HistoryResource;
  readonly models: ModelsResource;
  readonly legacy: LegacyResource;

  constructor(config: GladiaClientConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    const http = new HttpClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    });

    this.upload = new UploadResource(http);
    this.preRecorded = new PreRecordedResource(http);
    this.live = new LiveResource(http, config.WebSocket);
    this.transcription = new TranscriptionResource(http);
    this.history = new HistoryResource(http);
    this.models = new ModelsResource(http);
    this.legacy = new LegacyResource(http);
  }
}
