import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLADIA_OPENAPI_OPERATIONS } from '../src/api-operations.js';

const openapi = JSON.parse(readFileSync('docs/openapi.json', 'utf8')) as {
  paths: Record<string, unknown>;
  components: { schemas: Record<string, { enum?: string[] }> };
};
const asyncapi = readFileSync('docs/asyncapi.yaml', 'utf8');

describe('official Gladia contracts', () => {
  it('implements every operation published in OpenAPI', () => {
    const methods = new Set(['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']);
    const operations = Object.entries(openapi.paths).flatMap(([path, value]) =>
      Object.keys(value as object)
        .filter((method) => methods.has(method))
        .map((method) => `${method.toUpperCase()} ${path}`),
    );
    expect([...GLADIA_OPENAPI_OPERATIONS].sort()).toEqual(operations.sort());
  });

  it('keeps the supported models visible', () => {
    expect(openapi.components.schemas.TranscriptionSupportedModels.enum).toEqual([
      'solaria-1',
      'solaria-3',
      'solaria-fusion',
    ]);
    expect(openapi.components.schemas.StreamingSupportedModels.enum).toEqual(['solaria-1']);
  });

  it('contains the WebSocket messages used by LiveSession', () => {
    for (const type of [
      'stop_recording',
      'transcript',
      'speech_start',
      'speech_end',
      'start_session',
      'end_session',
    ]) {
      expect(asyncapi).toContain(`type: ${type}`);
    }
  });
});
