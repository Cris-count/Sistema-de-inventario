import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type UiBadgeTone = 'neutral' | 'accent' | 'success';

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
        return `${base} bg-teal-50 text-accent ring-1 ring-teal-100 ${extra}`;
      case 'success':
        return `${base} bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 ${extra}`;
      default:
        return `${base} bg-slate-100 text-secondary ring-1 ring-slate-200/80 ${extra}`;
    }
  });
}
