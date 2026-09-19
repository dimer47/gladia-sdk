# Changelog

## 2.1.0

- Protect API credentials across cross-origin redirects and add configurable HTTP retries/timeouts.
- Add WebSocket reconnection, audio buffering, acknowledgment-based replay, and `once()` listeners.
- Add environment configuration, proxy mode, local file paths, polling helpers, and opt-in E2E tests.
- Add a public Live state machine, full-lifecycle cancellation, Base64 replay, and internal ACK filtering.
- Synchronize the SDK header version from package metadata and validate ESM, CJS, browser, and npm package output.
- Add linting, formatting, a Node 18/20/22 CI matrix, migration notes, and a complete opt-in real-file E2E workflow.

## 2.0.0

- Generate the complete public TypeScript contract directly from Gladia's OpenAPI document.
- Expose all 21 published REST operations, including history, models, unified transcription, live patching, and legacy media endpoints.
- Add complete OpenAPI operation coverage checks and generated-type drift checks.
- Align the Live WebSocket client with Gladia's official AsyncAPI contract.
- Replace `ready`/`done` and hyphenated event names with Gladia's underscore-based lifecycle events.
- Send `stop_recording` when stopping a live session.
- Expose the current real-time, post-processing, acknowledgment, and lifecycle messages.
- Add `solaria-1`, `solaria-3`, and `solaria-fusion` pre-recorded model selection.
- Mark pre-recorded options missing from the current OpenAPI contract as deprecated without removing them.
- Accept `Uint8Array` and Node.js `Buffer` values in `upload.fromFile()`.
- Vendor Gladia's official OpenAPI and AsyncAPI specifications and check their drift in CI.
- Upgrade Vitest to 5.0.1.

### Live migration

- Read transcript text from `message.data.utterance.text`.
- Replace `speech-begin` and `speech-end` with `speech_start` and `speech_end`.
- Replace `ready` and `done` with `start_session` and `end_session` when observing Gladia lifecycle messages.
