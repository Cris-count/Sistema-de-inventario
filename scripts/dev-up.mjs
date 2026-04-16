#!/usr/bin/env node
/**
 * Desarrollo local unificado: solo PostgreSQL en Docker, luego backend (mvnw) + frontend (ng serve).
 * No ejecuta `docker compose up` completo (evita contenedor api en 8080).
 *
 * Uso: npm run up
 */
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function runDockerUpDb() {
  const r = spawnSync('docker', ['compose', 'up', '-d', 'db'], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: process.env
  });
  if (r.error) {
    console.error('[dev-up] No se pudo ejecutar Docker. ¿Está Docker Desktop en marcha?');
    throw r.error;
  }
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

/**
 * Espera a que algo escuche en TCP en el host (el puerto publicado puede abrirse antes del init completo dentro del contenedor;
 * db-sync-dev.mjs añade SELECT 1 y comprobación de tabla `rol` vía psql dentro del contenedor).
 */
function waitForPort(port, options = {}) {
  const host = options.host ?? '127.0.0.1';
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 400;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = net.connect({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(
            new Error(
              `[dev-up] Tiempo de espera agotado (${timeoutMs} ms) para ${host}:${port}. ` +
                'Comprueba el contenedor (docker compose ps) y que el puerto no esté ocupado por otra instancia.'
            )
          );
        } else {
          setTimeout(tryOnce, intervalMs);
        }
      });
    };
    tryOnce();
  });
}

async function main() {
  console.log('[dev-up] 1/4  docker compose up -d db   (solo servicio db; no se levanta api del compose)');
  runDockerUpDb();

  console.log('[dev-up] 2/4  Esperando PostgreSQL en 127.0.0.1:5433 …');
  await waitForPort(5433);

  console.log('[dev-up] 3/4  Alineando esquema (migraciones 003–005 idempotentes en bases ya existentes)');
  const { applyDevMigrations } = await import('./db-sync-dev.mjs');
  await applyDevMigrations();

  console.log('[dev-up] 4/4  Backend + frontend en paralelo (Ctrl+C detiene ambos procesos hijos).');
  const { default: concurrently } = await import('concurrently');
  const { result } = concurrently(['npm run backend', 'npm run frontend'], {
    cwd: root,
    prefix: 'name',
    prefixColors: ['green', 'cyan'],
    killOthersOn: ['failure']
  });

  try {
    await result;
  } catch {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
