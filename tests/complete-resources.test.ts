import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../src/http.js';
import { TranscriptionResource } from '../src/resources/transcription.js';
import { HistoryResource } from '../src/resources/history.js';
import { ModelsResource } from '../src/resources/models.js';
import { LegacyResource } from '../src/resources/legacy.js';
import { LiveResource } from '../src/resources/live.js';

function mockHttp(): HttpClient {
  return {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
    postForm: vi.fn().mockResolvedValue({}),
    postFormVoid: vi.fn().mockResolvedValue(undefined),
    getVoid: vi.fn().mockResolvedValue(undefined),
    patch: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    getBlob: vi.fn().mockResolvedValue(new Blob()),
  } as unknown as HttpClient;
}

describe('complete OpenAPI resources', () => {
  it('covers every deprecated /v2/transcription operation', async () => {
    const http = mockHttp();
    const resource = new TranscriptionResource(http);
    await resource.create({ audio_url: 'https://example.com/a.mp3' });
    await resource.list({ kind: ['live'] });
    await resource.get('id');
    await resource.delete('id');
    await resource.getFile('id');
    expect(http.post).toHaveBeenCalledWith('/v2/transcription', expect.anything(), undefined);
    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.delete).toHaveBeenCalledWith('/v2/transcription/id', undefined);
    expect(http.getBlob).toHaveBeenCalledWith('/v2/transcription/id/file', undefined);
  });

  it('covers history and models', async () => {
    const http = mockHttp();
    await new HistoryResource(http).list({ limit: 5 });
    await new ModelsResource(http).list();
    expect(http.get).toHaveBeenCalledWith('/v1/history', { limit: 5 }, undefined);
    expect(http.getVoid).toHaveBeenCalledWith('/v1/models', undefined);
  });

  it('covers both legacy media endpoints', async () => {
    const http = mockHttp();
    const legacy = new LegacyResource(http);
    await legacy.audioToText({ audio_url: 'https://example.com/a.mp3' });
    await legacy.videoToText({ video_url: 'https://example.com/v.mp4' });
    expect(http.postFormVoid).toHaveBeenNthCalledWith(1, '/audio/text/audio-transcription', expect.any(FormData), undefined);
    expect(http.postFormVoid).toHaveBeenNthCalledWith(2, '/video/text/video-transcription', expect.any(FormData), undefined);
  });

  it('covers PATCH /v2/live/{id}', async () => {
    const http = mockHttp();
    await new LiveResource(http).patch('id', {});
    expect(http.patch).toHaveBeenCalledWith('/v2/live/id', {}, undefined);
  });
});
