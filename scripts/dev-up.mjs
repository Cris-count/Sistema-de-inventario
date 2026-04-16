#!/usr/bin/env node
/**
 * Desarrollo unificado:
 * 1) Levanta Docker completo (db + api) con build
 * 2) Aplica migraciones SQL en Postgres (evita fallo de Hibernate validate si el volumen es antiguo)
 * 3) Reinicia el contenedor api para que arranque con esquema al día
 * 4) Espera health del API
 * 5) Arranca frontend local
 *
 * Uso: npm run up
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const API_HEALTH_URL = process.env.API_HEALTH_URL ?? 'http://localhost:8080/actuator/health';
const API_HEALTH_TIMEOUT_MS = Number(process.env.API_HEALTH_TIMEOUT_MS ?? 240_000);

function runOrFail(command, args, description, useShell = false) {
  if (description) {
    console.log(description);
  }
  const r = spawnSync(useShell ? `${command} ${args.join(' ')}` : command, useShell ? [] : args, {
    cwd: root,
    stdio: 'inherit',
    shell: useShell,
    env: process.env
  });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function waitForApiHealth(url, timeoutMs = API_HEALTH_TIMEOUT_MS, intervalMs = 2000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const body = await response.text();
        if (!body || body.includes('UP')) {
          return;
        }
      }
    } catch {
      // API aun no esta disponible
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `[dev-up] Timeout esperando health del API en ${url} (${timeoutMs} ms). ` +
      'Revisá: docker compose logs api   (a menudo es esquema desactualizado; db-sync debería haberlo corregido).'
  );
}

async function main() {
  runOrFail('docker', ['compose', 'up', '-d', '--build'], '[dev-up] 1/5  Levantando Docker completo (db + api) …');

  console.log('[dev-up] 2/5  Alineando esquema PostgreSQL (migraciones idempotentes) …');
  const { applyDevMigrations } = await import('./db-sync-dev.mjs');
  await applyDevMigrations();

  console.log('[dev-up] 3/5  Reiniciando servicio api (arranque limpio tras migraciones) …');
  runOrFail('docker', ['compose', 'restart', 'api'], '');

  console.log(`[dev-up] 4/5  Esperando API saludable en ${API_HEALTH_URL} (hasta ${API_HEALTH_TIMEOUT_MS / 1000}s) …`);
  await waitForApiHealth(API_HEALTH_URL);

  runOrFail('npm', ['run', 'frontend'], '[dev-up] 5/5  Iniciando frontend Angular …', process.platform === 'win32');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
