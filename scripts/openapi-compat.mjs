// Backward-compatible additions applied to Gladia's OpenAPI document before TypeScript generation.
//
// Gladia decommissioned some add-ons (chapterization, moderation, structured data extraction) and
// removed them from its published contract. The API still accepts and ignores the request
// parameters, so the SDK keeps the matching types as `@deprecated` until the next major version
// instead of breaking existing TypeScript code in a minor release.
//
// `docs/openapi.json` stays byte-for-byte identical to Gladia's document; only the generated types
// receive these additions. Remove this layer in the next major version.

const DECOMMISSIONED =
  'Deprecated: Gladia decommissioned this add-on. The API ignores it and no longer returns results. ' +
  'Use Audio to LLM instead.';

const legacyAddonResult = (resultsDescription) => ({
  type: 'object',
  deprecated: true,
  description: DECOMMISSIONED,
  properties: {
    success: {
      type: 'boolean',
      description: 'The audio intelligence model succeeded to get a valid output',
    },
    is_empty: {
      type: 'boolean',
      description: 'The audio intelligence model returned an empty value',
    },
    exec_time: {
      type: 'number',
      description: 'Time audio intelligence model took to complete the task',
    },
    error: {
      description: '`null` if `success` is `true`. Contains the error details of the failed model',
      nullable: true,
      type: 'object',
      allOf: [{ $ref: '#/components/schemas/AddonErrorDTO' }],
    },
    results: { type: 'string', description: resultsDescription, nullable: true },
  },
  required: ['success', 'is_empty', 'exec_time', 'error', 'results'],
});

function schemaOf(spec, name) {
  const schema = spec.components?.schemas?.[name];
  if (!schema) throw new Error(`OpenAPI compatibility layer: schema ${name} no longer exists`);
  return schema;
}

function addMissing(target, key, value, owner) {
  if (key in target) {
    throw new Error(
      `OpenAPI compatibility layer: ${owner}.${key} is published again; remove it from scripts/openapi-compat.mjs`,
    );
  }
  target[key] = value;
}

/** Returns a copy of the OpenAPI document with the deprecated SDK compatibility additions. */
export function applyOpenApiCompat(source) {
  const spec = JSON.parse(JSON.stringify(source));
  const schemas = spec.components.schemas;

  addMissing(
    schemas,
    'ModerationDTO',
    legacyAddonResult('If `moderation` has been enabled, moderated transcription'),
    'components.schemas',
  );
  addMissing(
    schemas,
    'StructuredDataExtractionDTO',
    legacyAddonResult(
      'If `structured_data_extraction` has been enabled, results of the AI structured data extraction for the defined classes.',
    ),
    'components.schemas',
  );

  const result = schemaOf(spec, 'TranscriptionResultDTO').properties;
  addMissing(
    result,
    'moderation',
    {
      deprecated: true,
      description: DECOMMISSIONED,
      allOf: [{ $ref: '#/components/schemas/ModerationDTO' }],
    },
    'TranscriptionResultDTO',
  );
  addMissing(
    result,
    'structured_data_extraction',
    {
      deprecated: true,
      description: DECOMMISSIONED,
      allOf: [{ $ref: '#/components/schemas/StructuredDataExtractionDTO' }],
    },
    'TranscriptionResultDTO',
  );

  addMissing(
    schemaOf(spec, 'PostProcessingConfig').properties,
    'chapterization',
    { type: 'boolean', deprecated: true, description: DECOMMISSIONED, default: false },
    'PostProcessingConfig',
  );

  // Gladia's earlier document described `entity_types` as a single value; it is now an array.
  // Keep accepting a single value at the type level so existing code still compiles.
  const piiConfig = schemaOf(spec, 'PiiRedactionConfigDTO').properties;
  const entityTypes = piiConfig.entity_types;
  if (entityTypes?.type !== 'array') {
    throw new Error(
      'OpenAPI compatibility layer: PiiRedactionConfigDTO.entity_types is no longer an array',
    );
  }
  const { type, items, examples, ...rest } = entityTypes;
  piiConfig.entity_types = {
    ...rest,
    description: `${rest.description} Passing a single value instead of an array is deprecated.`,
    examples,
    oneOf: [{ type, items }, items],
  };

  return spec;
}
