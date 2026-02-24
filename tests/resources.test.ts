import { describe, it, expect, vi } from 'vitest';
import { UploadResource } from '../src/resources/upload.js';
import { PreRecordedResource } from '../src/resources/pre-recorded.js';
import { LiveResource } from '../src/resources/live.js';
import type { HttpClient } from '../src/http.js';

function createMockHttp(): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    delete: vi.fn(),
    getBlob: vi.fn(),
  } as unknown as HttpClient;
}

// ──────────────────────────────────────────────────────────
// UploadResource
// ──────────────────────────────────────────────────────────
describe('UploadResource', () => {
  it('fromFile() appelle postForm avec le bon path et FormData', async () => {
    const http = createMockHttp();
    const expected = { audio_url: 'https://api.gladia.io/file/abc', audio_metadata: {} };
    (http.postForm as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new UploadResource(http);
    const blob = new Blob(['fake audio']);
    const result = await resource.fromFile(blob, 'test.wav');

    expect(http.postForm).toHaveBeenCalledOnce();
    const [path, form] = (http.postForm as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe('/v2/upload');
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('audio')).toBeTruthy();
    expect(result).toBe(expected);
  });

  it('fromFile() utilise "audio" comme nom par défaut', async () => {
    const http = createMockHttp();
    (http.postForm as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const resource = new UploadResource(http);
    await resource.fromFile(new Blob(['data']));

    const [, form] = (http.postForm as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(form).toBeInstanceOf(FormData);
  });

  it('fromUrl() appelle post avec le bon body', async () => {
    const http = createMockHttp();
    const expected = { audio_url: 'https://api.gladia.io/file/abc' };
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new UploadResource(http);
    const result = await resource.fromUrl('https://example.com/audio.mp3');

    expect(http.post).toHaveBeenCalledWith(
      '/v2/upload',
      { audio_url: 'https://example.com/audio.mp3' },
      undefined,
    );
    expect(result).toBe(expected);
  });
});

// ──────────────────────────────────────────────────────────
// PreRecordedResource
// ──────────────────────────────────────────────────────────
describe('PreRecordedResource', () => {
  it('create() POST /v2/pre-recorded', async () => {
    const http = createMockHttp();
    const expected = { id: 'job-123', result_url: 'https://api.gladia.io/v2/pre-recorded/job-123' };
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new PreRecordedResource(http);
    const result = await resource.create({ audio_url: 'https://a.mp3' });

    expect(http.post).toHaveBeenCalledWith(
      '/v2/pre-recorded',
      { audio_url: 'https://a.mp3' },
      undefined,
    );
    expect(result).toBe(expected);
  });

  it('get() GET /v2/pre-recorded/{id}', async () => {
    const http = createMockHttp();
    const expected = { id: 'job-123', status: 'done' };
    (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new PreRecordedResource(http);
    const result = await resource.get('job-123');

    expect(http.get).toHaveBeenCalledWith('/v2/pre-recorded/job-123', undefined, undefined);
    expect(result).toBe(expected);
  });

  it('list() GET /v2/pre-recorded avec params', async () => {
    const http = createMockHttp();
    const expected = { items: [], first: '', current: '' };
    (http.get as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new PreRecordedResource(http);
    const result = await resource.list({ limit: 5, offset: 10 });

    expect(http.get).toHaveBeenCalledWith(
      '/v2/pre-recorded',
      { limit: 5, offset: 10 },
      undefined,
    );
    expect(result).toBe(expected);
  });

  it('delete() DELETE /v2/pre-recorded/{id}', async () => {
    const http = createMockHttp();
    (http.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const resource = new PreRecordedResource(http);
    await resource.delete('job-123');

    expect(http.delete).toHaveBeenCalledWith('/v2/pre-recorded/job-123', undefined);
  });

  it('getFile() GET /v2/pre-recorded/{id}/file', async () => {
    const http = createMockHttp();
    const blob = new Blob(['audio data']);
    (http.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(blob);

    const resource = new PreRecordedResource(http);
    const result = await resource.getFile('job-123');

    expect(http.getBlob).toHaveBeenCalledWith('/v2/pre-recorded/job-123/file', undefined);
    expect(result).toBe(blob);
  });

  it('transcribe() fait create + poll et retourne le résultat final', async () => {
    const http = createMockHttp();
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'job-1', result_url: '' });

    let callCount = 0;
    (http.get as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        id: 'job-1',
        status: callCount >= 2 ? 'done' : 'processing',
        result: callCount >= 2 ? { transcription: { full_transcript: 'Hello' } } : null,
      });
    });

    const onPoll = vi.fn();
    const resource = new PreRecordedResource(http);
    const result = await resource.transcribe({
      audio_url: 'https://a.mp3',
      diarization: true,
      onPoll,
      pollTimeout: 5000,
    });

    // create a été appelé avec les bons params (sans onPoll/pollTimeout/signal)
    expect(http.post).toHaveBeenCalledWith(
      '/v2/pre-recorded',
      { audio_url: 'https://a.mp3', diarization: true },
      undefined,
    );
    // get a été appelé au moins 2 fois
    expect(callCount).toBe(2);
    expect(result.status).toBe('done');
    expect(onPoll).toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────
// LiveResource
// ──────────────────────────────────────────────────────────
describe('LiveResource', () => {
  it('init() POST /v2/live avec body et region', async () => {
    const http = createMockHttp();
    const expected = { id: 'live-1', created_at: '2024-01-01', url: 'wss://api.gladia.io/v2/live?token=abc' };
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue(expected);

    const resource = new LiveResource(http);
    const result = await resource.init(
      { encoding: 'wav/pcm', sample_rate: 16000 },
      { region: 'eu-west' },
    );

    const [path, body] = (http.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe('/v2/live?region=eu-west');
    expect(body).toEqual({ encoding: 'wav/pcm', sample_rate: 16000 });
    expect(result).toBe(expected);
  });

  it('init() sans region ne met pas de query param', async () => {
    const http = createMockHttp();
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '1', created_at: '', url: '' });

    const resource = new LiveResource(http);
    await resource.init({});

    const [path] = (http.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe('/v2/live');
  });

  it('get() GET /v2/live/{id}', async () => {
    const http = createMockHttp();
    (http.get as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'live-1' });

    const resource = new LiveResource(http);
    await resource.get('live-1');

    expect(http.get).toHaveBeenCalledWith('/v2/live/live-1', undefined, undefined);
  });

  it('list() GET /v2/live', async () => {
    const http = createMockHttp();
    (http.get as ReturnType<typeof vi.fn>).mockResolvedValue({ items: [] });

    const resource = new LiveResource(http);
    await resource.list({ limit: 20 });

    expect(http.get).toHaveBeenCalledWith('/v2/live', { limit: 20 }, undefined);
  });

  it('delete() DELETE /v2/live/{id}', async () => {
    const http = createMockHttp();
    (http.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const resource = new LiveResource(http);
    await resource.delete('live-1');

    expect(http.delete).toHaveBeenCalledWith('/v2/live/live-1', undefined);
  });

  it('getFile() GET /v2/live/{id}/file', async () => {
    const http = createMockHttp();
    const blob = new Blob(['live audio']);
    (http.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(blob);

    const resource = new LiveResource(http);
    const result = await resource.getFile('live-1');

    expect(http.getBlob).toHaveBeenCalledWith('/v2/live/live-1/file', undefined);
    expect(result).toBe(blob);
  });
});
