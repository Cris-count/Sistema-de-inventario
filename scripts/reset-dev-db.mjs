#!/usr/bin/env node
/**
 * Elimina el volumen Docker de Postgres definido en docker-compose.yml y apaga el stack.
 * La próxima vez que levantes `db`, Postgres se inicializa de cero con POSTGRES_* del compose
 * (útil si un volumen antiguo tiene otra contraseña y el backend falla con "password authentication failed").
 *
 * Uso: npm run db:reset
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log(
  '[db:reset] Se ejecutará `docker compose down -v` (borra datos locales del volumen inventario_pgdata).'
);
const r = spawnSync('docker', ['compose', 'down', '-v'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  env: process.env
});
process.exit(r.status === null ? 1 : r.status);
