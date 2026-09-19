import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { GladiaClient } from '../src/client.js';

const apiKey = process.env['GLADIA_API_KEY'];
const audioFile = process.env['GLADIA_E2E_AUDIO_FILE'];
const liveAudioFile = process.env['GLADIA_E2E_LIVE_AUDIO_FILE'] ?? audioFile;
const enabled = process.env['GLADIA_E2E'] === '1' && Boolean(apiKey && audioFile && liveAudioFile);

describe.skipIf(!enabled)('Gladia real-service end-to-end', () => {
  it('uploads, transcribes, polls, downloads, lists, and deletes a real file', async () => {
    const client = new GladiaClient({ apiKey: apiKey!, httpTimeout: 60_000 });
    let jobId: string | undefined;
    try {
      const uploaded = await client.upload.fromFile(audioFile!);
      expect(uploaded.audio_url).toMatch(/^https?:\/\//);

      const created = await client.preRecorded.create({ audio_url: uploaded.audio_url });
      jobId = created.id;
      const completed = await client.preRecorded.poll(jobId, { timeout: 600_000 });
      expect(completed.status).toBe('done');

      const retrieved = await client.preRecorded.get(jobId);
      expect(retrieved.id).toBe(jobId);
      expect((await client.preRecorded.getFile(jobId)).size).toBeGreaterThan(0);
      expect((await client.preRecorded.list({ limit: 1 })).items).toBeInstanceOf(Array);
      expect((await client.transcription.list({ limit: 1 })).items).toBeInstanceOf(Array);
    } finally {
      if (jobId) await client.preRecorded.delete(jobId).catch(() => undefined);
    }
  });

  it('streams a real file, waits for completion, then downloads and deletes the job', async () => {
    const client = new GladiaClient({ apiKey: apiKey!, httpTimeout: 60_000 });
    const audio = await readFile(liveAudioFile!);
    const session = await client.live.stream({
      encoding: 'wav/pcm',
      messages_config: { receive_lifecycle_events: true },
    });
    const jobId = session.sessionId;
    const finalTranscripts: string[] = [];
    session.on('transcript:final', (message) => {
      finalTranscripts.push(message.data.utterance.text);
    });
    expect(jobId).toBeTruthy();

    try {
      for (let offset = 0; offset < audio.byteLength; offset += 64 * 1024) {
        session.sendAudio(audio.subarray(offset, offset + 64 * 1024));
      }
      await session.stop();
      expect(session.status).toBe('ended');
      expect(finalTranscripts.some((transcript) => transcript.trim().length > 0)).toBe(true);

      const retrieved = await client.live.get(jobId!);
      expect(retrieved.id).toBe(jobId);
      expect((await client.live.getFile(jobId!)).size).toBeGreaterThan(0);
      expect((await client.live.list({ limit: 1 })).items).toBeInstanceOf(Array);
    } finally {
      session.close();
      if (jobId) await client.live.delete(jobId).catch(() => undefined);
    }
  });

  it('checks the remaining safe read-only endpoints', async () => {
    const client = new GladiaClient({ apiKey: apiKey!, httpTimeout: 60_000 });
    expect((await client.history.list({ limit: 1 })).items).toBeInstanceOf(Array);
    await expect(client.models.list()).resolves.toBeUndefined();
  });
});

describe.skipIf(!enabled || process.env['GLADIA_E2E_LEGACY'] !== '1')(
  'Gladia deprecated real-service endpoints',
  () => {
    it('submits the real audio file to the legacy endpoint', async () => {
      const client = new GladiaClient({ apiKey: apiKey!, httpTimeout: 600_000 });
      const audio = await readFile(audioFile!);
      await expect(client.legacy.audioToText({ audio })).resolves.toBeUndefined();
    });
  },
);
