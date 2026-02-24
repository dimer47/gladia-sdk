import type { SubtitleFormat } from './config.js';

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Utterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  speaker?: number | null;
  words: Word[];
  text: string;
  language: string;
}

export interface SubtitleFile {
  format: SubtitleFormat;
  subtitles: string;
}

export interface TranscriptionDTO {
  full_transcript: string;
  languages: string[];
  utterances: Utterance[];
  sentences?: Record<string, unknown>[] | null;
  subtitles?: SubtitleFile[] | null;
}

export interface TranscriptionMetadata {
  audio_duration: number;
  number_of_distinct_channels: number;
  billing_time: number;
  transcription_time: number;
}
