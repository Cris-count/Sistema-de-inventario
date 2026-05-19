#!/usr/bin/env node
/**
 * Arranca Spring Boot con Maven Wrapper desde backend/ (Windows, macOS, Linux).
 * Uso: npm run backend
 *
 * Carga variables desde `.env` en la raíz del repo (si existe) sin pisar
 * variables ya definidas en el entorno (p. ej. STRIPE_SECRET_KEY).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(rootDir, 'backend');

function loadRootDotEnv() {
  const envPath = path.join(rootDir, '.env');
  let raw;
  try {
    raw = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    if (e && e.code === 'ENOENT') return;
    console.warn('[run-backend] No se pudo leer .env:', e.message);
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && (process.env[key] === undefined || process.env[key] === '')) {
      process.env[key] = val;
    }
  }
}

function assertFileExists(file, description) {
  if (!fs.existsSync(file)) {
    console.error(`[run-backend] No se encontro ${description}: ${file}`);
    console.error('[run-backend] Verifica que el repositorio este completo y que ejecutes el comando desde la raiz.');
    process.exit(1);
  }
}

loadRootDotEnv();
const isWin = process.platform === 'win32';
const mvnw = isWin ? path.join(backendDir, 'mvnw.cmd') : path.join(backendDir, 'mvnw');
const args = process.argv.slice(2);
const mvnArgs = args.length > 0 ? args : ['spring-boot:run'];

if (!fs.existsSync(backendDir)) {
  console.error(`[run-backend] No se encontro la carpeta backend: ${backendDir}`);
  process.exit(1);
}
assertFileExists(mvnw, isWin ? 'backend/mvnw.cmd' : 'backend/mvnw');

/** Ruta con espacios: cmd.exe parte el comando si no va entre comillas. */
function winQuoteArg(p) {
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

// En Windows, spawn directo a .cmd con shell:false puede dar EINVAL; con shell:true hay que citar mvnw.
const result = isWin
  ? spawnSync(`${winQuoteArg(mvnw)} ${mvnArgs.join(' ')}`, {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
      env: process.env,
      windowsHide: true
    })
  : spawnSync(mvnw, mvnArgs, {
      cwd: backendDir,
      stdio: 'inherit',
      env: process.env
  });

if (result.error) {
  console.error(`[run-backend] No se pudo ejecutar Maven Wrapper: ${result.error.message}`);
  console.error('[run-backend] Verifica que Java 21 este instalado y disponible en PATH.');
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`[run-backend] Maven Wrapper termino con codigo ${result.status}.`);
  console.error('[run-backend] Sugerencias: revisa Java 21, variables .env y conectividad con PostgreSQL si usaste spring-boot:run.');
}

process.exit(result.status === null ? 1 : result.status);
