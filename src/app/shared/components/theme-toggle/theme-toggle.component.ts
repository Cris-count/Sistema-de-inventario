import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="theme-toggle-btn"
      [class.theme-toggle-btn--compact]="compact()"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.mode() === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'"
      [title]="theme.mode() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    >
      @if (theme.mode() === 'dark') {
        <span class="ico" aria-hidden="true">☀️</span>
      } @else {
        <span class="ico" aria-hidden="true">🌙</span>
      }
      @if (!compact()) {
        <span class="lbl">{{ theme.mode() === 'dark' ? 'Claro' : 'Oscuro' }}</span>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.4rem 0.65rem;
      border-radius: 8px;
      border: 1px solid var(--border, #2f3d52);
      background: var(--surface2, #243047);
      color: var(--text, #f1f5f9);
      font-size: 0.8rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }
    .theme-toggle-btn:hover {
      border-color: var(--accent, #0d9488);
      background: var(--surface-hover, #222d40);
    }
    .theme-toggle-btn:focus-visible {
      outline: 2px solid var(--accent-bright, #2dd4bf);
      outline-offset: 2px;
    }
    /* Misma lógica visual que .nav-link en barra estrecha: solo icono, sin desbordar */
    .theme-toggle-btn--compact {
      gap: 0;
      width: 100%;
      max-width: 2.65rem;
      height: 2.65rem;
      padding: 0;
      border-radius: var(--radius-sm, 8px);
      box-sizing: border-box;
    }
    .theme-toggle-btn--compact .ico {
      font-size: 1.2rem;
      line-height: 1;
    }
    .ico {
      font-size: 1rem;
      line-height: 1;
    }
    .lbl {
      line-height: 1;
    }
    :host-context([data-theme='light']) .theme-toggle-btn {
      border-color: #cbd5e1;
      background: #f1f5f9;
      color: #0f172a;
    }
    :host-context([data-theme='light']) .theme-toggle-btn:hover {
      border-color: #94a3b8;
      background: #e2e8f0;
    }
    /* Marketing (#lp-root): contraste en barra clara u oscura */
    :host-context(#lp-root) .theme-toggle-btn {
      border-color: rgba(148, 163, 184, 0.55);
      background: rgba(255, 255, 255, 0.92);
      color: #0f172a;
    }
    :host-context(#lp-root) .theme-toggle-btn:hover {
      border-color: #94a3b8;
      background: #f8fafc;
    }
    :host-context(html.dark):host-context(#lp-root) .theme-toggle-btn {
      border-color: rgba(51, 65, 85, 0.85);
      background: rgba(15, 23, 42, 0.75);
      color: #f1f5f9;
    }
    :host-context(html.dark):host-context(#lp-root) .theme-toggle-btn:hover {
      border-color: rgba(71, 85, 105, 0.9);
      background: rgba(30, 41, 59, 0.85);
    }
    /* Barra lateral: aspecto alineado al ítem activo/hover del menú */
    :host-context(.sidebar) .theme-toggle-btn--compact:hover {
      background: var(--accent-soft, rgba(13, 148, 136, 0.14));
      border-color: var(--accent, #0d9488);
    }
    :host-context(.user-box-theme--compact) {
      display: flex;
      justify-content: center;
      width: 100%;
      min-width: 0;
    }
  `
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
  /** Solo icono (p. ej. menú lateral contraído); evita texto cortado. */
  readonly compact = input(false);
}
