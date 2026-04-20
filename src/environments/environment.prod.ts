/**
 * Valores usados en `ng build` (configuración production).
 * Misma ruta si sirves el front y el API detrás del mismo dominio (nginx, etc.).
 * Si el API está en otro host, sustituí por URL absoluta, p. ej. https://api.tudominio.com/api/v1
 */
export const environment = {
  production: true,
  apiUrl: '/api/v1',
  showSeedLoginHint: false
};
