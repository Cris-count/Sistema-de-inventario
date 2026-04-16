import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type UiButtonVariant =
  | 'gradient'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'landing-primary'
  | 'landing-secondary'
  | 'landing-navbar'
  | 'landing-floating';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex max-w-full'
  },
  imports: [RouterLink],
  template: `
    <!-- Un solo <ng-content>: varias ramas @if con ng-content rompen la proyección en Angular (el texto no llega al DOM). -->
    <!-- Navegación interna: RouterLink en <button> (selector soportado); sin linkTo, routerLink queda inactivo. -->
    <button
      [type]="linkTo() ? 'button' : type()"
      [disabled]="disabled()"
      [routerLink]="linkTo() ?? undefined"
      [queryParams]="queryParams() ?? undefined"
      [fragment]="fragment() ?? undefined"
      [class]="classes()"
      class="inline-flex max-w-full min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-normal rounded-xl border-0 text-center font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
    >
      <ng-content />
    </button>
  `
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  /** Ruta interna (`RouterLink` en el botón). */
  readonly linkTo = input<string | undefined>(undefined);
  readonly queryParams = input<Record<string, string> | undefined>(undefined);
  readonly fragment = input<string | undefined>(undefined);
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly class = input<string>('');

  protected readonly classes = computed(() => {
    const v = this.variant();
    const s = this.size();
    const size =
      s === 'sm'
        ? 'px-3.5 py-2 text-sm'
        : s === 'lg'
          ? 'px-6 py-3 text-base'
          : 'px-5 py-2.5 text-sm';

    const base = `${size} ${this.class()}`;

    switch (v) {
      case 'gradient':
        return `${base} bg-gradient-to-r from-accent to-teal-600 !text-white shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      case 'primary':
        return `${base} bg-primary !text-primary-foreground shadow-soft hover:bg-slate-800 dark:hover:bg-slate-700`;
      case 'secondary':
        return `${base} border border-slate-200 bg-surface !text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/80 dark:!text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800/90`;
      case 'ghost':
        return `${base} !text-slate-600 hover:bg-slate-100 hover:!text-slate-900 dark:!text-slate-300 dark:hover:bg-white/10 dark:hover:!text-white`;
      case 'landing-primary':
        return `${base} min-h-[48px] min-w-[160px] px-6 py-3 text-base font-semibold leading-tight bg-gradient-to-r from-accent to-teal-600 !text-white shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      case 'landing-secondary':
        return `${base} min-h-[48px] min-w-[140px] px-5 py-3 text-base font-semibold leading-tight border border-slate-200 bg-surface !text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/85 dark:!text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800/80`;
      case 'landing-navbar':
        return `${base} min-h-[42px] min-w-[140px] px-5 py-2.5 text-sm font-semibold leading-tight bg-gradient-to-r from-accent to-teal-600 !text-white shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      case 'landing-floating':
        return `${base} min-h-[44px] min-w-[132px] px-[18px] py-2.5 text-sm font-semibold leading-tight bg-gradient-to-r from-accent to-teal-600 !text-white shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      default:
        return base;
    }
  });
}
