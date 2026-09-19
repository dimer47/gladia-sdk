import type { components } from '../generated/openapi.js';
type S = components['schemas'];
export type Word = S['WordDTO'];
export type Utterance = S['UtteranceDTO'];
export type SubtitleFile = S['SubtitleDTO'];
export type TranscriptionDTO = S['TranscriptionDTO'];
export type TranscriptionMetadata = S['TranscriptionMetadataDTO'];
