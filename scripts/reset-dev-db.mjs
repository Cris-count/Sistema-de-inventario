#!/usr/bin/env node
/**
 * Elimina los volumenes Docker del compose y apaga el stack.
 * La proxima vez que levantes `db`, Postgres se inicializa de cero con POSTGRES_* del compose.
 *
 * Uso seguro:
 *   npm run db:reset          # muestra advertencia y no borra nada
 *   npm run db:reset -- --yes # ejecuta docker compose down -v
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const confirmed =
  process.argv.includes('--yes') ||
  process.argv.includes('-y') ||
  process.env.RESET_DEV_DB_CONFIRM === '1';

console.log('[db:reset] ADVERTENCIA: `docker compose down -v` elimina volumenes locales del proyecto.');
console.log('[db:reset] Esto borra la base PostgreSQL local (volumen inventario_pgdata) y cualquier otro volumen del compose.');
console.log('[db:reset] No afecta archivos del repositorio, pero los datos locales de Docker no se recuperan.');

if (!confirmed) {
  console.log('[db:reset] No se borro nada. Para confirmar ejecuta: npm run db:reset -- --yes');
  process.exit(1);
}

console.log('[db:reset] Confirmado. Ejecutando `docker compose down -v` ...');
const result = spawnSync('docker', ['compose', 'down', '-v'], {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: false,
  env: process.env
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error(`[db:reset] No se pudo ejecutar Docker: ${result.error.message}`);
  console.error('[db:reset] Sugerencia: inicia Docker Desktop y vuelve a intentar.');
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
    console.error('[db:reset] Docker no esta disponible. Inicia Docker Desktop y vuelve a intentar.');
  } else {
    console.error(`[db:reset] docker compose down -v fallo con codigo ${result.status}.`);
  }
}

process.exit(result.status === null ? 1 : result.status);
