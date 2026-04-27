import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';

/** Prefijo fijo para claves en localStorage / sessionStorage (ver respuesta de implementación para inventario de ids). */
export const DISMISSIBLE_HINT_STORAGE_PREFIX = 'inventario.dismissHint.v1.';

/**
 * Envuelve ayudas contextuales / avisos informativos repetitivos y permite ocultarlos con «×».
 * No usar para errores de API, validación de formulario, bloqueos operativos ni estados críticos.
 */
@Component({
  selector: 'app-dismissible-hint',
  standalone: true,
  /** Colapsa el host completo al descartar; si no, el custom element quedaba en layout vacío. */
  host: {
    '[style.display]': 'hostDisplay()'
  },
  template: `
    <div class="app-dismissible-hint" [class.app-dismissible-hint--flush]="variant === 'flush'">
      <button
        type="button"
        class="app-dismissible-hint__close"
        (click)="dismiss()"
        [attr.aria-label]="closeLabel"
      >
        ×
      </button>
      <div class="app-dismissible-hint__body">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .app-dismissible-hint {
      position: relative;
      display: block;
    }
    .app-dismissible-hint__body {
      padding-right: 1.65rem;
    }
    .app-dismissible-hint--flush .app-dismissible-hint__close {
      top: 0;
    }
    .app-dismissible-hint__close {
      position: absolute;
      top: 0.15rem;
      right: 0;
      z-index: 2;
      margin: 0;
      padding: 0.15rem 0.4rem;
      border: none;
      background: transparent;
      color: inherit;
      opacity: 0.5;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      border-radius: var(--radius-sm, 4px);
    }
    .app-dismissible-hint__close:hover {
      opacity: 0.95;
    }
    .app-dismissible-hint__close:focus-visible {
      opacity: 1;
      outline: 2px solid color-mix(in srgb, var(--accent, #6366f1) 40%, transparent);
      outline-offset: 1px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DismissibleHintComponent implements OnInit {
  /** Fragmento estable; la clave real es `inventario.dismissHint.v1.${hintId}`. */
  @Input({ required: true }) hintId!: string;
  /** local: persiste entre visitas; session: solo pestaña; memory: hasta salir de la vista (sin storage). */
  @Input() persist: 'local' | 'session' | 'memory' = 'local';
  @Input() closeLabel = 'Ocultar este aviso';
  /** Alinea el botón al inicio del bloque (útil con textos cortos o page-lead). */
  @Input() variant: 'default' | 'flush' = 'default';

  readonly hidden = signal(false);

  /**
   * Control de layout del host: al descartar debe desaparecer por completo (no solo el interior).
   * `contents` evita una caja intermedia; el borde/fondo deben vivir en el contenido proyectado.
   */
  hostDisplay(): string {
    return this.hidden() ? 'none' : 'contents';
  }

  ngOnInit(): void {
    const key = DISMISSIBLE_HINT_STORAGE_PREFIX + this.hintId;
    try {
      if (this.persist === 'local' && globalThis.localStorage?.getItem(key) === '1') {
        this.hidden.set(true);
      } else if (this.persist === 'session' && globalThis.sessionStorage?.getItem(key) === '1') {
        this.hidden.set(true);
      }
    } catch {
      /* modo privado / storage no disponible */
    }
  }

  dismiss(): void {
    this.hidden.set(true);
    if (this.persist === 'memory') {
      return;
    }
    const key = DISMISSIBLE_HINT_STORAGE_PREFIX + this.hintId;
    try {
      if (this.persist === 'local') {
        globalThis.localStorage?.setItem(key, '1');
      } else if (this.persist === 'session') {
        globalThis.sessionStorage?.setItem(key, '1');
      }
    } catch {
      /* ignore */
    }
  }
}
