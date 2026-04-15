import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PlanBlockFollowup } from '../core/util/api-error';

@Component({
  selector: 'app-plan-block-followup',
  imports: [RouterLink],
  template: `
    @if (followup(); as f) {
      <p class="page-lead" style="margin: 0.75rem 0 0">
        <a
          routerLink="/app/mi-empresa"
          fragment="cambio-plan"
          class="btn btn-primary"
          style="display: inline-block; text-decoration: none"
        >
          {{ f.linkLabel }}
        </a>
      </p>
    }
  `
})
export class PlanBlockFollowupComponent {
  /** Null: no se muestra CTA. */
  readonly followup = input<PlanBlockFollowup | null>(null);
}
