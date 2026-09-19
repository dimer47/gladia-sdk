import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = new URL('../', import.meta.url);
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'gladia-package-check-'));

try {
  const manifest = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', temporaryDirectory],
      { cwd: projectRoot, encoding: 'utf8' },
    ),
  )[0];
  const packagedFiles = new Set(manifest.files.map((file) => file.path));

  for (const requiredFile of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
  ]) {
    if (!packagedFiles.has(requiredFile)) throw new Error(`npm package is missing ${requiredFile}`);
  }
  if ([...packagedFiles].some((file) => file.startsWith('src/') || file.startsWith('tests/'))) {
    throw new Error('npm package unexpectedly contains source or test files');
  }

  const esm = await import(new URL('../dist/index.js', import.meta.url));
  const require = createRequire(import.meta.url);
  const cjs = require(fileURLToPath(new URL('../dist/index.cjs', import.meta.url)));
  if (esm.SDK_VERSION !== cjs.SDK_VERSION) throw new Error('ESM and CJS exports differ');

  await build({
    entryPoints: [new URL('../src/index.ts', import.meta.url).pathname],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
  });

  await writeFile(join(temporaryDirectory, 'package.json'), '{"private":true,"type":"module"}');
  const tarball = join(temporaryDirectory, manifest.filename);
  execFileSync('npm', ['install', '--ignore-scripts', '--no-package-lock', tarball], {
    cwd: temporaryDirectory,
    stdio: 'ignore',
  });
  await writeFile(
    join(temporaryDirectory, 'esm.mjs'),
    `import { SDK_VERSION } from '@dimer47/gladia-sdk'; if (SDK_VERSION !== '${manifest.version}') process.exit(1);`,
  );
  await writeFile(
    join(temporaryDirectory, 'cjs.cjs'),
    `const { SDK_VERSION } = require('@dimer47/gladia-sdk'); if (SDK_VERSION !== '${manifest.version}') process.exit(1);`,
  );
  execFileSync(process.execPath, ['esm.mjs'], { cwd: temporaryDirectory });
  execFileSync(process.execPath, ['cjs.cjs'], { cwd: temporaryDirectory });

  console.log(
    `Package ${manifest.name}@${manifest.version} passes clean-install ESM/CJS, browser, and content checks.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
