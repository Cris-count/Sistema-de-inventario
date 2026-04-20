import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'accent' | 'success' | 'on-dark';

@Component({
  selector: 'app-ui-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `
})
export class UiBadgeComponent {
  readonly tone = input<UiBadgeTone>('neutral');
  readonly class = input('');

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide';
    const extra = this.class();
    switch (this.tone()) {
      case 'accent':
        return `${base} bg-teal-50 text-accent ring-1 ring-teal-100 dark:bg-teal-950/55 dark:text-teal-100 dark:ring-teal-800/80 ${extra}`;
      case 'success':
        return `${base} bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/70 ${extra}`;
      case 'on-dark':
        return `${base} bg-white/10 text-teal-100 ring-1 ring-white/15 backdrop-blur ${extra}`;
      default:
        return `${base} bg-slate-100 text-secondary ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/80 ${extra}`;
    }
  });
}
