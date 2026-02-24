import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../src/http.js';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  GladiaApiError,
} from '../src/errors.js';

function mockFetch(status: number, body: unknown, ok?: boolean) {
  return vi.fn().mockResolvedValue({
    ok: ok ?? (status >= 200 && status < 300),
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob(['data'])),
  });
}

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({ apiKey: 'test-key', baseUrl: 'https://api.example.com/' });
  });

  describe('get()', () => {
    it('envoie un GET avec le header x-gladia-key', async () => {
      const fetch = mockFetch(200, { data: 'ok' });
      vi.stubGlobal('fetch', fetch);

      const result = await client.get<{ data: string }>('/v2/test');

      expect(fetch).toHaveBeenCalledOnce();
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v2/test');
      expect(init.method).toBe('GET');
      expect(init.headers['x-gladia-key']).toBe('test-key');
      expect(result).toEqual({ data: 'ok' });
    });

    it('construit les query params simples', async () => {
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await client.get('/v2/test', { offset: 0, limit: 10 });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('offset=0');
      expect(url).toContain('limit=10');
    });

    it('gère les query params tableaux', async () => {
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await client.get('/v2/test', { status: ['queued', 'done'] });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('status=queued');
      expect(url).toContain('status=done');
    });

    it('sérialise les query params objet en JSON', async () => {
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await client.get('/v2/test', { custom_metadata: { user: 'John' } });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('custom_metadata=');
      expect(decodeURIComponent(url)).toContain('{"user":"John"}');
    });

    it('ignore les query params null/undefined', async () => {
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await client.get('/v2/test', { a: null, b: undefined, c: 'ok' });

      const url = fetch.mock.calls[0][0];
      expect(url).not.toContain('a=');
      expect(url).not.toContain('b=');
      expect(url).toContain('c=ok');
    });
  });

  describe('post()', () => {
    it('envoie un POST JSON avec Content-Type', async () => {
      const fetch = mockFetch(201, { id: '123' });
      vi.stubGlobal('fetch', fetch);

      const result = await client.post<{ id: string }>('/v2/create', { audio_url: 'http://a.mp3' });

      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v2/create');
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers['x-gladia-key']).toBe('test-key');
      expect(JSON.parse(init.body)).toEqual({ audio_url: 'http://a.mp3' });
      expect(result).toEqual({ id: '123' });
    });

    it('envoie un body undefined si body est null', async () => {
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await client.post('/v2/test', null);

      const [, init] = fetch.mock.calls[0];
      expect(init.body).toBeUndefined();
    });
  });

  describe('postForm()', () => {
    it('envoie un POST avec FormData sans Content-Type explicite', async () => {
      const fetch = mockFetch(200, { audio_url: 'http://gladia.io/file/123' });
      vi.stubGlobal('fetch', fetch);

      const form = new FormData();
      form.append('audio', new Blob(['fake']), 'test.wav');

      const result = await client.postForm('/v2/upload', form);

      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v2/upload');
      expect(init.method).toBe('POST');
      expect(init.body).toBe(form);
      // Le Content-Type ne doit PAS être forcé (le navigateur ajoute le boundary)
      expect(init.headers['Content-Type']).toBeUndefined();
      expect(init.headers['x-gladia-key']).toBe('test-key');
      expect(result).toEqual({ audio_url: 'http://gladia.io/file/123' });
    });
  });

  describe('delete()', () => {
    it('envoie un DELETE', async () => {
      const fetch = mockFetch(202, null, true);
      vi.stubGlobal('fetch', fetch);

      await client.delete('/v2/pre-recorded/abc');

      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v2/pre-recorded/abc');
      expect(init.method).toBe('DELETE');
      expect(init.headers['x-gladia-key']).toBe('test-key');
    });
  });

  describe('getBlob()', () => {
    it('retourne un Blob', async () => {
      const fetch = mockFetch(200, null, true);
      vi.stubGlobal('fetch', fetch);

      const blob = await client.getBlob('/v2/pre-recorded/abc/file');

      expect(blob).toBeInstanceOf(Blob);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe('https://api.example.com/v2/pre-recorded/abc/file');
      expect(init.method).toBe('GET');
    });
  });

  describe('gestion des erreurs HTTP', () => {
    it.each([
      [400, BadRequestError],
      [401, UnauthorizedError],
      [403, ForbiddenError],
      [404, NotFoundError],
      [422, UnprocessableEntityError],
    ] as const)('status %i → %s', async (status, ErrorClass) => {
      const fetch = mockFetch(status, { message: 'err', statusCode: status }, false);
      vi.stubGlobal('fetch', fetch);

      await expect(client.get('/fail')).rejects.toThrow(ErrorClass);
    });

    it('status inconnu → GladiaApiError générique', async () => {
      const fetch = mockFetch(503, { message: 'down' }, false);
      vi.stubGlobal('fetch', fetch);

      await expect(client.get('/fail')).rejects.toThrow(GladiaApiError);
      try {
        await client.get('/fail');
      } catch (e) {
        expect((e as GladiaApiError).status).toBe(503);
      }
    });

    it('gère un body non-JSON en erreur', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('not json')),
      }));

      try {
        await client.get('/fail');
      } catch (e) {
        expect(e).toBeInstanceOf(GladiaApiError);
        expect((e as GladiaApiError).status).toBe(500);
        expect((e as GladiaApiError).body.message).toBe('Internal Server Error');
      }
    });

    it('les erreurs de delete sont aussi mappées', async () => {
      const fetch = mockFetch(403, { message: 'forbidden' }, false);
      vi.stubGlobal('fetch', fetch);

      await expect(client.delete('/v2/test/123')).rejects.toThrow(ForbiddenError);
    });

    it('les erreurs de getBlob sont aussi mappées', async () => {
      const fetch = mockFetch(404, { message: 'not found' }, false);
      vi.stubGlobal('fetch', fetch);

      await expect(client.getBlob('/v2/test/123/file')).rejects.toThrow(NotFoundError);
    });
  });

  describe('baseUrl trailing slash', () => {
    it('supprime les slashes de fin', async () => {
      const c = new HttpClient({ apiKey: 'k', baseUrl: 'https://api.example.com///' });
      const fetch = mockFetch(200, {});
      vi.stubGlobal('fetch', fetch);

      await c.get('/v2/test');

      expect(fetch.mock.calls[0][0]).toBe('https://api.example.com/v2/test');
    });
  });
});
