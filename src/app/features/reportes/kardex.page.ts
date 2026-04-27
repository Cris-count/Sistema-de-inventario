import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReporteService } from '../../core/api/reporte.service';
import { ProductoService } from '../../core/api/producto.service';
import { KardexMovimiento } from '../../core/models/entities.model';
import { defaultDesdeHasta } from '../../core/util/dates';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-kardex',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Kardex</h1>
        <app-dismissible-hint hintId="reportes.kardex.pageIntro" persist="local" variant="flush">
          <p class="page-lead page-header-lead">
            Trazabilidad de movimientos por producto para revisar entradas, salidas y ajustes en un período específico.
          </p>
        </app-dismissible-hint>
      </header>
      <form [formGroup]="form" (ngSubmit)="search()" class="card row form-export">
        <div class="field field-flex-1">
          <label>Producto</label>
          <select formControlName="productoId">
            <option [ngValue]="null">Selecciona un producto</option>
            @for (p of productos(); track p.id) {
              <option [ngValue]="p.id">{{ p.codigo }} — {{ p.nombre }}</option>
            }
          </select>
          <app-dismissible-hint hintId="reportes.kardex.productoFieldHint" persist="local" variant="flush">
            <p class="field-hint">El kardex se consulta por producto para seguir su historial de movimientos.</p>
          </app-dismissible-hint>
        </div>
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
      <app-dismissible-hint hintId="reportes.kardex.anuladosSemantica" persist="local" variant="flush">
        <p class="field-hint">
          El Kardex muestra movimientos anulados solo como trazabilidad. Una fila anulada indica que su efecto operativo
          ya fue revertido y no debe leerse como stock vigente.
        </p>
      </app-dismissible-hint>
      <div class="table-wrap" [attr.aria-busy]="loading()">
        @if (loading()) {
          <div class="table-loading">
            <span class="spinner" aria-hidden="true"></span>
            Cargando kardex…
          </div>
        } @else if (!error() && rows().length === 0) {
          <div class="table-empty" role="status">
            <p class="table-empty__title">No hay movimientos para este producto en el período elegido</p>
            <p class="table-empty__hint">Prueba otro rango de fechas o selecciona un producto diferente.</p>
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
export class KardexPage implements OnInit {
  private readonly api = inject(ReporteService);
  private readonly productoApi = inject(ProductoService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    productoId: null as number | null,
    desde: [''],
    hasta: ['']
  });

  readonly productos = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly rows = signal<KardexMovimiento[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  ngOnInit(): void {
    const { desde, hasta } = defaultDesdeHasta();
    this.form.patchValue({ desde, hasta });
    this.productoApi.list(0, 500).subscribe({
      next: (p) => this.productos.set(p.content.map((x) => ({ id: x.id, codigo: x.codigo, nombre: x.nombre }))),
      error: () => this.productos.set([])
    });
  }

  search(): void {
    const pid = this.form.getRawValue().productoId;
    if (pid == null) {
      this.planFollowup.set(null);
      this.error.set('Selecciona un producto para consultar su kardex.');
      return;
    }
    this.error.set(null);
    this.planFollowup.set(null);
    this.page.set(0);
    this.load();
  }

  load(): void {
    const { productoId, desde, hasta } = this.form.getRawValue();
    if (productoId == null || !desde || !hasta) return;
    this.loading.set(true);
    this.api.kardex(productoId, desde, hasta, this.page(), 20).subscribe({
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
