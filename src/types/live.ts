import type {
  LanguageConfig,
  PreProcessingConfig,
  RealtimeProcessingConfig,
  PostProcessingConfig,
  MessagesConfig,
  LiveCallbackConfig,
} from './config.js';
import type { JobStatus, FileResponse } from './common.js';
import type { TranscriptionMetadata, TranscriptionDTO } from './transcription.js';
import type {
  AddonTranslationDTO,
  AddonSummarizationDTO,
  AddonNerDTO,
  AddonSentimentAnalysisDTO,
  AddonChapterizationDTO,
} from './addons.js';

// ── Live Encoding ────────────────────────────────────────
export type LiveEncoding = 'wav/pcm' | 'wav/alaw' | 'wav/ulaw';
export type LiveBitDepth = 8 | 16 | 24 | 32;
export type LiveSampleRate = 8000 | 16000 | 32000 | 44100 | 48000;
export type LiveModel = 'solaria-1';
export type LiveRegion = 'us-west' | 'eu-west';

// ── Request ──────────────────────────────────────────────
export interface LiveRequest {
  encoding?: LiveEncoding;
  bit_depth?: LiveBitDepth;
  sample_rate?: LiveSampleRate;
  channels?: number;
  model?: LiveModel;
  endpointing?: number;
  maximum_duration_without_endpointing?: number;
  language_config?: LanguageConfig;
  pre_processing?: PreProcessingConfig;
  realtime_processing?: RealtimeProcessingConfig;
  post_processing?: PostProcessingConfig;
  messages_config?: MessagesConfig;
  callback?: boolean;
  callback_config?: LiveCallbackConfig;
  custom_metadata?: Record<string, unknown>;
}

// ── Responses ────────────────────────────────────────────
export interface LiveCreatedResponse {
  id: string;
  created_at: string;
  url: string;
}

export interface LiveRequestParams {
  encoding?: LiveEncoding;
  bit_depth?: LiveBitDepth;
  sample_rate?: LiveSampleRate;
  channels?: number;
  model?: LiveModel;
  endpointing?: number;
  maximum_duration_without_endpointing?: number;
  language_config?: LanguageConfig;
  pre_processing?: PreProcessingConfig;
  realtime_processing?: RealtimeProcessingConfig;
  post_processing?: PostProcessingConfig;
  messages_config?: MessagesConfig;
  callback?: boolean;
  callback_config?: LiveCallbackConfig;
}

export interface LiveTranscriptionResult {
  metadata?: TranscriptionMetadata;
  transcription?: TranscriptionDTO;
  translation?: AddonTranslationDTO | null;
  summarization?: AddonSummarizationDTO | null;
  named_entity_recognition?: AddonNerDTO | null;
  sentiment_analysis?: AddonSentimentAnalysisDTO | null;
  chapterization?: AddonChapterizationDTO | null;
  messages?: Record<string, unknown>[];
}

export interface LiveResponse {
  id: string;
  request_id: string;
  version: number;
  status: JobStatus;
  created_at: string;
  completed_at?: string | null;
  custom_metadata?: Record<string, unknown>;
  error_code?: number | null;
  post_session_metadata: Record<string, unknown>;
  kind: 'live';
  file?: FileResponse | null;
  request_params?: LiveRequestParams | null;
  result?: LiveTranscriptionResult | null;
}
