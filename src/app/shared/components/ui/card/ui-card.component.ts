import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Card estándar del sistema visual. Usa tokens oficiales (`bg-surface`,
 * `shadow-soft`, `border-slate-*`).
 *
 * Inputs:
 *   - `padded`       aplica padding interno estándar (`p-6`). Default `true`.
 *   - `highlighted`  resalta la card con anillo teal + sombra un poco más
 *                    marcada. Pensada para el plan recomendado o la opción
 *                    destacada de una serie. Default `false`.
 *   - `class`        clases adicionales (ej. layout interno).
 */
@Component({
  selector: 'app-ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div [class]="classes()">
      <ng-content />
    </div>
  `
})
export class UiCardComponent {
  readonly padded = input(true);
  readonly highlighted = input(false);
  readonly class = input('');

  private readonly paddingClass = computed(() => (this.padded() ? 'p-6' : 'p-0 overflow-hidden'));

  private readonly highlightClass = computed(() =>
    this.highlighted()
      ? 'ring-2 ring-accent ring-offset-2 ring-offset-background shadow-md border-accent/30'
      : ''
  );

  protected readonly classes = computed(
    () =>
      `h-full rounded-2xl border border-slate-200/80 bg-surface shadow-soft transition duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-px dark:border-slate-600/70 dark:bg-slate-900/85 dark:hover:border-slate-500 dark:hover:bg-slate-900/95 ${this.paddingClass()} ${this.highlightClass()} ${this.class()}`
  );
}
