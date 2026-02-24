// ── Language ──────────────────────────────────────────────
export interface LanguageConfig {
  languages?: string[];
  code_switching?: boolean;
}

// ── Custom Vocabulary ────────────────────────────────────
export interface CustomVocabularyEntry {
  value: string;
  intensity?: number;
  pronunciations?: string[];
  language?: string;
}

export interface CustomVocabularyConfig {
  vocabulary?: (string | CustomVocabularyEntry)[];
  default_intensity?: number;
}

// ── Diarization ──────────────────────────────────────────
export interface DiarizationConfig {
  number_of_speakers?: number;
  min_speakers?: number;
  max_speakers?: number;
}

// ── Subtitles ────────────────────────────────────────────
export type SubtitleFormat = 'srt' | 'vtt';
export type SubtitleStyle = 'default' | 'compliance';

export interface SubtitlesConfig {
  formats?: SubtitleFormat[];
  minimum_duration?: number;
  maximum_duration?: number;
  maximum_characters_per_row?: number;
  maximum_rows_per_caption?: number;
  style?: SubtitleStyle;
}

// ── Translation ──────────────────────────────────────────
export type TranslationModel = 'base' | 'enhanced';

export interface TranslationConfig {
  target_languages: string[];
  model?: TranslationModel;
  match_original_utterances?: boolean;
  lipsync?: boolean;
  context_adaptation?: boolean;
  informal?: boolean;
  context?: string;
}

// ── Summarization ────────────────────────────────────────
export type SummarizationType = 'general' | 'bullet_points' | 'concise';

export interface SummarizationConfig {
  type?: SummarizationType;
}

// ── Custom Spelling ──────────────────────────────────────
export interface CustomSpellingConfig {
  spelling_dictionary: Record<string, string[]>;
}

// ── Structured Data Extraction ───────────────────────────
export interface StructuredDataExtractionConfig {
  classes: string[];
}

// ── Audio to LLM ─────────────────────────────────────────
export interface AudioToLlmConfig {
  prompts: string[];
}

// ── PII Redaction ────────────────────────────────────────
export type PiiProcessedTextType = 'MASK' | 'MARKER';

export interface PiiRedactionConfig {
  entity_types?: string[];
  processed_text_type?: PiiProcessedTextType;
}

// ── Callback ─────────────────────────────────────────────
export type CallbackMethod = 'POST' | 'PUT';

export interface CallbackConfig {
  url: string;
  method?: CallbackMethod;
}

// ── Live Pre-processing ──────────────────────────────────
export interface PreProcessingConfig {
  audio_enhancer?: boolean;
  speech_threshold?: number;
}

// ── Live Realtime Processing ─────────────────────────────
export interface RealtimeProcessingConfig {
  custom_vocabulary?: boolean;
  custom_vocabulary_config?: CustomVocabularyConfig;
  custom_spelling?: boolean;
  custom_spelling_config?: CustomSpellingConfig;
  translation?: boolean;
  translation_config?: TranslationConfig;
  named_entity_recognition?: boolean;
  sentiment_analysis?: boolean;
}

// ── Live Post Processing ─────────────────────────────────
export interface PostProcessingConfig {
  summarization?: boolean;
  summarization_config?: SummarizationConfig;
  chapterization?: boolean;
}

// ── Live Messages Config ─────────────────────────────────
export interface MessagesConfig {
  receive_partial_transcripts?: boolean;
  receive_final_transcripts?: boolean;
  receive_speech_events?: boolean;
  receive_pre_processing_events?: boolean;
  receive_realtime_processing_events?: boolean;
  receive_post_processing_events?: boolean;
  receive_acknowledgments?: boolean;
  receive_errors?: boolean;
  receive_lifecycle_events?: boolean;
}

// ── Live Callback Config ─────────────────────────────────
export interface LiveCallbackConfig {
  url: string;
  receive_partial_transcripts?: boolean;
  receive_final_transcripts?: boolean;
  receive_speech_events?: boolean;
  receive_pre_processing_events?: boolean;
  receive_realtime_processing_events?: boolean;
  receive_post_processing_events?: boolean;
  receive_acknowledgments?: boolean;
  receive_errors?: boolean;
  receive_lifecycle_events?: boolean;
}
