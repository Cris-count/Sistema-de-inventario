import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VentaApiService } from '../../core/api/venta-api.service';
import { VentaDetailResponse } from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-venta-recibo',
  imports: [RouterLink, PlanBlockFollowupComponent, DatePipe, DecimalPipe],
  template: `
    <div class="recibo-page stack">
      <div class="recibo-no-print row" style="flex-wrap: wrap; gap: 0.5rem; align-items: center">
        <a routerLink="/app/ventas" class="btn btn-ghost btn-sm">← Ventas</a>
        @if (v(); as row) {
          <a [routerLink]="['/app', 'ventas', 'detalle', row.id]" class="btn btn-ghost btn-sm">Detalle</a>
        }
        @if (puedeImprimir()) {
          <button type="button" class="btn btn-primary btn-sm" (click)="imprimir()">Imprimir</button>
          <a routerLink="/app/ventas" [queryParams]="{ limpiar: '1' }" class="btn btn-secondary btn-sm">Siguiente venta</a>
        }
      </div>

      @if (error()) {
        <div class="alert alert-error recibo-no-print" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }

      @if (v(); as row) {
        @if (!esReciboValido(row)) {
          <div class="card card--info recibo-no-print" role="status">
            <p class="muted" style="margin: 0">
              El comprobante de venta solo está disponible para ventas <strong>confirmadas</strong>. Esta venta está en
              estado «{{ labelEstado(row.estado) }}».
            </p>
            <a [routerLink]="['/app', 'ventas', 'detalle', row.id]" class="btn btn-secondary btn-sm" style="margin-top: 0.75rem"
              >Ir al detalle</a
            >
          </div>
        } @else {
          <article class="recibo-doc" aria-label="Comprobante de venta">
            <header class="recibo-header">
              <h1 class="recibo-title">Comprobante de venta</h1>
              <p class="recibo-empresa">{{ row.empresaNombre ?? '—' }}</p>
              <p class="recibo-legal muted">
                Comprobante operativo. No constituye factura de venta ni documento equivalente para fines tributarios.
              </p>
            </header>

            <section class="recibo-meta">
              <div class="recibo-meta-grid">
                <div>
                  <span class="recibo-label">Referencia</span>
                  <strong>{{ row.codigoPublico }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Fecha y hora</span>
                  <strong>{{ row.fechaVenta | date: 'medium' }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Vendedor</span>
                  <strong>{{ row.usuarioNombre ?? row.usuarioEmail }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Bodega</span>
                  <strong>{{ row.bodegaNombre }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Cliente</span>
                  <strong>{{ row.clienteNombre ?? '—' }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Pago</span>
                  <strong>{{ etiquetaPago(row) }}</strong>
                </div>
                <div>
                  <span class="recibo-label">Medio</span>
                  <strong>{{ row.metodoPagoEtiqueta ?? labelMetodoPago(row.metodoPago, row.pagoEstado) }}</strong>
                </div>
                @if (row.metodoPago === 'EFECTIVO' && row.montoRecibido != null && row.cambio != null) {
                  <div>
                    <span class="recibo-label">Recibido</span>
                    <strong>{{ row.montoRecibido | number: '1.2-2' }}</strong>
                  </div>
                  <div>
                    <span class="recibo-label">Cambio</span>
                    <strong>{{ row.cambio | number: '1.2-2' }}</strong>
                  </div>
                }
              </div>
            </section>

            @if (row.observacion) {
              <p class="recibo-obs">
                <span class="recibo-label">Nota</span>
                {{ row.observacion }}
              </p>
            }

            <div class="recibo-table-wrap">
              <table class="recibo-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th class="num">Cant.</th>
                    <th class="num">P. unit.</th>
                    <th class="num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (l of row.lineas; track l.id) {
                    <tr>
                      <td>{{ l.productoCodigo }}</td>
                      <td>{{ l.productoNombre }}</td>
                      <td class="num">{{ l.cantidad | number }}</td>
                      <td class="num">{{ l.precioUnitario | number: '1.2-2' }}</td>
                      <td class="num">{{ l.subtotal | number: '1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <footer class="recibo-footer">
              <div class="recibo-total">
                <span class="recibo-label">Total</span>
                <strong class="recibo-total-monto">{{ row.total | number: '1.2-2' }}</strong>
              </div>
            </footer>
          </article>
        }
      } @else if (!error()) {
        <p class="muted recibo-no-print" role="status">Cargando…</p>
      }
    </div>
  `,
  styles: `
    .recibo-page {
      max-width: 42rem;
    }
    .recibo-doc {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm, 8px);
      padding: 1.25rem 1.35rem;
      background: var(--surface);
    }
    .recibo-title {
      margin: 0 0 0.25rem;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .recibo-empresa {
      margin: 0 0 0.35rem;
      font-size: 1.05rem;
      font-weight: 600;
    }
    .recibo-legal {
      margin: 0 0 1rem;
      font-size: 0.78rem;
      line-height: 1.35;
      max-width: 36rem;
    }
    .recibo-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
      gap: 0.65rem 1rem;
      font-size: 0.875rem;
    }
    .recibo-label {
      display: block;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.12rem;
    }
    .recibo-obs {
      margin: 1rem 0;
      font-size: 0.875rem;
    }
    .recibo-table-wrap {
      margin-top: 0.5rem;
      overflow-x: auto;
    }
    .recibo-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }
    .recibo-table th,
    .recibo-table td {
      padding: 0.4rem 0.35rem;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }
    .recibo-table th {
      font-weight: 600;
      color: var(--muted);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .recibo-table .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .recibo-footer {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 2px solid var(--border);
    }
    .recibo-total {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      gap: 0.75rem;
    }
    .recibo-total-monto {
      font-size: 1.35rem;
      font-variant-numeric: tabular-nums;
    }
    @media print {
      .recibo-no-print {
        display: none !important;
      }
      .recibo-page {
        max-width: 100%;
      }
      .recibo-doc {
        border: none;
        padding: 0;
      }
    }
  `
})
export class VentaReciboPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(VentaApiService);

  readonly v = signal<VentaDetailResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('Identificador de venta inválido.');
      return;
    }
    this.api.get(id).subscribe({
      next: (row) => {
        this.v.set(row);
        this.error.set(null);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }

  esReciboValido(row: VentaDetailResponse): boolean {
    return row.estado === 'CONFIRMADA';
  }

  puedeImprimir(): boolean {
    const row = this.v();
    return row != null && this.esReciboValido(row);
  }

  etiquetaPago(row: VentaDetailResponse): string {
    if (row.estado !== 'CONFIRMADA') {
      return '—';
    }
    return 'Pagado';
  }

  labelMetodoPago(metodo: string | null | undefined, pagoEstado?: string | null): string {
    if (metodo === 'EFECTIVO') return 'Efectivo';
    if (metodo === 'STRIPE' || pagoEstado?.startsWith('STRIPE_')) return 'Tarjeta (Stripe)';
    return '—';
  }

  labelEstado(estado: string): string {
    const m: Record<string, string> = {
      CONFIRMADA: 'Confirmada',
      ANULACION_SOLICITADA: 'Anulación solicitada',
      ANULADA: 'Anulada (stock revertido)',
      PENDIENTE_PAGO: 'Pendiente de pago',
      CANCELADA_SIN_PAGO: 'Cancelada sin pago'
    };
    return m[estado] ?? estado;
  }

  imprimir(): void {
    globalThis.print();
  }
}
