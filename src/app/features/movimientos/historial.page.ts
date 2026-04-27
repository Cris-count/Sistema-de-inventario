import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { MovimientoList, TipoMovimiento } from '../../core/models/entities.model';
import { defaultDesdeHasta } from '../../core/util/dates';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-historial-movimientos',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, PlanBlockFollowupComponent, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Historial de movimientos</h1>
        <app-dismissible-hint hintId="movimientos.historial.pageIntro" persist="local" variant="flush">
          <p class="page-lead page-header-lead">
            Consulta entradas, salidas, transferencias y ajustes para auditar la operación diaria y rastrear cambios de stock.
          </p>
        </app-dismissible-hint>
      </header>
      <form [formGroup]="form" (ngSubmit)="search()" class="card row form-export">
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
            <option [ngValue]="'SALIDA_POR_VENTA'">Salida por venta</option>
            <option [ngValue]="'TRANSFERENCIA'">Transferencia</option>
            <option [ngValue]="'AJUSTE'">Ajuste</option>
          </select>
          <app-dismissible-hint hintId="movimientos.historial.filtroHint" persist="local" variant="flush">
            <p class="field-hint">Filtra por período y tipo para encontrar movimientos específicos más rápido.</p>
          </app-dismissible-hint>
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner" aria-hidden="true"></span>
          }
          Consultar
        </button>
      </form>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }
      <app-dismissible-hint hintId="movimientos.historial.anuladosSemantica" persist="local" variant="flush">
        <p class="field-hint">
          Los movimientos anulados se conservan para trazabilidad histórica: el stock ya fue revertido y no representan
          un efecto vigente.
        </p>
      </app-dismissible-hint>
      <div class="table-wrap" [attr.aria-busy]="loading()">
        @if (loading()) {
          <div class="table-loading">
            <span class="spinner" aria-hidden="true"></span>
            Cargando movimientos…
          </div>
        } @else if (!error() && rows().length === 0) {
          <div class="table-empty" role="status">
            <p class="table-empty__title">No hay movimientos para los filtros seleccionados</p>
            <p class="table-empty__hint">Ajusta fechas o tipo para ampliar la búsqueda.</p>
          </div>
        } @else {
          <table class="data">
            <thead>
              <tr>
                <th>Id</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Interpretación stock</th>
                <th>Fecha</th>
                <th>Motivo</th>
                <th>Usuario</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (m of rows(); track m.id) {
                <tr [class.table-row-muted]="m.anulado">
                  <td>{{ m.id }}</td>
                  <td><span class="badge">{{ m.tipoMovimiento }}</span></td>
                  <td><span [class]="estadoBadgeClass(m.estado)">{{ labelEstadoMovimiento(m.estado) }}</span></td>
                  <td class="table-cell-muted">{{ m.interpretacionStock }}</td>
                  <td>{{ fmt(m.fechaMovimiento) }}</td>
                  <td>{{ m.motivo || '—' }}</td>
                  <td>{{ m.usuarioEmail || '—' }}</td>
                  <td><a [routerLink]="['/app', 'movimientos', 'detalle', m.id]">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
      <div class="row pager">
        <button type="button" class="btn" [disabled]="loading() || page() <= 0" (click)="prev()">Anterior</button>
        <span class="muted">Página {{ page() + 1 }} / {{ totalPages() }}</span>
        <button type="button" class="btn" [disabled]="loading() || page() + 1 >= totalPages()" (click)="next()">Siguiente</button>
      </div>
    </div>
  `,
  styles: `
    .table-row-muted {
      opacity: 0.72;
    }
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
  readonly loading = signal(false);
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
    this.loading.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    this.api.historial(desde, hasta, this.page(), 20, tipo ?? undefined).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => patchPlanErrorSignals(e, this.error, this.planFollowup),
      complete: () => this.loading.set(false)
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

  labelEstadoMovimiento(estado: string): string {
    const labels: Record<string, string> = {
      COMPLETADO: 'Efectivo en stock',
      ANULADO: 'Anulado (stock revertido)',
      BORRADOR: 'Borrador'
    };
    return labels[estado] ?? estado;
  }

  estadoBadgeClass(estado: string): string {
    if (estado === 'ANULADO') return 'badge badge-off';
    if (estado === 'COMPLETADO') return 'badge badge-ok';
    return 'badge badge-pending';
  }
}
