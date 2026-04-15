import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReporteService } from '../../core/api/reporte.service';
import { defaultDesdeHasta } from '../../core/util/dates';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-reporte-export',
  imports: [ReactiveFormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <h1>Exportar movimientos (CSV)</h1>
      <p class="muted">Endpoint real: <code>GET /reportes/movimientos/export?desde&amp;hasta</code></p>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="download()" class="card row">
        <div class="field">
          <label>Desde</label>
          <input type="date" formControlName="desde" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input type="date" formControlName="hasta" />
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span>
          }
          Descargar CSV
        </button>
      </form>
    </div>
  `
})
export class ExportReportePage {
  private readonly api = inject(ReporteService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    desde: [''],
    hasta: ['']
  });

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  constructor() {
    const { desde, hasta } = defaultDesdeHasta();
    this.form.patchValue({ desde, hasta });
  }

  download(): void {
    const { desde, hasta } = this.form.getRawValue();
    if (!desde || !hasta) return;
    this.error.set(null);
    this.planFollowup.set(null);
    this.message.set(null);
    this.loading.set(true);
    this.api.exportMovimientosCsv(desde, hasta).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `movimientos_${desde}_${hasta}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set('Descarga iniciada.');
        flashSuccess(this.destroyRef, () => this.message.set(null));
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.loading.set(false)
    });
  }
}
