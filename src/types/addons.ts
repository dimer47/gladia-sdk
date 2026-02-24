import type { Utterance, Word, SubtitleFile } from './transcription.js';

// ── Addon Error ──────────────────────────────────────────
export interface AddonError {
  status_code: number;
  exception: string;
  message: string;
}

// ── Generic Addon ────────────────────────────────────────
export interface AddonGenericDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: unknown;
}

// ── Translation ──────────────────────────────────────────
export interface TranslationResultEntry {
  error?: AddonError;
  full_transcript: string;
  languages: string[];
  sentences?: Record<string, unknown>[] | null;
  subtitles?: SubtitleFile[] | null;
  words: Word[];
  utterances: Utterance[];
}

export interface AddonTranslationDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: TranslationResultEntry[] | null;
}

// ── Summarization ────────────────────────────────────────
export interface AddonSummarizationDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: string | null;
}

// ── Sentiment Analysis ───────────────────────────────────
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed' | 'unknown';

export interface SentimentAnalysisEntry {
  text?: string;
  sentiment?: Sentiment;
  emotion?: string;
  start?: number;
  end?: number;
  channel?: number;
  speaker?: number;
}

export interface AddonSentimentAnalysisDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: SentimentAnalysisEntry[] | null;
}

// ── Named Entity Recognition ─────────────────────────────
export interface NerEntity {
  entity_type?: string;
  text?: string;
  start?: number;
  end?: number;
}

export interface AddonNerDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: NerEntity[] | null;
}

// ── Chapterization ───────────────────────────────────────
export interface Chapter {
  summary?: string;
  headline?: string;
  gist?: string;
  keywords?: string[];
  start?: number;
  end?: number;
}

export interface AddonChapterizationDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: Chapter[] | null;
}

// ── Audio to LLM ─────────────────────────────────────────
export interface AudioToLlmResultEntry {
  success?: boolean;
  is_empty?: boolean;
  results?: {
    prompt?: string;
    response?: string;
  };
  exec_time?: number;
  error?: AddonError;
}

export interface AddonAudioToLlmDTO {
  success: boolean;
  is_empty: boolean;
  exec_time: number;
  error?: AddonError;
  results?: AudioToLlmResultEntry[] | null;
}
