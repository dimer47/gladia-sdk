import type { GladiaClientConfig } from './types/common.js';
import { HttpClient } from './http.js';
import { UploadResource } from './resources/upload.js';
import { PreRecordedResource } from './resources/pre-recorded.js';
import { LiveResource } from './resources/live.js';
import { TranscriptionResource } from './resources/transcription.js';
import { HistoryResource } from './resources/history.js';
import { ModelsResource } from './resources/models.js';
import { LegacyResource } from './resources/legacy.js';
import { SDK_VERSION } from './version.js';

const DEFAULT_BASE_URL = 'https://api.gladia.io';

export class GladiaClient {
  readonly upload: UploadResource;
  readonly preRecorded: PreRecordedResource;
  readonly live: LiveResource;
  readonly transcription: TranscriptionResource;
  readonly history: HistoryResource;
  readonly models: ModelsResource;
  readonly legacy: LegacyResource;

  constructor(config: GladiaClientConfig = {}) {
    const env = (
      globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
    ).process?.env;
    const apiKey = config.apiKey ?? env?.['GLADIA_API_KEY'];
    const baseUrl = config.apiUrl ?? config.baseUrl ?? env?.['GLADIA_API_URL'] ?? DEFAULT_BASE_URL;
    const hostname = new URL(baseUrl).hostname;
    if (!apiKey && hostname.endsWith('.gladia.io'))
      throw new Error('apiKey is required for Gladia API URLs');

    const http = new HttpClient({
      apiKey,
      baseUrl,
      headers: { 'x-gladia-version': `SdkJavascriptCommunity/${SDK_VERSION}`, ...config.headers },
      timeout: config.httpTimeout,
      retry: config.httpRetry,
    });

    this.upload = new UploadResource(http);
    this.preRecorded = new PreRecordedResource(http);
    this.live = new LiveResource(http, config.WebSocket, {
      region: config.region ?? (env?.['GLADIA_REGION'] as 'us-west' | 'eu-west' | undefined),
      retry: config.websocketRetry,
    });
    this.transcription = new TranscriptionResource(http);
    this.history = new HistoryResource(http);
    this.models = new ModelsResource(http);
    this.legacy = new LegacyResource(http);
  }
}
