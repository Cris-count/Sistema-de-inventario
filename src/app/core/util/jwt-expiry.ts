/** Decodifica el payload de un JWS (base64url) en un string JSON. `atob` exige padding estándar. */
function payloadJsonFromJws(token: string): string {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('not a JWS');
  }
  let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 1) {
    throw new Error('invalid base64 length');
  }
  if (pad > 0) {
    base64 += '='.repeat(4 - pad);
  }
  const binary = atob(base64);
  return decodeURIComponent(
    Array.from(binary, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
}

/** Comprueba si el JWT (formato JWS) está expirado según el claim `exp`. */
export function isJwtExpired(token: string): boolean {
  try {
    const json = payloadJsonFromJws(token);
    const payload = JSON.parse(json) as { exp?: number };
    if (payload.exp == null) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
