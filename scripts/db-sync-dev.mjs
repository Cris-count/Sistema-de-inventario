#!/usr/bin/env node
/**
 * Aplica migraciones SQL idempotentes listadas en MIGRATIONS dentro del contenedor Postgres vía `docker compose exec`.
 * Incluye 001–002 en volúmenes antiguos, variantes 003 según evolución del esquema, y migraciones posteriores cuando
 * el init del volumen no repitió todo el SQL. El init de Postgres solo corre en la primera creación del volumen.
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
  'database/migrations/001_add_movimiento_motivo.sql',
  'database/migrations/002_multiempresa.sql',
  'database/migrations/003_empresa_updated_by.sql',
  'database/migrations/003_stock_alerta_proveedor.sql',
  'database/migrations/004_onboarding_saas.sql',
  'database/migrations/005_billing_compra_pago.sql',
  'database/migrations/005_plan_pricing_cop.sql',
  'database/migrations/006_plan_limits_capacidad.sql',
  'database/migrations/006_saas_compra_plan_change.sql',
  'database/migrations/006_onboarding_email_totp.sql',
  'database/migrations/007_usuario_mfa.sql',
  'database/migrations/008_mfa_cluster_backup_codes.sql',
  'database/migrations/009_refresh_token.sql',
  'database/migrations/010_refresh_token_family_expires.sql',
  'database/migrations/011_pedido_proveedor_mensaje.sql',
  'database/migrations/012_onboarding_email_challenge_totp.sql',
  'database/migrations/013_rol_compras_abastecimiento_display.sql',
  'database/migrations/014_ventas.sql',
  'database/migrations/015_ventas_fase2.sql',
  'database/migrations/016_onboarding_prepaid_checkout.sql',
  'database/migrations/017_producto_pricing_fields.sql',
  'database/migrations/018_venta_pos_stripe.sql'
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
 * `psql -c "SELECT …"` devuelve código 0 aunque el resultado sea 0 filas: hay que usar `-t -A` y exigir salida.
 * Espera hasta que:
 * - `ready`: existe `usuario` y `empresa` (init de schema.sql terminó esa parte o BD ya alineada).
 * - `legacy`: existe `usuario` pero no `empresa` (volumen pre-002); conviene aplicar 002 antes de 004.
 */
async function waitForMigrationsGate(maxWaitMs = 120_000, intervalMs = 1000) {
  const stmt = `SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'usuario'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'empresa'
    ) THEN 'ready'
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'usuario'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'empresa'
    ) THEN 'legacy'
    ELSE 'wait'
  END;`;
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    attempt++;
    const r = execPsqlInDb(['-t', '-A', '-c', stmt]);
    if (r.status === 0) {
      const gate = (r.stdout || '').trim();
      if (gate === 'ready' || gate === 'legacy') {
        if (attempt > 1) {
          console.log(
            `[db-sync] Puerta de migraciones "${gate}" tras ${attempt} intento(s) (~${Math.round((Date.now() - start) / 1000)}s).`
          );
        }
        return gate;
      }
    } else {
      const kind = classifyFailure(r);
      if (kind === 'auth' || kind === 'container') {
        throwMeaningfulError(kind, 'comprobación de puerta de migraciones', r);
      }
    }
    await delay(intervalMs);
  }
  throw new Error(
    `[db-sync] Tras ${maxWaitMs} ms la BD no alcanzó estado listo (usuario+empresa) ni legado (usuario sin empresa). ` +
      'Revisá: docker compose logs db · Init atascado o volumen raro: docker compose down -v y npm run up de nuevo.'
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

  console.log('[db-sync] Esperando BD lista o legado detectable (usuario+empresa, o usuario sin empresa)…');
  await waitForMigrationsGate();

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
  console.log('[db-sync] Listo (migraciones dev idempotentes; seguro repetir).');
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirectRun) {
  applyDevMigrations().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
