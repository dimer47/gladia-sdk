import type { components } from '../generated/openapi.js';
type S = components['schemas'];
export type AddonError = S['AddonErrorDTO'];
/** @deprecated Gladia decommissioned moderation; the API no longer returns it. */
export type AddonGenericDTO = S['ModerationDTO'];
export type TranslationResultEntry = S['TranslationResultDTO'];
export type AddonTranslationDTO = S['TranslationDTO'];
export type AddonSummarizationDTO = S['SummarizationDTO'];
export type SentimentAnalysisEntry = S['SentimentAnalysisResult'];
export type AddonSentimentAnalysisDTO = S['SentimentAnalysisDTO'];
export type NerEntity = S['NamedEntityRecognitionResult'];
export type AddonNerDTO = S['NamedEntityRecognitionDTO'];
export type AudioToLlmResultEntry = S['AudioToLlmResultDTO'];
export type AddonAudioToLlmDTO = S['AudioToLlmListDTO'];
export type SentencesDTO = S['SentencesDTO'];
export type DiarizationDTO = S['DiarizationDTO'];
export type DisplayModeDTO = S['DisplayModeDTO'];
/**
 * @deprecated Gladia decommissioned structured data extraction; the API no longer returns it.
 * Use Audio to LLM instead.
 */
export type StructuredDataExtractionDTO = S['StructuredDataExtractionDTO'];
export type NamesConsistencyDTO = S['NamesConsistencyDTO'];
export type Sentiment = string;
