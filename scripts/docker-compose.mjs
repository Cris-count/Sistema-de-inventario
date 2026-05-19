#!/usr/bin/env node
/**
 * Wrapper pequeno para comandos Docker Compose usados desde package.json.
 * Da mensajes consistentes cuando Docker Desktop/daemon no esta iniciado.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const commands = {
  'up-db': {
    args: ['compose', 'up', '-d', 'db'],
    label: '[docker] Levantando PostgreSQL (servicio db) ...'
  },
  'up-stack': {
    args: ['compose', 'up', '-d'],
    label: '[docker] Levantando stack Docker ...'
  },
  'up-stack-build': {
    args: ['compose', 'up', '-d', '--build'],
    label: '[docker] Construyendo y levantando stack Docker ...'
  }
};

function dockerHint(output) {
  const text = String(output || '').toLowerCase();
  if (
    text.includes('dockerdesktop') ||
    text.includes('cannot connect') ||
    text.includes('failed to connect') ||
    text.includes('is the docker daemon running') ||
    text.includes('open //./pipe/docker') ||
    text.includes('error during connect')
  ) {
    return [
      '[docker] No se pudo conectar con Docker.',
      '[docker] Sugerencia: inicia Docker Desktop y vuelve a ejecutar el comando.',
      '[docker] Verifica tambien: docker compose config'
    ].join('\n');
  }
  return null;
}

const action = process.argv[2];
const selected = commands[action];

if (!selected) {
  console.error('[docker] Uso: node scripts/docker-compose.mjs <up-db|up-stack|up-stack-build>');
  process.exit(1);
}

console.log(selected.label);
const result = spawnSync('docker', selected.args, {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: false,
  env: process.env
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  console.error(`[docker] No se pudo ejecutar Docker: ${result.error.message}`);
  console.error('[docker] Sugerencia: instala/inicia Docker Desktop y confirma que `docker compose config` funciona.');
  process.exit(1);
}

if (result.status !== 0) {
  const hint = dockerHint(`${result.stderr || ''}\n${result.stdout || ''}`);
  if (hint) {
    console.error(hint);
  } else {
    console.error(`[docker] El comando fallo con codigo ${result.status}.`);
  }
  process.exit(result.status ?? 1);
}

console.log('[docker] Listo.');
