import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div
      [class]="
        'h-full rounded-2xl border border-slate-200/80 bg-surface shadow-soft transition duration-200 hover:border-slate-200 hover:shadow-md ' +
        paddingClass() +
        ' ' +
        class()
      "
    >
      <ng-content />
    </div>
  `
})
export class UiCardComponent {
  readonly padded = input(true);
  readonly class = input('');

  protected readonly paddingClass = computed(() => (this.padded() ? 'p-6' : 'p-0 overflow-hidden'));
}
