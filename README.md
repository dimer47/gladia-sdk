# 🎙️ Gladia SDK — TypeScript Client

![Version](https://img.shields.io/npm/v/@dimer47/gladia-sdk?color=red&style=flat-square) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@dimer47/gladia-sdk?color=green&label=bundle%20size&style=flat-square) ![Downloads](https://img.shields.io/npm/dt/@dimer47/gladia-sdk?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white) ![License](https://img.shields.io/npm/l/@dimer47/gladia-sdk?style=flat-square) ![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square) ![Build](https://img.shields.io/badge/build-ESM%20%2B%20CJS-blue?style=flat-square)

**Handcrafted TypeScript SDK for the [Gladia API](https://docs.gladia.io)** — supporting both **pre-recorded** transcription (REST + automatic polling) and **real-time live streaming** via WebSocket, with full typed event system.

> 🌐 **[Version française](README.fr.md)**

> 💡 Works everywhere: **Node.js**, **Bun**, **Deno**, and **browsers** — zero runtime dependencies.

## 🎉 Features

- 🎤 **Pre-recorded transcription** — upload by file or URL, automatic polling with exponential backoff
- 🔴 **Live streaming** — typed WebSocket with real-time events (partial, final, speech events)
- 📤 **Upload** — multipart (file) or JSON (remote URL)
- 🌍 **Translation, summarization, diarization, sentiment analysis** — and 10+ toggleable addons
- 🔒 **PII redaction** — personal data masking (GDPR, HIPAA...)
- 🏷️ **100% typed** — TypeScript interfaces for all 54 API schemas
- ⚡ **Dual ESM + CJS** — compatible with all bundlers and runtimes
- 🪶 **0 dependencies** — only native `fetch` and `WebSocket`
- 🧪 **91 unit tests** — full coverage without any API key required

## 📍 Install

```bash
npm install @dimer47/gladia-sdk
```

```bash
yarn add @dimer47/gladia-sdk
```

```bash
pnpm add @dimer47/gladia-sdk
```

## 🚀 Quick Start

```typescript
import { GladiaClient } from '@dimer47/gladia-sdk';

const gladia = new GladiaClient({ apiKey: 'gla_xxx' });
```

## 🕹️ Usage

### 📤 Upload

```typescript
// From a file (Blob, File, Buffer)
const uploaded = await gladia.upload.fromFile(myBlob, 'recording.wav');
console.log(uploaded.audio_url);

// From a remote URL
const uploaded = await gladia.upload.fromUrl('https://example.com/audio.mp3');
```

### 🎧 Pre-recorded Transcription

#### ✅ Simple mode (POST + automatic polling)

```typescript
const result = await gladia.preRecorded.transcribe({
  audio_url: 'https://example.com/audio.mp3',
  diarization: true,
  translation: true,
  translation_config: { target_languages: ['en'] },
  onPoll: (res) => console.log(`⏳ ${res.status}...`),
});

console.log(result.result?.transcription?.full_transcript);
```

#### 🔧 Granular control

```typescript
// Create a job
const job = await gladia.preRecorded.create({
  audio_url: 'https://example.com/audio.mp3',
  summarization: true,
  sentiment_analysis: true,
});
console.log(`🆔 Job: ${job.id}`);

// Check status
const status = await gladia.preRecorded.get(job.id);
console.log(`📊 Status: ${status.status}`);

// List transcriptions
const list = await gladia.preRecorded.list({ limit: 10 });

// Download the original audio file
const audioBlob = await gladia.preRecorded.getFile(job.id);

// Delete
await gladia.preRecorded.delete(job.id);
```

### 🔴 Live Streaming

```typescript
const session = await gladia.live.stream({
  encoding: 'wav/pcm',
  sample_rate: 16000,
  language_config: { languages: ['fr'] },
  realtime_processing: {
    translation: true,
    translation_config: { target_languages: ['en'] },
  },
});

// 📝 Listen to final transcriptions
session.on('transcript:final', (msg) => {
  console.log(`🗣️ ${msg.transcription.text}`);
});

// 📝 Listen to partial transcriptions
session.on('transcript:partial', (msg) => {
  process.stdout.write(`... ${msg.transcription.text}\r`);
});

// 🎤 Send audio chunks
session.sendAudio(audioChunk); // ArrayBuffer | Uint8Array | Blob

// ⏹️ Stop and wait for processing to finish
await session.stop();
```

#### 🔧 Granular live control

```typescript
// Initialize without opening the WebSocket
const liveSession = await gladia.live.init(
  { encoding: 'wav/pcm', sample_rate: 16000 },
  { region: 'eu-west' },
);
console.log(`🔗 WebSocket URL: ${liveSession.url}`);

// List, retrieve, delete
const sessions = await gladia.live.list({ limit: 5 });
const session = await gladia.live.get('session-id');
const audioBlob = await gladia.live.getFile('session-id');
await gladia.live.delete('session-id');
```

## 📦 Available Addons

| Addon | Field | Config |
|-------|-------|--------|
| 🗣️ Diarization | `diarization` | `diarization_config` |
| 🌍 Translation | `translation` | `translation_config` |
| 📝 Summarization | `summarization` | `summarization_config` |
| 💬 Sentiment Analysis | `sentiment_analysis` | — |
| 🏷️ Named Entity Recognition (NER) | `named_entity_recognition` | — |
| 📑 Chapterization | `chapterization` | — |
| 🔒 PII Redaction | `pii_redaction` | `pii_redaction_config` |
| 📺 Subtitles | `subtitles` | `subtitles_config` |
| 🤖 Audio to LLM | `audio_to_llm` | `audio_to_llm_config` |
| ✏️ Custom Spelling | `custom_spelling` | `custom_spelling_config` |
| 📊 Structured Data Extraction | `structured_data_extraction` | `structured_data_extraction_config` |
| 🔤 Custom Vocabulary | `custom_vocabulary` | `custom_vocabulary_config` |
| 🧑 Name Consistency | `name_consistency` | — |
| 🖥️ Display Mode | `display_mode` | — |
| 🚫 Moderation | `moderation` | — |

## 🧮 API Reference

### `GladiaClient`

```typescript
new GladiaClient(config: GladiaClientConfig)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | `string` | 🔑 Gladia API key (required) |
| `baseUrl` | `string?` | Base URL (default: `https://api.gladia.io`) |
| `WebSocket` | `unknown?` | Custom WebSocket constructor (for Node < 21, pass `ws`) |

---

### `gladia.upload`

| Method | Description |
|--------|-------------|
| `fromFile(blob, filename?, signal?)` | 📤 Upload a file (multipart) |
| `fromUrl(url, signal?)` | 🔗 Upload from a remote URL |

---

### `gladia.preRecorded`

| Method | Description |
|--------|-------------|
| `transcribe(options)` | ✅ POST + automatic polling until completion |
| `create(request, signal?)` | 📝 Create a transcription job |
| `get(id, signal?)` | 🔍 Retrieve a job by ID |
| `list(params?, signal?)` | 📋 List jobs (paginated) |
| `delete(id, signal?)` | 🗑️ Delete a job |
| `getFile(id, signal?)` | 💾 Download the original audio file |

---

### `gladia.live`

| Method | Description |
|--------|-------------|
| `stream(options?)` | 🔴 Init + open WebSocket → `LiveSession` |
| `init(request?, options?)` | 🔧 Init session (returns the WebSocket URL) |
| `get(id, signal?)` | 🔍 Retrieve a session by ID |
| `list(params?, signal?)` | 📋 List sessions (paginated) |
| `delete(id, signal?)` | 🗑️ Delete a session |
| `getFile(id, signal?)` | 💾 Download the audio recording |

---

### `LiveSession`

| Method / Property | Description |
|-------------------|-------------|
| `on(event, listener)` | 👂 Listen to a typed event |
| `off(event, listener)` | 🔇 Remove a listener |
| `sendAudio(data)` | 🎤 Send an audio chunk |
| `stop()` | ⏹️ Signal end and wait for processing |
| `closed` | `boolean` — WebSocket state |

#### 📡 Available Events

| Event | Type | Description |
|-------|------|-------------|
| `transcript:final` | `LiveTranscriptMessage` | Final transcription of an utterance |
| `transcript:partial` | `LiveTranscriptMessage` | Partial transcription in progress |
| `speech-begin` | `LiveSpeechBeginMessage` | Speech start detected |
| `speech-end` | `LiveSpeechEndMessage` | Speech end detected |
| `ready` | `LiveReadyMessage` | Session ready to receive audio |
| `done` | `LiveDoneMessage` | Processing complete |
| `error` | `LiveErrorMessage` | WebSocket error |
| `message` | `LiveBaseMessage` | Any raw message (catch-all) |

## ⚠️ Error Handling

The SDK provides a typed error hierarchy:

```
GladiaError
├── GladiaApiError          (any HTTP error)
│   ├── BadRequestError     (400)
│   ├── UnauthorizedError   (401)
│   ├── ForbiddenError      (403)
│   ├── NotFoundError       (404)
│   └── UnprocessableEntityError (422)
├── GladiaTimeoutError      (polling timeout / abort)
└── GladiaWebSocketError    (WebSocket error)
```

```typescript
import { UnauthorizedError, GladiaTimeoutError } from '@dimer47/gladia-sdk';

try {
  const result = await gladia.preRecorded.transcribe({
    audio_url: '...',
    pollTimeout: 60_000,
  });
} catch (err) {
  if (err instanceof UnauthorizedError) {
    console.error('🔑 Invalid API key');
  } else if (err instanceof GladiaTimeoutError) {
    console.error('⏱️ Timeout exceeded');
  }
}
```

## 🌐 Node < 21 Compatibility (WebSocket)

Node.js < 21 does not have a global `WebSocket`. Use the [`ws`](https://www.npmjs.com/package/ws) package:

```bash
npm install ws
```

```typescript
import WebSocket from 'ws';
import { GladiaClient } from '@dimer47/gladia-sdk';

const gladia = new GladiaClient({
  apiKey: 'gla_xxx',
  WebSocket,
});
```

## 🧪 Tests

```bash
npm test            # Run all 91 tests
npm run test:watch  # Watch mode
```

Tests use mocks (`fetch`, `WebSocket`) — **no API key required**.

## 🏗️ Build

```bash
npm run build      # ESM + CJS + .d.ts via tsup
npm run typecheck   # TypeScript type checking
```

## 📁 Project Structure

```
gladia-sdk/
├── src/
│   ├── index.ts              # Public re-exports
│   ├── client.ts             # GladiaClient (facade)
│   ├── http.ts               # HttpClient (fetch wrapper)
│   ├── errors.ts             # Typed error hierarchy
│   ├── types/                # 54 TypeScript interfaces
│   │   ├── config.ts         # LanguageConfig, DiarizationConfig, PiiRedactionConfig...
│   │   ├── common.ts         # JobStatus, PaginationParams, GladiaClientConfig
│   │   ├── upload.ts         # UploadResponse, AudioMetadata
│   │   ├── pre-recorded.ts   # PreRecordedRequest (31 fields), responses
│   │   ├── live.ts           # LiveRequest, LiveResponse, LiveRequestParams
│   │   ├── transcription.ts  # Utterance, Word, TranscriptionDTO
│   │   └── addons.ts         # AddonTranslationDTO, SentimentAnalysisEntry...
│   ├── resources/
│   │   ├── upload.ts         # .fromFile(), .fromUrl()
│   │   ├── pre-recorded.ts   # .create(), .get(), .list(), .delete(), .getFile(), .transcribe()
│   │   └── live.ts           # .init(), .get(), .list(), .delete(), .getFile(), .stream()
│   ├── live/
│   │   ├── session.ts        # LiveSession (typed WebSocket)
│   │   └── events.ts         # LiveEventMap (11 event types)
│   └── utils/
│       └── polling.ts        # poll() with exponential backoff
├── tests/                    # 91 unit tests (vitest)
├── docs/
│   └── openapi.yaml          # Gladia OpenAPI specification (source of truth)
├── dist/                     # Build output (ESM + CJS + .d.ts)
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## 🧾 License

[MIT](LICENSE)
