import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { MovimientoList, TipoMovimiento } from '../../core/models/entities.model';
import { defaultDesdeHasta } from '../../core/util/dates';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-historial-movimientos',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <h1>Historial de movimientos</h1>
      <p class="muted">Parámetros obligatorios en API: <code>desde</code>, <code>hasta</code> (fecha ISO yyyy-MM-dd).</p>
      <form [formGroup]="form" (ngSubmit)="search()" class="card row">
        <div class="field">
          <label>Desde</label>
          <input type="date" formControlName="desde" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input type="date" formControlName="hasta" />
        </div>
        <div class="field">
          <label>Tipo</label>
          <select formControlName="tipo">
            <option [ngValue]="null">Todos</option>
            <option [ngValue]="'ENTRADA'">Entrada</option>
            <option [ngValue]="'SALIDA'">Salida</option>
            <option [ngValue]="'TRANSFERENCIA'">Transferencia</option>
            <option [ngValue]="'AJUSTE'">Ajuste</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Consultar</button>
      </form>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Id</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Motivo</th>
              <th>Usuario</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (m of rows(); track m.id) {
              <tr>
                <td>{{ m.id }}</td>
                <td><span class="badge">{{ m.tipoMovimiento }}</span></td>
                <td>{{ fmt(m.fechaMovimiento) }}</td>
                <td>{{ m.motivo }}</td>
                <td>{{ m.usuario?.email }}</td>
                <td><a [routerLink]="['/app', 'movimientos', 'detalle', m.id]">Ver</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="row">
        <button type="button" class="btn" [disabled]="page() <= 0" (click)="prev()">Anterior</button>
        <span class="muted">Página {{ page() + 1 }} / {{ totalPages() }}</span>
        <button type="button" class="btn" [disabled]="page() + 1 >= totalPages()" (click)="next()">Siguiente</button>
      </div>
    </div>
  `
})
export class HistorialMovimientosPage implements OnInit {
  private readonly api = inject(MovimientoApiService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    desde: [''],
    hasta: [''],
    tipo: null as TipoMovimiento | null
  });

  readonly rows = signal<MovimientoList[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  ngOnInit(): void {
    const { desde, hasta } = defaultDesdeHasta();
    this.form.patchValue({ desde, hasta });
    this.search();
  }

  search(): void {
    this.page.set(0);
    this.load();
  }

  load(): void {
    const { desde, hasta, tipo } = this.form.getRawValue();
    if (!desde || !hasta) return;
    this.error.set(null);
    this.planFollowup.set(null);
    this.api.historial(desde, hasta, this.page(), 20, tipo ?? undefined).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => patchPlanErrorSignals(e, this.error, this.planFollowup)
    });
  }

  prev(): void {
    this.page.update((n) => Math.max(0, n - 1));
    this.load();
  }

  next(): void {
    this.page.update((n) => n + 1);
    this.load();
  }

  fmt(iso: string): string {
    return iso?.slice(0, 19)?.replace('T', ' ') ?? '';
  }
}
