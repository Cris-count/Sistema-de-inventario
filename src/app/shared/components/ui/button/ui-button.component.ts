import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type UiButtonVariant = 'gradient' | 'primary' | 'secondary' | 'ghost';
export type UiButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (href(); as h) {
      <a
        [href]="h"
        [class]="classes()"
        class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <ng-content />
      </a>
    } @else if (routerLink(); as link) {
      <a
        [routerLink]="link"
        [queryParams]="queryParams()"
        [fragment]="fragment()"
        [class]="classes()"
        class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
      >
        <ng-content />
      </a>
    } @else {
      <button
        [type]="type()"
        [disabled]="disabled()"
        [class]="classes()"
        class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50"
      >
        <ng-content />
      </button>
    }
  `
})
export class UiButtonComponent {
  readonly variant = input<UiButtonVariant>('primary');
  readonly size = input<UiButtonSize>('md');
  /** In-page anchor, e.g. `#pricing` */
  readonly href = input<string | undefined>(undefined);
  readonly routerLink = input<string | undefined>(undefined);
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
        return `${base} bg-gradient-to-r from-accent to-teal-600 text-white shadow-soft hover:brightness-[1.03] active:scale-[0.99]`;
      case 'primary':
        return `${base} bg-primary text-primary-foreground shadow-soft hover:bg-slate-900`;
      case 'secondary':
        return `${base} border border-slate-200 bg-surface text-primary shadow-sm hover:border-slate-300 hover:bg-slate-50`;
      case 'ghost':
        return `${base} text-secondary hover:bg-slate-100 hover:text-primary`;
      default:
        return base;
    }
  });
}
