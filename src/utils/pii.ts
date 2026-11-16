import type { PreRecordedRequest } from '../types/pre-recorded.js';

/**
 * Gladia requires `pii_redaction_config.entity_types` to be an array. Earlier SDK types allowed a
 * single value, which the API rejects, so wrap it instead of sending an invalid request.
 */
export function normalizePreRecordedRequest(request: PreRecordedRequest): PreRecordedRequest {
  const config = request.pii_redaction_config;
  const entityTypes = config?.entity_types;
  if (entityTypes === undefined || Array.isArray(entityTypes)) return request;
  return { ...request, pii_redaction_config: { ...config, entity_types: [entityTypes] } };
}
