import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { MovimientoResponse } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-movimiento-detalle',
  imports: [PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Movimiento #{{ id() }}</h1>
        <p class="page-lead page-header-lead">Detalle de cabecera y líneas del movimiento.</p>
      </header>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }
      @if (mov(); as m) {
        <div class="card stack">
          <p><span class="badge">{{ m.tipoMovimiento }}</span> — estado {{ m.estado }}</p>
          <p class="muted">Motivo: {{ m.motivo }} · Ref: {{ m.referenciaDocumento }}</p>
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Origen</th>
                  <th>Destino</th>
                </tr>
              </thead>
              <tbody>
                @for (d of m.detalles; track d.id) {
                  <tr>
                    <td>{{ d.productoCodigo }} (#{{ d.productoId }})</td>
                    <td>{{ d.cantidad }}</td>
                    <td>{{ d.bodegaOrigenId }}</td>
                    <td>{{ d.bodegaDestinoId }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class MovimientoDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(MovimientoApiService);

  readonly id = signal<number | null>(null);
  readonly mov = signal<MovimientoResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const n = idParam ? +idParam : NaN;
    if (!Number.isFinite(n)) {
      this.error.set('Id inválido');
      return;
    }
    this.id.set(n);
    this.api.get(n).subscribe({
      next: (r) => {
        this.mov.set(r);
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => patchPlanErrorSignals(e, this.error, this.planFollowup)
    });
  }
}
