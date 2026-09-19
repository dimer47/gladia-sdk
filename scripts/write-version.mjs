import { readFile, writeFile } from 'node:fs/promises';

const packageJsonUrl = new URL('../package.json', import.meta.url);
const versionFileUrl = new URL('../src/version.ts', import.meta.url);
const packageJson = JSON.parse(await readFile(packageJsonUrl, 'utf8'));
const contents = `// This file is generated from package.json by scripts/write-version.mjs.\nexport const SDK_VERSION = '${packageJson.version}' as const;\n`;

await writeFile(versionFileUrl, contents);
