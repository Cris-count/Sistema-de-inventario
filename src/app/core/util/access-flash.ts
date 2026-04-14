/** Mensaje corto en sessionStorage tras redirect por roleGuard (no autorizado a la ruta). */
const KEY = 'inventario_access_flash';

export type AccessFlashReason = 'route_forbidden';

export function setRouteForbiddenFlash(): void {
  sessionStorage.setItem(KEY, 'route_forbidden');
}

export function consumeAccessFlash(): AccessFlashReason | null {
  const v = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (v === 'route_forbidden') return 'route_forbidden';
  return null;
}
