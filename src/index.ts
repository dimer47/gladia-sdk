// ── Client ───────────────────────────────────────────────
export { GladiaClient } from './client.js';
export { GLADIA_OPENAPI_OPERATIONS } from './api-operations.js';

// ── Resources ────────────────────────────────────────────
export { UploadResource } from './resources/upload.js';
export { PreRecordedResource } from './resources/pre-recorded.js';
export type { TranscribeOptions } from './resources/pre-recorded.js';
export { LiveResource } from './resources/live.js';
export type { LiveStreamOptions } from './resources/live.js';
export { TranscriptionResource } from './resources/transcription.js';
export { HistoryResource } from './resources/history.js';
export { ModelsResource } from './resources/models.js';
export { LegacyResource } from './resources/legacy.js';
export type { LegacyAudioRequest, LegacyVideoRequest } from './resources/legacy.js';
export type { paths, operations, components } from './generated/openapi.js';

// ── Live Session ─────────────────────────────────────────
export { LiveSession } from './live/session.js';

// ── Events ───────────────────────────────────────────────
export type {
  LiveEventMap,
  LiveEventName,
  LiveBaseMessage,
  LiveTranscriptMessage,
  LiveSpeechMessage,
  LiveMessageError,
  LiveTranslationData,
  LiveNamedEntityRecognitionData,
  LiveSentimentAnalysisData,
  LiveTranslationMessage,
  LiveNamedEntityRecognitionMessage,
  LiveSentimentAnalysisMessage,
  LivePostTranscriptMessage,
  LivePostFinalTranscriptMessage,
  LivePostSummarizationMessage,
  LivePostChapterizationMessage,
  LiveLifecycleMessage,
  LiveOpenEvent,
  LiveAcknowledgmentMessage,
  LiveErrorMessage,
} from './live/events.js';

// ── Errors ───────────────────────────────────────────────
export {
  GladiaError,
  GladiaApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  GladiaTimeoutError,
  GladiaWebSocketError,
} from './errors.js';
export type { ApiErrorBody } from './errors.js';

// ── Types ────────────────────────────────────────────────
export type {
  // common
  JobStatus,
  PaginationParams,
  PaginatedResponse,
  FileResponse,
  GladiaClientConfig,
  // config
  LanguageConfig,
  CustomVocabularyEntry,
  CustomVocabularyConfig,
  DiarizationConfig,
  SubtitleFormat,
  SubtitleStyle,
  SubtitlesConfig,
  TranslationModel,
  TranslationConfig,
  SummarizationType,
  SummarizationConfig,
  CustomSpellingConfig,
  StructuredDataExtractionDTO,
  AudioToLlmConfig,
  PiiProcessedTextType,
  PiiRedactionConfig,
  CallbackMethod,
  CallbackConfig,
  PreProcessingConfig,
  RealtimeProcessingConfig,
  PostProcessingConfig,
  MessagesConfig,
  LiveCallbackConfig,
  // upload
  AudioMetadata,
  UploadResponse,
  // pre-recorded
  PreRecordedModel,
  PreRecordedRequest,
  PreRecordedCreatedResponse,
  TranscriptionResult,
  PreRecordedResponse,
  // live
  LiveEncoding,
  LiveBitDepth,
  LiveSampleRate,
  LiveModel,
  LiveRegion,
  LiveRequest,
  LiveCreatedResponse,
  LiveRequestParams,
  LiveTranscriptionResult,
  LiveResponse,
  // transcription
  Word,
  Utterance,
  SubtitleFile,
  TranscriptionDTO,
  TranscriptionMetadata,
  // addons
  AddonError,
  AddonGenericDTO,
  TranslationResultEntry,
  AddonTranslationDTO,
  AddonSummarizationDTO,
  Sentiment,
  SentimentAnalysisEntry,
  AddonSentimentAnalysisDTO,
  NerEntity,
  AddonNerDTO,
  AudioToLlmResultEntry,
  AddonAudioToLlmDTO,
} from './types/index.js';

// ── Utils ────────────────────────────────────────────────
export { poll, isTerminalStatus } from './utils/polling.js';
export type { PollOptions } from './utils/polling.js';
