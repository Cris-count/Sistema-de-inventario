#!/usr/bin/env node
/**
 * Aplica migraciones SQL idempotentes (004, 005) dentro del contenedor Postgres vía `docker compose exec`.
 * Sirve cuando el volumen de Docker se creó antes de tablas nuevas (p. ej. billing_event): el init de Postgres
 * solo corre en la primera creación del volumen.
 *
 * Estrategia `psql -h 127.0.0.1`: fuerza TCP al servidor dentro del contenedor; el socket Unix
 * (/var/run/postgresql) puede no estar listo o no usarse como espera el cliente sin `-h`.
 *
 * Uso manual: npm run db:sync
 * También lo invoca dev-up.mjs antes de arrancar el backend.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const MIGRATIONS = [
  'database/migrations/004_onboarding_saas.sql',
  'database/migrations/005_billing_compra_pago.sql'
];

const PSQL_ENV = {
  ...process.env,
  PGPASSWORD: process.env.PGPASSWORD ?? 'inventario'
};

/** @param {string[]} psqlArgs flags + args después de la cadena fija usuario/base (p.ej. ['-c', 'SELECT 1']) */
function execPsqlInDb(psqlArgs, options = {}) {
  const { input } = options;
  return spawnSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'psql',
      '-h',
      '127.0.0.1',
      '-U',
      'inventario',
      '-d',
      'inventario',
      '-v',
      'ON_ERROR_STOP=1',
      ...psqlArgs
    ],
    {
      cwd: root,
      input: input ?? undefined,
      encoding: 'utf8',
      shell: false,
      env: PSQL_ENV
    }
  );
}

/** Verifica que el contenedor del servicio `db` exista y acepte `exec` (sin depender aún de Postgres). */
function assertDbContainerUp() {
  const r = spawnSync('docker', ['compose', 'exec', '-T', 'db', 'true'], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    env: process.env
  });
  if (r.error) {
    throw new Error(
      '[db-sync] No se pudo ejecutar Docker. ¿Docker Desktop en marcha? ¿Estás en la raíz del repo (donde está docker-compose.yml)? ' +
        `Detalle: ${r.error.message}`
    );
  }
  const combined = `${r.stderr || ''}\n${r.stdout || ''}`.toLowerCase();
  if (r.status !== 0 || combined.includes('is not running') || combined.includes('no such container')) {
    throw new Error(
      '[db-sync] El servicio compose `db` no está disponible. Levantalo: npm run db   (o npm run up desde la raíz).'
    );
  }
}

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} r
 * @returns {'ok' | 'auth' | 'container' | 'notready' | 'sql' | 'unknown'}
 */
function classifyFailure(r) {
  if (r.status === 0) {
    return 'ok';
  }
  const text = `${r.stderr || ''}\n${r.stdout || ''}`.toLowerCase();
  if (text.includes('password authentication failed')) {
    return 'auth';
  }
  if (
    text.includes('is not running') ||
    text.includes('no such container') ||
    text.includes('error response from daemon')
  ) {
    return 'container';
  }
  if (
    text.includes('could not connect to server') ||
    text.includes('connection refused') ||
    text.includes('no such file or directory')
  ) {
    return 'notready';
  }
  if (text.includes('error:') && !text.includes('could not connect')) {
    return 'sql';
  }
  return 'unknown';
}

function throwMeaningfulError(kind, rel, r) {
  const tail = (r.stderr || r.stdout || '').trim().slice(-800);
  switch (kind) {
    case 'auth':
      throw new Error(
        '[db-sync] Autenticación TCP rechazada (usuario/contraseña o pg_hba). ' +
          'Usuario esperado: inventario. Variable opcional: PGPASSWORD. ' +
          (tail ? `\n--- psql ---\n${tail}` : '')
      );
    case 'container':
      throw new Error('[db-sync] Contenedor `db` no en marcha. Ejecutá: npm run db');
    case 'notready':
      throw new Error(
        '[db-sync] PostgreSQL aún no acepta conexiones TCP en 127.0.0.1 dentro del contenedor (sigue el init). ' +
          'Reintentá en unos segundos o revisá: docker compose logs db'
      );
    case 'sql':
      throw new Error(
        `[db-sync] Error al ejecutar SQL (${rel}). Revisá el script y el estado de la base.\n--- psql ---\n${tail}`
      );
    default:
      throw new Error(
        `[db-sync] Falló psql (${rel}, código ${r.status}).\n--- psql ---\n${tail || '(sin salida)'}`
      );
  }
}

/**
 * Espera a que el servidor responda a SQL simple (init interno puede terminar después del puerto en el host).
 * @param {number} maxWaitMs
 * @param {number} intervalMs
 */
async function waitPostgresSqlReady(maxWaitMs = 90_000, intervalMs = 1000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    const r = execPsqlInDb(['-c', 'SELECT 1']);
    const kind = classifyFailure(r);
    if (kind === 'ok') {
      if (attempt > 1) {
        console.log(`[db-sync] PostgreSQL acepta SQL tras ${attempt} intento(s) (~${Math.round((Date.now() - start) / 1000)}s).`);
      }
      return;
    }
    if (kind === 'auth' || kind === 'container') {
      throwMeaningfulError(kind, 'SELECT 1', r);
    }
    await delay(intervalMs);
  }
  throw new Error(
    `[db-sync] Timeout (${maxWaitMs} ms) esperando SELECT 1 vía TCP dentro del contenedor. ` +
      'Revisá: docker compose ps   y   docker compose logs db'
  );
}

/**
 * Espera a que exista una tabla creada por database/schema.sql (init en volumen nuevo).
 * Evita aplicar 004/005 antes de que termine el bootstrap del entrypoint.
 */
async function waitForBaseSchemaMarker(maxWaitMs = 120_000, intervalMs = 1000) {
  const stmt =
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rol' LIMIT 1;";
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    const r = execPsqlInDb(['-c', stmt]);
    if (r.status === 0) {
      if (attempt > 1) {
        console.log(
          `[db-sync] Tabla base "rol" presente tras ${attempt} intento(s) (~${Math.round((Date.now() - start) / 1000)}s).`
        );
      }
      return;
    }
    const kind = classifyFailure(r);
    if (kind === 'auth' || kind === 'container') {
      throwMeaningfulError(kind, 'comprobación de esquema base (rol)', r);
    }
    await delay(intervalMs);
  }
  throw new Error(
    `[db-sync] Tras ${maxWaitMs} ms no existe la tabla pública "rol". ` +
      'Probable fallo o demora extrema al aplicar database/schema.sql en el init. ' +
      'Revisá: docker compose logs db · Volumen corrupto: docker compose down -v y volver a subir db.'
  );
}

/**
 * Reintentos cortos solo para carreras residuales (el gordo del tiempo ya lo cubren waitPostgresSqlReady + waitForBaseSchemaMarker).
 * 6 intentos × 1.5 s entre reintentos (no sustituye las fases de espera largas anteriores).
 */
async function runMigrationWithRetries(rel, sql, maxAttempts = 6, retryDelayMs = 1500) {
  let last = execPsqlInDb([], { input: sql });
  for (let attempt = 1; attempt < maxAttempts && last.status !== 0; attempt++) {
    const kind = classifyFailure(last);
    if (kind === 'auth' || kind === 'container' || kind === 'sql') {
      throwMeaningfulError(kind, rel, last);
    }
    console.warn(
      `[db-sync] Intento ${attempt}/${maxAttempts} falló (${rel}); reintento en ${retryDelayMs / 1000}s (transitorio: conexión / init)…`
    );
    await delay(retryDelayMs);
    last = execPsqlInDb([], { input: sql });
  }
  if (last.stdout) {
    process.stdout.write(last.stdout);
  }
  if (last.stderr) {
    process.stderr.write(last.stderr);
  }
  if (last.status !== 0) {
    throwMeaningfulError(classifyFailure(last), rel, last);
  }
}

export async function applyDevMigrations() {
  console.log('[db-sync] Comprobando que el contenedor `db` esté arriba…');
  assertDbContainerUp();

  console.log('[db-sync] Esperando que Postgres acepte SQL vía TCP (127.0.0.1 dentro del contenedor)…');
  await waitPostgresSqlReady();

  console.log('[db-sync] Esperando tabla base `rol` (marca de que database/schema.sql del init terminó)…');
  await waitForBaseSchemaMarker();

  for (const rel of MIGRATIONS) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      console.warn(`[db-sync] Omitido (no existe): ${rel}`);
      continue;
    }
    const sql = fs.readFileSync(full, 'utf8');
    console.log(`[db-sync] Aplicando ${rel} …`);
    await runMigrationWithRetries(rel, sql);
  }
  console.log('[db-sync] Listo (004 + 005 son idempotentes; seguro repetir).');
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  applyDevMigrations().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
