import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const versionFile = await readFile(new URL('../src/version.ts', import.meta.url), 'utf8');
const expected = `export const SDK_VERSION = '${packageJson.version}' as const;`;

if (!versionFile.includes(expected)) {
  throw new Error('src/version.ts is stale; run npm run write:version');
}

console.log(`SDK version ${packageJson.version} is synchronized.`);
