#!/usr/bin/env node
/**
 * Apaga los servicios definidos en docker-compose.yml (db y, si estaba arriba, api).
 * Conserva volúmenes (no usa -v). No envía señales a JVM ni a ng serve abiertos en otras terminales.
 *
 * Uso: npm run down
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
console.log('[dev-down] docker compose down  (detiene contenedores del proyecto; datos en volumen se conservan).');
console.log('[dev-down] Si tenías `npm run backend` o `ng serve` en otra terminal, cerralos manualmente (Ctrl+C).');

const r = spawnSync('docker', ['compose', 'down'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  env: process.env
});

if (r.error) {
  console.error('[dev-down] Error al ejecutar Docker.');
  process.exit(1);
}

process.exit(r.status === null ? 1 : r.status);
