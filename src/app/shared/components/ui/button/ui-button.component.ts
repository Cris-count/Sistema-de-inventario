import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Variantes canónicas del sistema de botón:
 *   - `primary`    CTA principal, gradient teal con texto blanco.
 *   - `secondary`  Acción secundaria, outline + superficie.
 *   - `ghost`      Acción terciaria/discreta, solo texto.
 *
 * Aliases retrocompatibles (deprecated, se resuelven a las canónicas):
 *   - `gradient`           → primary
 *   - `landing-primary`    → primary + size 'lg'
 *   - `landing-secondary`  → secondary + size 'lg'
 *   - `landing-navbar`     → primary + size 'md' (narrow)
 *   - `landing-floating`   → primary + size 'md'
 *
 * Nuevos usos deben usar solo las 3 variantes canónicas + `size`.
 */
export type UiButtonVariant =
  | 'primary'
  | 'secondary'
  /** Borde visible, fondo claro; alias práctico del secundario en formularios. */
  | 'outline'
  | 'ghost'
  /** Borde visible, fondo claro (formularios / secundario fuerte). */
  | 'outline'
  /** @deprecated usa `variant="primary"`. */
  | 'gradient'
  /** @deprecated usa `variant="primary" size="lg"`. */
  | 'landing-primary'
  /** @deprecated usa `variant="secondary" size="lg"`. */
  | 'landing-secondary'
  /** Outline claro sobre fondos oscuros (landing hero). */
  | 'landing-on-dark'
  | 'landing-navbar'
  /** @deprecated usa `variant="primary" size="md"`. */
  | 'landing-floating';

export type UiButtonSize = 'sm' | 'md' | 'lg';

/** Resuelve variante → canónica (elimina aliases deprecated en el switch). */
function resolveVariant(v: UiButtonVariant): 'primary' | 'secondary' | 'ghost' {
  switch (v) {
    case 'outline':
      return 'secondary';
    case 'gradient':
    case 'landing-primary':
    case 'landing-navbar':
    case 'landing-floating':
      return 'primary';
    case 'landing-secondary':
    case 'outline':
      return 'secondary';
    case 'landing-on-dark':
      return 'secondary';
    default:
      return v;
  }
}

/** Resuelve tamaño implícito en aliases deprecated. */
function resolveSize(v: UiButtonVariant, explicit: UiButtonSize): UiButtonSize {
  if (v === 'landing-primary' || v === 'landing-secondary') return 'lg';
  if (v === 'landing-navbar' || v === 'landing-floating') return 'md';
  if (v === 'landing-on-dark') return 'md';
  return explicit;
}

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex max-w-full'
  },
  imports: [RouterLink],
  template: `
    <!-- Un solo <ng-content>: varias ramas @if con ng-content rompen la proyección en Angular (el texto no llega al DOM). -->
    <!-- Navegación interna: RouterLink en <button> (selector soportado). -->
    <button
      [type]="navTarget() ? 'button' : type()"
      [disabled]="disabled()"
      [routerLink]="navTarget() ?? undefined"
      [queryParams]="queryParams() ?? undefined"
      [fragment]="fragment() ?? undefined"
      [class]="classes()"
      class="inline-flex max-w-full min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-normal rounded-xl border-0 text-center font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
    >
      <ng-content />
    </button>
  `
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  /** In-page anchor, e.g. `#pricing` */
  readonly href = input<string | undefined>(undefined);
  /** Internal navigation; named `to` so host `routerLink` does not bind RouterLink to this component. */
  readonly to = input<string | undefined>(undefined);
  /** @deprecated Usar `to`. */
  readonly linkTo = input<string | undefined>(undefined);
  readonly queryParams = input<Record<string, string> | undefined>(undefined);
  readonly fragment = input<string | undefined>(undefined);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly class = input<string>('');

  /** Ruta interna efectiva (`to` tiene prioridad sobre `linkTo`). */
  protected readonly navTarget = computed(() => this.to() ?? this.linkTo() ?? undefined);

  protected readonly classes = computed(() => {
    const raw = this.variant();
    const effectiveSize = resolveSize(raw, this.size());

    const size =
      effectiveSize === 'sm'
        ? 'px-3.5 py-2 text-sm min-h-[36px]'
        : effectiveSize === 'lg'
          ? 'px-6 py-3 text-base min-h-[48px]'
          : 'px-5 py-2.5 text-sm min-h-[42px]';

    const base = `${size} ${this.class()}`;

    if (raw === 'landing-on-dark') {
      return `${base} min-h-[48px] min-w-[132px] px-5 py-3 text-sm font-semibold leading-tight border border-white/20 bg-transparent !text-white/92 shadow-none hover:border-white/35 hover:bg-white/10`;
    }

    if (raw === 'landing-primary') {
      return `${base} min-h-[56px] min-w-[180px] px-8 py-3.5 text-base font-semibold leading-tight bg-gradient-to-r from-accent via-teal-500 to-teal-700 !text-white shadow-xl shadow-teal-950/35 ring-2 ring-white/10 hover:shadow-2xl hover:shadow-teal-950/40 hover:brightness-[1.06] hover:-translate-y-0.5 active:translate-y-0`;
    }

    if (raw === 'landing-secondary') {
      return `${base} min-h-[48px] min-w-[140px] px-5 py-3 text-sm font-semibold leading-tight border border-slate-200/95 bg-surface !text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:shadow-md dark:border-slate-600 dark:bg-slate-900/95 dark:!text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800`;
    }

    if (raw === 'landing-navbar') {
      return `${base} min-h-[44px] min-w-[148px] px-6 py-2.5 text-sm font-semibold leading-tight bg-gradient-to-r from-accent via-teal-500 to-teal-600 !text-white shadow-lg shadow-teal-900/20 hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5`;
    }

    if (raw === 'landing-floating') {
      return `${base} min-h-[48px] min-w-[140px] px-5 py-3 text-sm font-semibold leading-tight bg-gradient-to-r from-accent via-teal-500 to-teal-600 !text-white shadow-lg shadow-teal-900/25 hover:shadow-xl hover:brightness-110 hover:-translate-y-0.5`;
    }

    if (raw === 'outline') {
      return `${base} border-2 border-slate-300 bg-transparent !text-slate-800 shadow-none hover:border-slate-400 hover:bg-slate-50 dark:border-slate-500 dark:!text-slate-100 dark:hover:border-slate-400 dark:hover:bg-slate-800/50`;
    }

    const canonical = resolveVariant(raw);

    switch (canonical) {
      case 'primary':
        return `${base} bg-gradient-to-r from-accent to-accent-strong !text-accent-foreground shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      case 'secondary':
        return `${base} border border-slate-200 bg-surface !text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/80 dark:!text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800/90`;
      case 'ghost':
        return `${base} !text-secondary hover:bg-slate-100 hover:!text-primary dark:!text-slate-300 dark:hover:bg-white/10 dark:hover:!text-white`;
      default:
        return base;
    }
  });
}
