import type { Utterance } from '../types/transcription.js';

// ── Base message ─────────────────────────────────────────
export interface LiveBaseMessage {
  type: string;
  [key: string]: unknown;
}

// ── Transcript messages ──────────────────────────────────
export interface LiveTranscriptMessage {
  type: 'transcript';
  transcription: {
    type: 'partial' | 'final';
    text: string;
    language: string;
    time_begin: number;
    time_end: number;
    utterance: Utterance;
  };
}

// ── Speech events ────────────────────────────────────────
export interface LiveSpeechBeginMessage {
  type: 'speech-begin';
}

export interface LiveSpeechEndMessage {
  type: 'speech-end';
}

// ── Processing events ────────────────────────────────────
export interface LivePreProcessingMessage {
  type: 'pre-processing';
  [key: string]: unknown;
}

export interface LiveRealtimeProcessingMessage {
  type: 'realtime-processing';
  [key: string]: unknown;
}

export interface LivePostProcessingMessage {
  type: 'post-processing';
  [key: string]: unknown;
}

// ── Lifecycle events ─────────────────────────────────────
export interface LiveReadyMessage {
  type: 'ready';
}

export interface LiveDoneMessage {
  type: 'done';
}

// ── Acknowledgment ───────────────────────────────────────
export interface LiveAcknowledgmentMessage {
  type: 'acknowledgment';
  [key: string]: unknown;
}

// ── Error ────────────────────────────────────────────────
export interface LiveErrorMessage {
  type: 'error';
  code?: number;
  message?: string;
  [key: string]: unknown;
}

// ── Event map (for typed .on()) ──────────────────────────
export interface LiveEventMap {
  'transcript:partial': LiveTranscriptMessage;
  'transcript:final': LiveTranscriptMessage;
  'speech-begin': LiveSpeechBeginMessage;
  'speech-end': LiveSpeechEndMessage;
  'pre-processing': LivePreProcessingMessage;
  'realtime-processing': LiveRealtimeProcessingMessage;
  'post-processing': LivePostProcessingMessage;
  ready: LiveReadyMessage;
  done: LiveDoneMessage;
  acknowledgment: LiveAcknowledgmentMessage;
  error: LiveErrorMessage;
  message: LiveBaseMessage;
}

export type LiveEventName = keyof LiveEventMap;
