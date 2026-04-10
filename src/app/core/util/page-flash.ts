import { DestroyRef } from '@angular/core';

/** Oculta el mensaje de éxito tras unos segundos; se cancela al destruir el componente. */
export function flashSuccess(destroyRef: DestroyRef, clearMessage: () => void, delayMs = 4800): void {
  const id = window.setTimeout(() => clearMessage(), delayMs);
  destroyRef.onDestroy(() => window.clearTimeout(id));
}
