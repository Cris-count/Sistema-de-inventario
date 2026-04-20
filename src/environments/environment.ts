export const environment = {
  production: false,
  /**
   * Mismo origen que `ng serve` (p. ej. túnel solo en :4200): las peticiones van a /api/v1/… y
   * `proxy.conf.json` las reenvía a http://127.0.0.1:8080/api/v1/…
   */
  apiUrl: '/api/v1',
  /** Muestra en login la lista de cuentas semilla (solo desarrollo; desactivar en builds reales si se expone el front). */
  showSeedLoginHint: true
};
