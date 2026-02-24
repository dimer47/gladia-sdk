# 🎙️ Gladia SDK — TypeScript Client

![Version](https://img.shields.io/npm/v/@dimer47/gladia-sdk?color=red&style=flat-square) ![Bundle Size](https://img.shields.io/bundlephobia/minzip/@dimer47/gladia-sdk?color=green&label=bundle%20size&style=flat-square) ![Downloads](https://img.shields.io/npm/dt/@dimer47/gladia-sdk?style=flat-square) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white) ![License](https://img.shields.io/npm/l/@dimer47/gladia-sdk?style=flat-square) ![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square) ![Build](https://img.shields.io/badge/build-ESM%20%2B%20CJS-blue?style=flat-square)

**SDK TypeScript fait main pour l'[API Gladia](https://docs.gladia.io)** — transcription audio/vidéo pré-enregistrée et en temps réel, avec support complet du WebSocket live streaming.

> 🌐 **[English version](README.md)**

> 💡 Fonctionne partout : **Node.js**, **Bun**, **Deno**, et **navigateurs** — zéro dépendance runtime.

## 🎉 Features

- 🎤 **Transcription pré-enregistrée** — envoi par fichier ou URL, polling automatique avec backoff exponentiel
- 🔴 **Live streaming** — WebSocket typé avec événements temps réel (partiels, finaux, speech events)
- 📤 **Upload** — multipart (fichier) ou JSON (URL distante)
- 🌍 **Traduction, résumé, diarisation, analyse de sentiments** — et 10+ addons activables
- 🔒 **PII redaction** — masquage des données personnelles (GDPR, HIPAA...)
- 🏷️ **100% typé** — interfaces TypeScript pour les 54 schemas de l'API
- ⚡ **Dual ESM + CJS** — compatible avec tous les bundlers et runtimes
- 🪶 **0 dépendance** — uniquement `fetch` et `WebSocket` natifs
- 🧪 **91 tests unitaires** — couverture complète sans clé API requise

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
// Depuis un fichier (Blob, File, Buffer)
const uploaded = await gladia.upload.fromFile(myBlob, 'recording.wav');
console.log(uploaded.audio_url);

// Depuis une URL distante
const uploaded = await gladia.upload.fromUrl('https://example.com/audio.mp3');
```

### 🎧 Transcription pré-enregistrée

#### ✅ Mode simple (POST + polling automatique)

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

#### 🔧 Contrôle granulaire

```typescript
// Créer un job
const job = await gladia.preRecorded.create({
  audio_url: 'https://example.com/audio.mp3',
  summarization: true,
  sentiment_analysis: true,
});
console.log(`🆔 Job: ${job.id}`);

// Vérifier le statut
const status = await gladia.preRecorded.get(job.id);
console.log(`📊 Status: ${status.status}`);

// Lister les transcriptions
const list = await gladia.preRecorded.list({ limit: 10 });

// Télécharger le fichier audio original
const audioBlob = await gladia.preRecorded.getFile(job.id);

// Supprimer
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

// 📝 Écouter les transcriptions finales
session.on('transcript:final', (msg) => {
  console.log(`🗣️ ${msg.transcription.text}`);
});

// 📝 Écouter les transcriptions partielles
session.on('transcript:partial', (msg) => {
  process.stdout.write(`... ${msg.transcription.text}\r`);
});

// 🎤 Envoyer des chunks audio
session.sendAudio(audioChunk); // ArrayBuffer | Uint8Array | Blob

// ⏹️ Arrêter et attendre la fin du traitement
await session.stop();
```

#### 🔧 Contrôle granulaire du live

```typescript
// Initialiser sans ouvrir le WebSocket
const liveSession = await gladia.live.init(
  { encoding: 'wav/pcm', sample_rate: 16000 },
  { region: 'eu-west' },
);
console.log(`🔗 WebSocket URL: ${liveSession.url}`);

// Lister, récupérer, supprimer
const sessions = await gladia.live.list({ limit: 5 });
const session = await gladia.live.get('session-id');
const audioBlob = await gladia.live.getFile('session-id');
await gladia.live.delete('session-id');
```

## 📦 Addons disponibles

| Addon | Champ | Config |
|-------|-------|--------|
| 🗣️ Diarisation | `diarization` | `diarization_config` |
| 🌍 Traduction | `translation` | `translation_config` |
| 📝 Résumé | `summarization` | `summarization_config` |
| 💬 Analyse de sentiments | `sentiment_analysis` | — |
| 🏷️ Entités nommées (NER) | `named_entity_recognition` | — |
| 📑 Chapitrage | `chapterization` | — |
| 🔒 PII Redaction | `pii_redaction` | `pii_redaction_config` |
| 📺 Sous-titres | `subtitles` | `subtitles_config` |
| 🤖 Audio to LLM | `audio_to_llm` | `audio_to_llm_config` |
| ✏️ Custom Spelling | `custom_spelling` | `custom_spelling_config` |
| 📊 Extraction structurée | `structured_data_extraction` | `structured_data_extraction_config` |
| 🔤 Custom Vocabulary | `custom_vocabulary` | `custom_vocabulary_config` |
| 🧑 Name Consistency | `name_consistency` | — |
| 🖥️ Display Mode | `display_mode` | — |
| 🚫 Modération | `moderation` | — |

## 🧮 API Reference

### `GladiaClient`

```typescript
new GladiaClient(config: GladiaClientConfig)
```

| Paramètre | Type | Description |
|-----------|------|-------------|
| `apiKey` | `string` | 🔑 Clé API Gladia (obligatoire) |
| `baseUrl` | `string?` | URL de base (défaut: `https://api.gladia.io`) |
| `WebSocket` | `unknown?` | Constructeur WebSocket custom (pour Node < 21, passer `ws`) |

---

### `gladia.upload`

| Méthode | Description |
|---------|-------------|
| `fromFile(blob, filename?, signal?)` | 📤 Upload un fichier (multipart) |
| `fromUrl(url, signal?)` | 🔗 Upload depuis une URL distante |

---

### `gladia.preRecorded`

| Méthode | Description |
|---------|-------------|
| `transcribe(options)` | ✅ POST + polling auto jusqu'à complétion |
| `create(request, signal?)` | 📝 Créer un job de transcription |
| `get(id, signal?)` | 🔍 Récupérer un job par ID |
| `list(params?, signal?)` | 📋 Lister les jobs (paginé) |
| `delete(id, signal?)` | 🗑️ Supprimer un job |
| `getFile(id, signal?)` | 💾 Télécharger le fichier audio original |

---

### `gladia.live`

| Méthode | Description |
|---------|-------------|
| `stream(options?)` | 🔴 Init + ouverture WebSocket → `LiveSession` |
| `init(request?, options?)` | 🔧 Init session (retourne l'URL WebSocket) |
| `get(id, signal?)` | 🔍 Récupérer une session par ID |
| `list(params?, signal?)` | 📋 Lister les sessions (paginé) |
| `delete(id, signal?)` | 🗑️ Supprimer une session |
| `getFile(id, signal?)` | 💾 Télécharger l'enregistrement audio |

---

### `LiveSession`

| Méthode / Propriété | Description |
|---------------------|-------------|
| `on(event, listener)` | 👂 Écouter un événement typé |
| `off(event, listener)` | 🔇 Retirer un listener |
| `sendAudio(data)` | 🎤 Envoyer un chunk audio |
| `stop()` | ⏹️ Signaler la fin et attendre le traitement |
| `closed` | `boolean` — état du WebSocket |

#### 📡 Événements disponibles

| Événement | Type | Description |
|-----------|------|-------------|
| `transcript:final` | `LiveTranscriptMessage` | Transcription finale d'un énoncé |
| `transcript:partial` | `LiveTranscriptMessage` | Transcription partielle en cours |
| `speech-begin` | `LiveSpeechBeginMessage` | Début de parole détecté |
| `speech-end` | `LiveSpeechEndMessage` | Fin de parole détectée |
| `ready` | `LiveReadyMessage` | Session prête à recevoir l'audio |
| `done` | `LiveDoneMessage` | Traitement terminé |
| `error` | `LiveErrorMessage` | Erreur WebSocket |
| `message` | `LiveBaseMessage` | Tout message brut (catch-all) |

## ⚠️ Gestion des erreurs

Le SDK fournit une hiérarchie d'erreurs typées :

```
GladiaError
├── GladiaApiError          (toute erreur HTTP)
│   ├── BadRequestError     (400)
│   ├── UnauthorizedError   (401)
│   ├── ForbiddenError      (403)
│   ├── NotFoundError       (404)
│   └── UnprocessableEntityError (422)
├── GladiaTimeoutError      (polling timeout / abort)
└── GladiaWebSocketError    (erreur WebSocket)
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
    console.error('🔑 Clé API invalide');
  } else if (err instanceof GladiaTimeoutError) {
    console.error('⏱️ Timeout dépassé');
  }
}
```

## 🌐 Compatibilité Node < 21 (WebSocket)

Node.js < 21 n'a pas de `WebSocket` global. Utilisez le package [`ws`](https://www.npmjs.com/package/ws) :

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
npm test          # Exécuter les 91 tests
npm run test:watch  # Mode watch
```

Les tests utilisent des mocks (`fetch`, `WebSocket`) — **aucune clé API nécessaire**.

## 🏗️ Build

```bash
npm run build      # ESM + CJS + .d.ts via tsup
npm run typecheck   # Vérification TypeScript
```

## 📁 Structure du projet

```
gladia-sdk/
├── src/
│   ├── index.ts              # Re-exports publics
│   ├── client.ts             # GladiaClient (façade)
│   ├── http.ts               # HttpClient (fetch wrapper)
│   ├── errors.ts             # Hiérarchie d'erreurs typées
│   ├── types/                # 54 interfaces TypeScript
│   │   ├── config.ts         # LanguageConfig, DiarizationConfig, PiiRedactionConfig...
│   │   ├── common.ts         # JobStatus, PaginationParams, GladiaClientConfig
│   │   ├── upload.ts         # UploadResponse, AudioMetadata
│   │   ├── pre-recorded.ts   # PreRecordedRequest (31 champs), responses
│   │   ├── live.ts           # LiveRequest, LiveResponse, LiveRequestParams
│   │   ├── transcription.ts  # Utterance, Word, TranscriptionDTO
│   │   └── addons.ts         # AddonTranslationDTO, SentimentAnalysisEntry...
│   ├── resources/
│   │   ├── upload.ts         # .fromFile(), .fromUrl()
│   │   ├── pre-recorded.ts   # .create(), .get(), .list(), .delete(), .getFile(), .transcribe()
│   │   └── live.ts           # .init(), .get(), .list(), .delete(), .getFile(), .stream()
│   ├── live/
│   │   ├── session.ts        # LiveSession (WebSocket typé)
│   │   └── events.ts         # LiveEventMap (11 types d'événements)
│   └── utils/
│       └── polling.ts        # poll() avec backoff exponentiel
├── tests/                    # 91 tests unitaires (vitest)
├── docs/
│   └── openapi.yaml          # Spécification OpenAPI Gladia (source de vérité)
├── dist/                     # Build output (ESM + CJS + .d.ts)
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## 🧾 License

[MIT](LICENSE)
