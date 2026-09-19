import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sources = [
  {
    name: 'OpenAPI',
    local: new URL('../docs/openapi.json', import.meta.url),
    remote: 'https://api.gladia.io/openapi.json',
    parse: (value) => stripDynamicExamples(JSON.parse(value)),
  },
  {
    name: 'AsyncAPI',
    local: new URL('../docs/asyncapi.yaml', import.meta.url),
    remote: 'https://raw.githubusercontent.com/gladiaio/docs/main/asyncapi.yaml',
    parse: (value) => value.replaceAll('\r\n', '\n'),
  },
];

function stripDynamicExamples(value) {
  if (Array.isArray(value)) return value.map(stripDynamicExamples);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'example')
        .map(([key, child]) => [key, stripDynamicExamples(child)]),
    );
  }
  return value;
}

let drifted = false;
for (const source of sources) {
  const [localText, response] = await Promise.all([
    readFile(source.local, 'utf8'),
    fetch(source.remote),
  ]);
  if (!response.ok) throw new Error(`Unable to fetch ${source.name}: HTTP ${response.status}`);
  const remoteText = await response.text();
  if (!isDeepStrictEqual(source.parse(localText), source.parse(remoteText))) {
    console.error(`${source.name} contract has drifted from ${source.remote}`);
    drifted = true;
  }
}

if (drifted) process.exitCode = 1;
else {
  const generated = join(tmpdir(), `gladia-openapi-${process.pid}.ts`);
  execFileSync(
    new URL('../node_modules/.bin/openapi-typescript', import.meta.url).pathname,
    ['docs/openapi.json', '-o', generated, '--default-non-nullable', 'false'],
    { stdio: 'ignore' },
  );
  const [committedTypes, generatedTypes] = await Promise.all([
    readFile(new URL('../src/generated/openapi.ts', import.meta.url), 'utf8'),
    readFile(generated, 'utf8'),
  ]);
  if (committedTypes !== generatedTypes) {
    console.error('Generated TypeScript types have drifted; run npm run generate:openapi.');
    process.exitCode = 1;
  } else {
    console.log('Gladia contracts and generated TypeScript types are current.');
  }
}
