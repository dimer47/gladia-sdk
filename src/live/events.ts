import type { components } from '../generated/openapi.js';
type S = components['schemas'];

export type LiveBaseMessage =
  | S['TranscriptMessage'] | S['SpeechStartMessage'] | S['SpeechEndMessage']
  | S['TranslationMessage'] | S['NamedEntityRecognitionMessage'] | S['SentimentAnalysisMessage']
  | S['PostTranscriptMessage'] | S['PostFinalTranscriptMessage'] | S['PostSummarizationMessage']
  | S['AudioChunkAckMessage'] | S['StopRecordingAckMessage']
  | S['StartSessionMessage'] | S['StartRecordingMessage'] | S['EndRecordingMessage'] | S['EndSessionMessage']
  | LivePostChapterizationMessage | LiveErrorMessage;

export type LiveTranscriptMessage = S['TranscriptMessage'];
export type LiveSpeechMessage = S['SpeechStartMessage'] | S['SpeechEndMessage'];
export type LiveTranslationData = S['TranslationData'];
export type LiveNamedEntityRecognitionData = S['NamedEntityRecognitionData'];
export type LiveSentimentAnalysisData = S['SentimentAnalysisData'];
export type LiveTranslationMessage = S['TranslationMessage'];
export type LiveNamedEntityRecognitionMessage = S['NamedEntityRecognitionMessage'];
export type LiveSentimentAnalysisMessage = S['SentimentAnalysisMessage'];
export type LivePostTranscriptMessage = S['PostTranscriptMessage'];
export type LivePostFinalTranscriptMessage = S['PostFinalTranscriptMessage'];
export type LivePostSummarizationMessage = S['PostSummarizationMessage'];
export type LiveAcknowledgmentMessage = S['AudioChunkAckMessage'] | S['StopRecordingAckMessage'];
export type LiveLifecycleMessage = S['StartSessionMessage'] | S['StartRecordingMessage'] | S['EndRecordingMessage'] | S['EndSessionMessage'];
export type LiveMessageError = S['Error'];

export interface LiveChapter {
  abstractive_summary?: string;
  extractive_summary?: string;
  summary?: string;
  headline?: string;
  gist?: string;
  keywords?: string[];
  start?: number;
  end?: number;
}
export interface LivePostChapterizationMessage {
  session_id: string;
  created_at: string;
  error?: { status_code?: number | string; exception?: string; message?: string } | null;
  type: 'post_chapterization';
  data: { results?: LiveChapter[] };
}
export interface LiveErrorMessage { type: 'error'; code?: number; message?: string; [key: string]: unknown }
/** SDK transport event, not a Gladia protocol message. */
export interface LiveOpenEvent { type: 'open' }

export interface LiveEventMap {
  open: LiveOpenEvent;
  transcript: LiveTranscriptMessage;
  'transcript:partial': LiveTranscriptMessage;
  'transcript:final': LiveTranscriptMessage;
  speech_start: S['SpeechStartMessage'];
  speech_end: S['SpeechEndMessage'];
  translation: LiveTranslationMessage;
  named_entity_recognition: LiveNamedEntityRecognitionMessage;
  sentiment_analysis: LiveSentimentAnalysisMessage;
  post_transcript: LivePostTranscriptMessage;
  post_final_transcript: LivePostFinalTranscriptMessage;
  post_summarization: LivePostSummarizationMessage;
  post_chapterization: LivePostChapterizationMessage;
  audio_chunk: S['AudioChunkAckMessage'];
  stop_recording: S['StopRecordingAckMessage'];
  start_session: S['StartSessionMessage'];
  start_recording: S['StartRecordingMessage'];
  end_recording: S['EndRecordingMessage'];
  end_session: S['EndSessionMessage'];
  error: LiveErrorMessage;
  message: LiveBaseMessage;
}
export type LiveEventName = keyof LiveEventMap;
