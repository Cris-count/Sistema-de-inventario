/** Comprueba si el JWT (formato JWS) está expirado según el claim `exp`. */
export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(json) as { exp?: number };
    if (payload.exp == null) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
