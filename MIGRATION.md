# Migration guide

## 2.0 to 2.1

Version 2.1 is backward compatible for REST usage. Live sessions add resilience and expose more
transport state:

- `new GladiaClient()` now reads `GLADIA_API_KEY`, `GLADIA_API_URL`, and `GLADIA_REGION`.
- `LiveSession.status` exposes `starting`, `connecting`, `connected`, `ending`, and `ended`.
- New `connecting`, `connected`, `ending`, and `ended` events describe transport transitions.
- `LiveSession.sessionId` contains the ID returned by `POST /v2/live` when using `live.stream()`.
- `sendAudioBase64()` is buffered and replayed after reconnects, like binary audio.
- Internally forced acknowledgment messages remain hidden unless
  `messages_config.receive_acknowledgments` was explicitly enabled.
- The `AbortSignal` passed to `live.stream()` remains active for the WebSocket lifecycle and cancels
  pending reconnect timers.

The SDK still exports the legacy `open` transport event for compatibility. Prefer `connected` for
new code because it also identifies reconnections.

## 1.x to 2.0

- Transcript text moved to `message.data.utterance.text`.
- `speech-begin` and `speech-end` became `speech_start` and `speech_end`.
- Observe `start_session` and `end_session` instead of the old `ready` and `done` aliases.
- Live recording is stopped with the official `stop_recording` message.
- API request and response types now come from Gladia's complete OpenAPI document.

See [docs/OPENAPI-LIMITATIONS.md](docs/OPENAPI-LIMITATIONS.md) for upstream operations whose
published schemas are currently incomplete.
