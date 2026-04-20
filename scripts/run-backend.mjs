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
      env
    });

process.exit(result.status === null ? 1 : result.status);
