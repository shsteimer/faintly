/* eslint-disable no-console */
import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CORE_FILE = path.join(ROOT, 'dist', 'faintly.js');
const SECURITY_FILE = path.join(ROOT, 'dist', 'faintly.security.js');
const CORE_LIMIT = Number(process.env.FAINTLY_CORE_GZIP_LIMIT || 4096);
const TOTAL_LIMIT = Number(process.env.FAINTLY_TOTAL_GZIP_LIMIT || 6144);

const RETURN_CODES = {
  OK: 0,
  FAILED: 1,
};

export default function runSizeCheck(strict = false) {
  if (!fs.existsSync(CORE_FILE)) {
    console.error(`[size-check] core dist file not found: ${CORE_FILE}`);
    return RETURN_CODES.FAILED;
  }

  const coreBuf = fs.readFileSync(CORE_FILE);
  const coreGz = gzipSync(coreBuf).length;

  const secGz = fs.existsSync(SECURITY_FILE)
    ? gzipSync(fs.readFileSync(SECURITY_FILE)).length
    : 0;

  const totalGz = coreGz + secGz;

  const coreOk = coreGz <= CORE_LIMIT;
  const totalOk = totalGz <= TOTAL_LIMIT;

  const coreMsg = `[size-check] core gz (dist/faintly.js): ${coreGz} bytes (limit ${CORE_LIMIT} bytes)`;
  const totalMsg = `[size-check] total gz (core + security): ${totalGz} bytes (limit ${TOTAL_LIMIT} bytes)`;

  if (coreOk) console.log(coreMsg); else console.error(`${coreMsg} — over limit.`);
  if (totalOk) console.log(totalMsg); else console.error(`${totalMsg} — over limit.`);

  const ok = coreOk && totalOk;
  if (ok) return RETURN_CODES.OK;
  if (strict) return RETURN_CODES.FAILED;
  
  console.warn('[size-check] Limits exceeded (warning only).');
  return RETURN_CODES.OK;
}
