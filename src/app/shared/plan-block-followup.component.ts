import { Component, input } from '@angular/core';
import type { PlanBlockFollowup } from '../core/util/api-error';
import { slideDown } from '../core/animations';
import { UiButtonComponent } from './components/ui/button/ui-button.component';

/**
 * Link de seguimiento tras un bloqueo por plan. Se muestra cuando el usuario
 * intentó una acción y recibió un error tipo PLAN_*. Redirige a
 * `/app/mi-empresa#cambio-plan` para que pueda hacer upgrade.
 *
 * Visual: usa el botón primario del sistema (teal gradient), coherente con los
 * CTAs principales de landing y dashboard.
 */
@Component({
  selector: 'app-plan-block-followup',
  imports: [UiButtonComponent],
  animations: [slideDown],
  template: `
    @if (followup(); as f) {
      <p @slideDown class="page-lead" style="margin: 0.75rem 0 0">
        <app-ui-button variant="primary" size="md" linkTo="/app/mi-empresa" fragment="cambio-plan">
          {{ f.linkLabel }}
        </app-ui-button>
      </p>
    }
  `
})
export class PlanBlockFollowupComponent {
  /** Null: no se muestra CTA. */
  readonly followup = input<PlanBlockFollowup | null>(null);
}
