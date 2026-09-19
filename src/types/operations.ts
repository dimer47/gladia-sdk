import type { operations } from '../generated/openapi.js';

export type TranscriptionPaginationParams = NonNullable<operations['TranscriptionController_list_v2']['parameters']['query']>;
export type HistoryParams = NonNullable<operations['HistoryController_getList_v1']['parameters']['query']>;
export type AudioToTextRequest = operations['AudioToTextController_audioTranscription']['requestBody']['content']['multipart/form-data'];
export type VideoToTextRequest = operations['VideoToTextController_videoTranscription']['requestBody']['content']['multipart/form-data'];
