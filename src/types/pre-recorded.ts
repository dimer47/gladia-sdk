import type {
  LanguageConfig,
  CustomVocabularyConfig,
  DiarizationConfig,
  SubtitlesConfig,
  TranslationConfig,
  SummarizationConfig,
  CustomSpellingConfig,
  StructuredDataExtractionConfig,
  AudioToLlmConfig,
  PiiRedactionConfig,
  CallbackConfig,
} from './config.js';
import type { JobStatus, FileResponse } from './common.js';
import type { TranscriptionMetadata, TranscriptionDTO } from './transcription.js';
import type {
  AddonTranslationDTO,
  AddonSummarizationDTO,
  AddonGenericDTO,
  AddonNerDTO,
  AddonSentimentAnalysisDTO,
  AddonChapterizationDTO,
  AddonAudioToLlmDTO,
} from './addons.js';

// ── Request ──────────────────────────────────────────────
export interface PreRecordedRequest {
  audio_url: string;
  language_config?: LanguageConfig;
  custom_vocabulary?: boolean;
  custom_vocabulary_config?: CustomVocabularyConfig;
  sentences?: boolean;
  punctuation_enhanced?: boolean;
  diarization?: boolean;
  diarization_config?: DiarizationConfig;
  subtitles?: boolean;
  subtitles_config?: SubtitlesConfig;
  translation?: boolean;
  translation_config?: TranslationConfig;
  summarization?: boolean;
  summarization_config?: SummarizationConfig;
  sentiment_analysis?: boolean;
  moderation?: boolean;
  named_entity_recognition?: boolean;
  chapterization?: boolean;
  name_consistency?: boolean;
  custom_spelling?: boolean;
  custom_spelling_config?: CustomSpellingConfig;
  structured_data_extraction?: boolean;
  structured_data_extraction_config?: StructuredDataExtractionConfig;
  audio_to_llm?: boolean;
  audio_to_llm_config?: AudioToLlmConfig;
  display_mode?: boolean;
  pii_redaction?: boolean;
  pii_redaction_config?: PiiRedactionConfig;
  callback?: boolean;
  callback_config?: CallbackConfig;
  custom_metadata?: Record<string, unknown>;
}

// ── Responses ────────────────────────────────────────────
export interface PreRecordedCreatedResponse {
  id: string;
  result_url: string;
}

export interface TranscriptionResult {
  metadata?: TranscriptionMetadata;
  transcription?: TranscriptionDTO;
  translation?: AddonTranslationDTO | null;
  summarization?: AddonSummarizationDTO | null;
  moderation?: AddonGenericDTO | null;
  named_entity_recognition?: AddonNerDTO | null;
  sentiment_analysis?: AddonSentimentAnalysisDTO | null;
  chapterization?: AddonChapterizationDTO | null;
  diarization?: AddonGenericDTO | null;
  name_consistency?: AddonGenericDTO | null;
  speaker_reidentification?: AddonGenericDTO | null;
  structured_data_extraction?: AddonGenericDTO | null;
  audio_to_llm?: AddonAudioToLlmDTO | null;
  display_mode?: AddonGenericDTO | null;
}

export interface PreRecordedResponse {
  id: string;
  request_id: string;
  version: number;
  status: JobStatus;
  created_at: string;
  completed_at?: string | null;
  custom_metadata?: Record<string, unknown>;
  error_code?: number | null;
  post_session_metadata: Record<string, unknown>;
  kind: 'pre-recorded';
  file?: FileResponse | null;
  request_params?: Record<string, unknown> | null;
  result?: TranscriptionResult | null;
}
