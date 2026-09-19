# Published OpenAPI limitations

This SDK intentionally follows the official contract without inventing response or request models.
As of the vendored specification:

- `GET /v1/models` declares an HTTP 200 response without a response body schema, so
  `models.list()` returns `Promise<void>`.
- The deprecated audio and video transcription endpoints declare HTTP 200 responses without
  response body schemas, so their SDK methods return `Promise<void>`.
- `PATCH /v2/live/{id}` references an empty `PatchRequestParamsDTO`; `live.patch()` therefore
  accepts the generated empty contract and does not guess undocumented fields.

`npm run check:contracts` compares the complete local OpenAPI and AsyncAPI documents with Gladia's
official online documents and verifies regenerated TypeScript types. These limitations should be
removed only after the upstream specification supplies the missing schemas.
