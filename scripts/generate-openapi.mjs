import { readFile, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { applyOpenApiCompat } from './openapi-compat.mjs';

const root = new URL('../', import.meta.url);

/** Generates TypeScript types from docs/openapi.json plus the deprecated compatibility layer. */
export async function generateOpenApiTypes(output) {
  const spec = JSON.parse(await readFile(new URL('docs/openapi.json', root), 'utf8'));
  const dir = await mkdtemp(join(tmpdir(), 'gladia-openapi-'));
  const input = join(dir, 'openapi.json');
  try {
    await writeFile(input, JSON.stringify(applyOpenApiCompat(spec)));
    execFileSync(
      fileURLToPath(new URL('node_modules/.bin/openapi-typescript', root)),
      [input, '-o', output, '--default-non-nullable', 'false'],
      { stdio: 'ignore' },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateOpenApiTypes(fileURLToPath(new URL('src/generated/openapi.ts', root)));
  console.log('Generated src/generated/openapi.ts');
}
