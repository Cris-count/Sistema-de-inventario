import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BodegaService } from '../../core/api/bodega.service';
import { InventarioService } from '../../core/api/inventario.service';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { AbastecimientoPanelResponse, MovimientoList } from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-abastecimiento',
  imports: [RouterLink, FormsModule, PlanBlockFollowupComponent, DatePipe, DecimalPipe],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <p class="card-eyebrow" style="margin: 0 0 0.35rem">Abastecimiento</p>
          <h1>Panel de reposición</h1>
          <p class="page-lead">
            Productos con stock en o bajo el mínimo por bodega. Priorizá criticidad, confirmá proveedor sugerido y
            registrá entradas sin salir del flujo operativo.
          </p>
        </div>
        <div class="page-header__actions" style="flex-wrap: wrap; gap: 0.5rem">
          <a routerLink="/app/inventario" class="btn btn-secondary">Ver inventario completo</a>
          <a routerLink="/app/productos" class="btn btn-text">Catálogo de productos</a>
        </div>
      </header>

      <div class="card stack stack--tight">
        <div class="row" style="flex-wrap: wrap; align-items: flex-end; gap: var(--space-ds-4)">
          <div class="field" style="min-width: 14rem">
            <label for="abq-bodega">Filtrar por bodega</label>
            <select id="abq-bodega" name="bodegaId" [(ngModel)]="bodegaFiltro" (ngModelChange)="onBodegaChange()">
              <option [ngValue]="null">Todas las bodegas</option>
              @for (b of bodegas(); track b.id) {
                <option [ngValue]="b.id">{{ b.codigo }} — {{ b.nombre }}</option>
              }
            </select>
          </div>
          <button type="button" class="btn btn-primary" [disabled]="loading()" (click)="reload()">
            @if (loading()) {
              <span class="spinner" aria-hidden="true"></span>
            }
            Actualizar
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }

      @if (loading() && !panel()) {
        <div class="card card--info" role="status" aria-live="polite" aria-busy="true">
          <p class="muted" style="margin: 0; display: flex; align-items: center; gap: 0.65rem">
            <span class="spinner" aria-hidden="true"></span>
            Cargando panel de reposición…
          </p>
        </div>
      }

      @if (panel(); as p) {
        <section class="kpi-grid" aria-label="Resumen de reposición">
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Líneas por reponer</h2>
            <p class="stat">{{ p.resumen.totalLineasReposicion | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">cantidad ≤ mínimo (producto activo, mín. &gt; 0)</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Sin stock</h2>
            <p class="stat text-danger">{{ p.resumen.sinStock | number }}</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Críticos</h2>
            <p class="stat" style="color: var(--color-danger, #b91c1c)">{{ p.resumen.criticos | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">stock &gt; 0 y ≤ 50% del mínimo</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Bajo mínimo</h2>
            <p class="stat">{{ p.resumen.bajoMinimo | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">por encima del umbral crítico hasta el mínimo</p>
          </div>
          <div class="card kpi-card">
            <h2 class="ds-section-title" style="font-size: var(--text-body)">Entradas hoy</h2>
            <p class="stat">{{ p.resumen.entradasHoy | number }}</p>
            <p class="muted" style="margin: 0; font-size: 0.875rem">zona horaria Colombia (operación)</p>
          </div>
        </section>

        <p class="field-hint" style="margin: 0; max-width: 72ch">
          <strong>Proveedor sugerido:</strong> se calcula por producto (proveedor preferido en ficha del producto, o el
          último vinculado en una entrada que incluya ese producto). No implica exclusividad por bodega.
        </p>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Bodega</th>
                <th class="data-numeric">Stock</th>
                <th class="data-numeric">Mín.</th>
                <th>Estado</th>
                <th>Proveedor sugerido</th>
                <th>Última entrada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (r of p.productos; track r.productoId + '-' + r.bodegaId) {
                <tr>
                  <td>{{ r.codigo }}</td>
                  <td>{{ r.nombre }}</td>
                  <td>{{ r.nombreBodega }}</td>
                  <td class="data-numeric">{{ r.stockActual }}</td>
                  <td class="data-numeric">{{ r.stockMinimo }}</td>
                  <td>
                    <span [class]="estadoBadgeClass(r.estadoReposicion)">{{ etiquetaEstado(r.estadoReposicion) }}</span>
                  </td>
                  <td>
                    @if (r.proveedorNombre) {
                      <span>{{ r.proveedorNombre }}</span>
                      @if (r.fuenteProveedor === 'PREFERIDO') {
                        <span class="badge badge-ok" style="margin-left: 0.35rem">Preferido</span>
                      } @else if (r.fuenteProveedor === 'ULTIMA_ENTRADA') {
                        <span class="badge badge-info" style="margin-left: 0.35rem">Última entrada</span>
                      }
                    } @else {
                      <span class="muted">Sin proveedor asociado</span>
                    }
                  </td>
                  <td>
                    @if (r.fechaUltimaEntrada) {
                      {{ r.fechaUltimaEntrada | date: 'short' }}
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td>
                    <div class="row table-actions" style="flex-wrap: wrap; gap: 0.35rem">
                      @if (r.puedeRegistrarEntrada) {
                        <a
                          class="btn btn-primary"
                          style="padding: 0.35rem 0.65rem; font-size: 0.875rem"
                          [routerLink]="['/app/movimientos/entrada']"
                          [queryParams]="entradaQuery(r)"
                          >Entrada</a
                        >
                      } @else {
                        <span class="muted" title="Plan o rol sin registro de entradas">Entrada no disponible</span>
                      }
                      @if (r.proveedorId) {
                        <a class="btn btn-text" routerLink="/app/proveedores">Ver catálogo de proveedores</a>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9">
                    <p class="muted" style="margin: 0">
                      No hay líneas por reponer con los filtros actuales. Buen momento para revisar mínimos o el catálogo.
                    </p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <section class="card stack stack--tight">
        <h2 class="ds-section-title">Entradas recientes</h2>
        <p class="muted" style="margin: 0; max-width: 65ch; font-size: 0.9rem">
          Últimos movimientos de tipo entrada (7 días). Mismo origen que el historial de movimientos.
        </p>
        @if (entradasErr()) {
          <div class="alert alert-error" role="alert">{{ entradasErr() }}</div>
        } @else if (entradas().length === 0 && !entradasLoading()) {
          <p class="muted" style="margin: 0">No hay entradas en el período consultado.</p>
        } @else {
          <div class="table-wrap">
            <table class="data">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                @for (m of entradas(); track m.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/app/movimientos/detalle', m.id]">#{{ m.id }}</a>
                    </td>
                    <td>{{ m.fechaMovimiento | date: 'short' }}</td>
                    <td>{{ m.motivo || '—' }}</td>
                    <td>{{ m.proveedor?.razonSocial ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (entradasLoading()) {
          <p class="muted"><span class="spinner" aria-hidden="true"></span> Cargando entradas…</p>
        }
      </section>
    </div>
  `
})
export class AbastecimientoPage implements OnInit {
  private readonly inventarioApi = inject(InventarioService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly movApi = inject(MovimientoApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly panel = signal<AbastecimientoPanelResponse | null>(null);

  readonly bodegas = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  bodegaFiltro: number | null = null;

  readonly entradas = signal<MovimientoList[]>([]);
  readonly entradasLoading = signal(false);
  readonly entradasErr = signal<string | null>(null);

  ngOnInit(): void {
    this.bodegaApi.list().subscribe({
      next: (b) =>
        this.bodegas.set(
          b.filter((x) => x.activo !== false).map((x) => ({ id: x.id, codigo: x.codigo, nombre: x.nombre }))
        ),
      error: () => this.bodegas.set([])
    });
    this.reload();
    this.loadEntradasRecientes();
  }

  onBodegaChange(): void {
    this.reload();
  }

  reload(): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.loading.set(true);
    this.inventarioApi.panelAbastecimiento(this.bodegaFiltro).subscribe({
      next: (data) => {
        this.panel.set(data);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
        if (!this.planFollowup()) {
          this.error.set(getApiErrorMessage(e));
        }
      }
    });
  }

  private loadEntradasRecientes(): void {
    this.entradasLoading.set(true);
    this.entradasErr.set(null);
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    this.movApi.historial(fmt(desde), fmt(hasta), 0, 8, 'ENTRADA').subscribe({
      next: (page) => {
        this.entradas.set(page.content ?? []);
        this.entradasLoading.set(false);
      },
      error: (e) => {
        this.entradasLoading.set(false);
        this.entradasErr.set(getApiErrorMessage(e));
      }
    });
  }

  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'SIN_STOCK':
        return 'badge badge-danger';
      case 'CRITICO':
        return 'badge badge-warn';
      case 'BAJO':
        return 'badge badge-info';
      default:
        return 'badge';
    }
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'SIN_STOCK':
        return 'Sin stock';
      case 'CRITICO':
        return 'Crítico';
      case 'BAJO':
        return 'Bajo mínimo';
      default:
        return estado;
    }
  }

  entradaQuery(r: {
    productoId: number;
    bodegaId: number;
    proveedorId: number | null;
  }): Record<string, number> {
    const q: Record<string, number> = { productoId: r.productoId, bodegaId: r.bodegaId };
    if (r.proveedorId != null) {
      q['proveedorId'] = r.proveedorId;
    }
    return q;
  }
}
