#!/usr/bin/env node
/**
 * Arranca Spring Boot con Maven Wrapper desde backend/ (Windows, macOS, Linux).
 * Uso: npm run backend
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..', 'backend');
const isWin = process.platform === 'win32';
const mvnw = isWin ? path.join(backendDir, 'mvnw.cmd') : path.join(backendDir, 'mvnw');
const args = process.argv.slice(2);
const mvnArgs = args.length > 0 ? args : ['spring-boot:run'];

/** Si SPRING_DATASOURCE_* viene vacío en el shell, Spring usa "" y Postgres rechaza; alineamos con docker-compose. */
function backendEnv() {
  const env = { ...process.env };
  const defaults = {
    SPRING_DATASOURCE_URL: 'jdbc:postgresql://127.0.0.1:5433/inventario',
    SPRING_DATASOURCE_USERNAME: 'inventario',
    SPRING_DATASOURCE_PASSWORD: 'inventario'
  };
  for (const [key, def] of Object.entries(defaults)) {
    const v = env[key];
    if (v === undefined || v === null || String(v).trim() === '') {
      env[key] = def;
    }
  }
  /**
   * En producción JWT_SECRET debe venir del entorno (application.yml sin default).
   * Para `npm run backend` / `npm run up` sin .env, se usa solo este valor local si falta la variable.
   */
  const DEV_JWT_SECRET_FALLBACK =
    'dev-only-JWT-secret-min-32-bytes-for-local-npm-run-up!!';
  if (!env.JWT_SECRET || String(env.JWT_SECRET).trim() === '') {
    env.JWT_SECRET = DEV_JWT_SECRET_FALLBACK;
    console.warn(
      '[run-backend] JWT_SECRET no definido: usando secreto de desarrollo local (no usar en producción). ' +
        'Define JWT_SECRET en el entorno para alinear con despliegue real.'
    );
  }
  return env;
}

const env = backendEnv();

// En Windows, shell:true con spawnSync no entrecomilla mvnw.cmd; rutas con espacios fallan.
// `call` + argv por separado: Node entrecomilla al construir la línea de comandos para CreateProcess.
const result = isWin
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'call', mvnw, ...mvnArgs], {
      cwd: backendDir,
      stdio: 'inherit',
      env,
      windowsHide: true
    })
  : spawnSync(mvnw, mvnArgs, {
      cwd: backendDir,
      stdio: 'inherit',
      env
    });

process.exit(result.status === null ? 1 : result.status);
