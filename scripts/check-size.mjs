/* eslint-disable no-console */
import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST_FILE = path.join(ROOT, 'dist', 'faintly.js');
const LIMIT = Number(process.env.FAINTLY_GZIP_LIMIT || 5120);
const STRICT = process.argv.includes('--strict');

function formatBytes(bytes) {
  return `${bytes} bytes`;
}

function main() {
  if (!fs.existsSync(DIST_FILE)) {
    console.error(`[size-check] dist file not found: ${DIST_FILE}`);
    process.exit(1);
  }

  const buf = fs.readFileSync(DIST_FILE);
  const gz = gzipSync(buf);
  const size = gz.length;

  const ok = size <= LIMIT;
  const msg = `[size-check] gzipped dist/faintly.js: ${formatBytes(size)} (limit ${formatBytes(LIMIT)})`;

  if (ok) {
    console.log(msg);
    process.exit(0);
  }

  if (STRICT) {
    console.error(`${msg} — over limit.`);
    process.exit(1);
  }

  console.warn(`${msg} — over limit (warning only).`);
}

main();
