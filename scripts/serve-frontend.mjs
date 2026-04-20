#!/usr/bin/env node
/**
 * Arranca `ng serve` sin prompts: si el puerto base está ocupado, usa el siguiente libre.
 *
 * NG_PORT          Puerto inicial (default 4200)
 * NG_STRICT_PORT   Si es 1 o true, no buscar alternativa; falla si el puerto está ocupado
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function canListenOnHost(port, host) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.unref();
    s.once('error', (err) => {
      // If IPv6 is not available in this machine, ignore that check.
      if (host === '::1' && (err?.code === 'EAFNOSUPPORT' || err?.code === 'EADDRNOTAVAIL')) {
        resolve(true);
        return;
      }
      resolve(false);
    });
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, host);
  });
}

async function portFree(port) {
  const ipv4Free = await canListenOnHost(port, '127.0.0.1');
  if (!ipv4Free) {
    return false;
  }
  const ipv6Free = await canListenOnHost(port, '::1');
  return ipv6Free;
}

async function pickPort() {
  const base = Number(process.env.NG_PORT ?? 4200);
  if (!Number.isFinite(base) || base < 1 || base > 65535) {
    throw new Error(`NG_PORT inválido: ${process.env.NG_PORT}`);
  }
  const strict =
    process.env.NG_STRICT_PORT === '1' ||
    process.env.NG_STRICT_PORT === 'true' ||
    process.env.NG_STRICT_PORT === 'yes';
  if (strict) {
    if (await portFree(base)) {
      return base;
    }
    throw new Error(
      `[frontend] Puerto ${base} ocupado (NG_STRICT_PORT activo). Cerrá el otro \`ng serve\` o usá otro NG_PORT.`
    );
  }
  for (let p = base; p < base + 64; p++) {
    if (await portFree(p)) {
      return p;
    }
  }
  throw new Error(`[frontend] No hay puerto libre entre ${base} y ${base + 63}.`);
}

const chosen = await pickPort();
const base = Number(process.env.NG_PORT ?? 4200);
if (chosen !== base) {
  console.log(`[frontend] Puerto ${base} ocupado; sirviendo en http://localhost:${chosen}`);
}

const ngArgs = ['ng', 'serve', '--configuration', 'development', '--port', String(chosen)];
const child = spawn('npx', ngArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
