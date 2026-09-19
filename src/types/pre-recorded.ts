import type { components } from '../generated/openapi.js';
type S = components['schemas'];
export type PreRecordedModel = S['TranscriptionSupportedModels'];
export type PreRecordedRequest = S['InitTranscriptionRequest'];
export type PreRecordedRequestParams = S['PreRecordedRequestParamsResponse'];
export type PreRecordedCreatedResponse = S['InitPreRecordedTranscriptionResponse'];
export type TranscriptionResult = S['TranscriptionResultDTO'];
export type PreRecordedResponse = S['PreRecordedResponse'];
export type ListPreRecordedResponse = S['ListPreRecordedResponse'];
