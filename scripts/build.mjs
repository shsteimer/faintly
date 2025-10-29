/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { build, context } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import runSizeCheck from './check-size.mjs';

const args = process.argv.slice(2);
const isStrict = args.includes('--strict');
const isWatch = args.includes('--watch');
const isCheckSizeOnly = args.includes('--check-size');

function makeCoreOptions(plugins = []) {
  return {
    entryPoints: ['src/index.js'],
    outfile: 'dist/faintly.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
    // Ensure the security helper is NOT bundled into the core output
    external: ['./faintly.security.js'],
    plugins,
  };
}

function makeSecurityOptions() {
  return {
    entryPoints: ['src/faintly.security.js'],
    outfile: 'dist/faintly.security.js',
    bundle: true,
    format: 'esm',
    platform: 'browser',
  };
}

async function main() {
  if (isCheckSizeOnly) {
    const code = runSizeCheck(isStrict);
    process.exit(code);
  }

  const securitySrcPath = path.join(process.cwd(), 'src', 'faintly.security.js');
  const hasSecurity = fs.existsSync(securitySrcPath);

  if (isWatch) {
    const sizePlugin = {
      name: 'size-check',
      setup(b) {
        b.onEnd((res) => {
          if (!res.errors || res.errors.length === 0) {
            // Always non-strict in watch mode - warn but don't exit
            runSizeCheck(false);
          }
        });
      },
    };

    const coreCtx = await context(makeCoreOptions([sizePlugin]));
    const secCtx = hasSecurity ? await context(makeSecurityOptions()) : null;
    await coreCtx.watch();
    if (secCtx) await secCtx.watch();
    // Keep process alive in watch mode
    // eslint-disable-next-line no-console
    console.log('[build] Watching for changes...');
    return;
  }

  await build(makeCoreOptions());
  if (hasSecurity) await build(makeSecurityOptions());

  const code = runSizeCheck(isStrict);
  process.exit(code);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
