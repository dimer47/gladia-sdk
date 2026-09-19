/** Every operation published by Gladia's current OpenAPI document. */
export const GLADIA_OPENAPI_OPERATIONS = [
  'POST /v2/upload',
  'GET /v2/pre-recorded', 'POST /v2/pre-recorded',
  'GET /v2/pre-recorded/{id}', 'DELETE /v2/pre-recorded/{id}', 'GET /v2/pre-recorded/{id}/file',
  'GET /v2/transcription', 'POST /v2/transcription',
  'GET /v2/transcription/{id}', 'DELETE /v2/transcription/{id}', 'GET /v2/transcription/{id}/file',
  'POST /audio/text/audio-transcription', 'POST /video/text/video-transcription',
  'GET /v1/history',
  'GET /v2/live', 'POST /v2/live',
  'GET /v2/live/{id}', 'DELETE /v2/live/{id}', 'PATCH /v2/live/{id}', 'GET /v2/live/{id}/file',
  'GET /v1/models',
] as const;
