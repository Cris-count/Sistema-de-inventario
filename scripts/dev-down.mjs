#!/usr/bin/env node
/**
 * Apaga los servicios definidos en docker-compose.yml.
 * Conserva volumenes: no usa -v y no borra datos locales de PostgreSQL.
 *
 * Uso: npm run down
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('[dev-down] Ejecutando docker compose down.');
console.log('[dev-down] Conserva volumenes y datos locales. No detiene JVM/ng serve abiertos en otras terminales.');

const result = spawnSync('docker', ['compose', 'down'], {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: false,
  env: process.env
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error(`[dev-down] Error al ejecutar Docker: ${result.error.message}`);
  console.error('[dev-down] Sugerencia: inicia Docker Desktop si quieres detener contenedores activos.');
  process.exit(1);
}

if (result.status !== 0) {
  const output = `${result.stderr || ''}\n${result.stdout || ''}`.toLowerCase();
  if (
    output.includes('dockerdesktop') ||
    output.includes('cannot connect') ||
    output.includes('failed to connect') ||
    output.includes('is the docker daemon running') ||
    output.includes('open //./pipe/docker') ||
    output.includes('error during connect')
  ) {
    console.error('[dev-down] Docker no esta disponible. No se modificaron volumenes ni datos.');
  } else {
    console.error(`[dev-down] docker compose down fallo con codigo ${result.status}.`);
  }
}

process.exit(result.status === null ? 1 : result.status);
