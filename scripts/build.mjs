/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { build, context } from 'esbuild';
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

function runSizeCheckNow() {
  const code = runSizeCheck({ strict: isStrict });
  if (code !== 0) throw new Error(`size check failed (${code})`);
}

async function main() {
  if (isCheckSizeOnly) {
    runSizeCheckNow();
    return;
  }

  if (isWatch) {
    const sizePlugin = {
      name: 'size-check',
      setup(b) {
        b.onEnd((res) => {
          if (!res.errors || res.errors.length === 0) runSizeCheckNow();
        });
      },
    };

    const coreCtx = await context(makeCoreOptions([sizePlugin]));
    const secCtx = await context(makeSecurityOptions());
    await coreCtx.watch();
    await secCtx.watch();
    // Keep process alive in watch mode
    // eslint-disable-next-line no-console
    console.log('[build] Watching for changes...');
    return;
  }

  await build(makeCoreOptions());
  await build(makeSecurityOptions());
  runSizeCheckNow();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
