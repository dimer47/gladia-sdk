import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { GladiaClient } from '../dist/index.js';

const defaults = {
  prerecorded: 'test-assets/audio/pre-recorded.m4a',
  live: 'test-assets/audio/live-16khz-mono.wav',
};
const argumentsMap = parseArguments(process.argv.slice(2));
if (argumentsMap.help === 'true') {
  printUsage();
  process.exit(0);
}
const prerecordedPath = resolve(argumentsMap.prerecorded ?? defaults.prerecorded);
const livePath = resolve(argumentsMap.live ?? defaults.live);
const keepJobs = argumentsMap['keep-jobs'] === 'true';
const fastLive = argumentsMap.fast === 'true';
const apiKey = process.env['GLADIA_API_KEY'];

if (!apiKey) {
  console.error('GLADIA_API_KEY is missing. Export it only in the current terminal session.');
  process.exit(1);
}
if (typeof globalThis.WebSocket === 'undefined') {
  console.error('This manual Live test requires Node.js 22 or newer.');
  process.exit(1);
}
await requireInputFile('pre-recorded', prerecordedPath, '--prerecorded');
await requireInputFile('Live PCM WAV', livePath, '--live');

const outputDirectory = resolve(
  'test-assets/results',
  new Date().toISOString().replaceAll(':', '-'),
);
await mkdir(outputDirectory, { recursive: true });

const client = new GladiaClient({ apiKey, httpTimeout: 60_000 });
let prerecordedJobId;
let liveJobId;

try {
  console.log(`\n[1/9] Upload M4A: ${basename(prerecordedPath)}`);
  const uploaded = await client.upload.fromFile(prerecordedPath);
  console.log(`      Upload accepted: ${uploaded.audio_url}`);

  console.log('[2/9] Create pre-recorded transcription');
  const created = await client.preRecorded.create({
    audio_url: uploaded.audio_url,
    diarization: true,
    language_config: { code_switching: true },
    sentences: true,
    subtitles: true,
    subtitles_config: { formats: ['srt', 'vtt'] },
  });
  prerecordedJobId = created.id;
  console.log(`      Job: ${prerecordedJobId}`);

  console.log('[3/9] Poll until completion');
  const prerecorded = await client.preRecorded.poll(prerecordedJobId, {
    timeout: 15 * 60_000,
    onPoll: (response) => console.log(`      ${response.status}`),
  });
  await writeJson(`${outputDirectory}/pre-recorded.json`, prerecorded);
  console.log(`      Transcript: ${preview(prerecorded.result?.transcription?.full_transcript)}`);

  console.log('[4/9] Get, list, unified list, and download pre-recorded job');
  await client.preRecorded.get(prerecordedJobId);
  await client.preRecorded.list({ limit: 1 });
  await client.transcription.list({ limit: 1 });
  await saveBlob(
    `${outputDirectory}/pre-recorded-source`,
    await client.preRecorded.getFile(prerecordedJobId),
  );

  console.log(`\n[5/9] Start Live session with: ${basename(livePath)}`);
  const finalTranscripts = [];
  const liveSession = await client.live.stream({
    encoding: 'wav/pcm',
    bit_depth: 16,
    sample_rate: 16000,
    channels: 1,
    language_config: { code_switching: true },
    messages_config: {
      receive_partial_transcripts: true,
      receive_final_transcripts: true,
      receive_speech_events: true,
      receive_lifecycle_events: true,
      receive_acknowledgments: true,
    },
  });
  liveJobId = liveSession.sessionId;
  liveSession.on('transcript:final', (message) => {
    const transcript = message.data.utterance.text;
    finalTranscripts.push(transcript);
    console.log(`      Final: ${transcript}`);
  });

  console.log(`[6/9] Stream ${basename(livePath)}`);
  const liveAudio = await readFile(livePath);
  const bytesPerSecond = 16_000 * 1 * (16 / 8);
  const chunkSize = 32 * 1024;
  for (let offset = 0; offset < liveAudio.byteLength; offset += chunkSize) {
    const chunk = liveAudio.subarray(offset, offset + chunkSize);
    liveSession.sendAudio(chunk);
    await delay(fastLive ? 20 : (chunk.byteLength / bytesPerSecond) * 1_000);
  }

  console.log('[7/9] Stop Live session and wait for post-processing');
  await liveSession.stop();
  if (finalTranscripts.length === 0) throw new Error('No final Live transcript was received');
  await writeJson(`${outputDirectory}/live-transcripts.json`, finalTranscripts);

  console.log('[8/9] Get, list, and download Live job');
  const liveResult = await client.live.get(liveJobId);
  await writeJson(`${outputDirectory}/live-result.json`, liveResult);
  await client.live.list({ limit: 1 });
  await saveBlob(`${outputDirectory}/live-source`, await client.live.getFile(liveJobId));

  console.log('[9/9] Check history and models endpoints');
  await client.history.list({ limit: 1 });
  await client.models.list();

  console.log(`\nManual E2E succeeded. Results: ${outputDirectory}`);
} finally {
  if (keepJobs) {
    console.log('Jobs kept because --keep-jobs was supplied.');
  } else {
    if (liveJobId) await client.live.delete(liveJobId).catch(reportCleanupError('Live', liveJobId));
    if (prerecordedJobId) {
      await client.preRecorded
        .delete(prerecordedJobId)
        .catch(reportCleanupError('Pre-recorded', prerecordedJobId));
    }
    console.log('Created jobs were deleted when possible.');
  }
}

function parseArguments(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index++) {
    const argument = values[index];
    if (!argument.startsWith('--')) continue;
    const key = argument.slice(2);
    const next = values[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index++;
    } else {
      parsed[key] = 'true';
    }
  }
  return parsed;
}

async function requireInputFile(label, path, option) {
  try {
    await access(path);
  } catch {
    console.error(`Missing ${label} audio file: ${path}\n`);
    printUsage();
    process.exit(1);
  }
  if (option === '--live' && !path.toLowerCase().endsWith('.wav')) {
    console.error(`The Live input must be a 16 kHz, mono, 16-bit PCM WAV file: ${path}`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`Manual Gladia end-to-end test

Place private, untracked files at:
  ${defaults.prerecorded}
  ${defaults.live}

Or provide any local paths:
  npm run manual:e2e -- --prerecorded /path/audio.m4a --live /path/audio.wav

The Live file must be 16 kHz, mono, 16-bit PCM WAV. Convert one with:
  ffmpeg -i /path/audio.m4a -ar 16000 -ac 1 -c:a pcm_s16le ${defaults.live}

Set GLADIA_API_KEY only in the current shell. Use --keep-jobs to retain API jobs
or --fast to send Live audio without real-time pacing.`);
}

function preview(value) {
  if (!value) return '(empty)';
  return value.length > 240 ? `${value.slice(0, 240)}…` : value;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function saveBlob(path, blob) {
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => globalThis.setTimeout(resolveDelay, milliseconds));
}

function reportCleanupError(kind, id) {
  return (error) => console.warn(`Unable to delete ${kind} job ${id}:`, error);
}
