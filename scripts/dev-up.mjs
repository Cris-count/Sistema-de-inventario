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
import net from 'node:net';
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

/**
 * Espera a que algo escuche en TCP (p. ej. Postgres publicado en el host tras `docker compose up`).
 */
async function waitForPort(port, options = {}) {
  const host = options.host ?? '127.0.0.1';
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 500;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = net.createConnection({ port, host }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (connected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `[dev-up] Timeout esperando puerto ${host}:${port} (${timeoutMs} ms). ` +
      'Revisá: docker compose ps   y   docker compose logs db'
  );
}

async function waitForApiHealth(url, timeoutMs = API_HEALTH_TIMEOUT_MS, intervalMs = 2000) {
  const started = Date.now();
  let lastProgressLog = started;
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
    const now = Date.now();
    if (now - lastProgressLog >= 25_000) {
      lastProgressLog = now;
      const elapsed = Math.round((now - started) / 1000);
      console.log(
        `[dev-up]   …aún esperando ${url} (${elapsed}s / ${Math.round(timeoutMs / 1000)}s; 503 suele ser health de mail sin SMTP)…`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `[dev-up] Timeout esperando health del API en ${url} (${timeoutMs} ms). ` +
      'Revisá: docker compose logs api · Esquema BD: npm run db:sync · Si ves MailHealthIndicator: MANAGEMENT_HEALTH_MAIL_ENABLED=false en compose.'
  );
}

async function main() {
  runOrFail('docker', ['compose', 'up', '-d', '--build'], '[dev-up] 1/5  Levantando Docker completo (db + api) …');

  console.log('[dev-up] 2/5  Esperando PostgreSQL en 127.0.0.1:5433 …');
  await waitForPort(5433);

  console.log('[dev-up] 3/5  Alineando esquema PostgreSQL (migraciones idempotentes; ver db-sync-dev.mjs) …');
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
