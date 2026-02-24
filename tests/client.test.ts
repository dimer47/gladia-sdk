import { describe, it, expect } from 'vitest';
import { GladiaClient } from '../src/client.js';
import { UploadResource } from '../src/resources/upload.js';
import { PreRecordedResource } from '../src/resources/pre-recorded.js';
import { LiveResource } from '../src/resources/live.js';

describe('GladiaClient', () => {
  it('crée un client avec une apiKey', () => {
    const client = new GladiaClient({ apiKey: 'gla_test123' });

    expect(client).toBeInstanceOf(GladiaClient);
    expect(client.upload).toBeInstanceOf(UploadResource);
    expect(client.preRecorded).toBeInstanceOf(PreRecordedResource);
    expect(client.live).toBeInstanceOf(LiveResource);
  });

  it('lance une erreur si apiKey est vide', () => {
    expect(() => new GladiaClient({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('accepte un baseUrl personnalisé', () => {
    const client = new GladiaClient({
      apiKey: 'gla_test',
      baseUrl: 'https://custom.gladia.io',
    });
    expect(client).toBeInstanceOf(GladiaClient);
  });

  it('accepte un constructeur WebSocket personnalisé', () => {
    const MockWS = class {};
    const client = new GladiaClient({
      apiKey: 'gla_test',
      WebSocket: MockWS,
    });
    expect(client).toBeInstanceOf(GladiaClient);
    expect(client.live).toBeInstanceOf(LiveResource);
  });
});
