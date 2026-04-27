import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { VentaApiService } from '../../core/api/venta-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES_ADMIN } from '../../core/auth/app-roles';
import { VentaDetailResponse } from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-venta-detalle',
  imports: [RouterLink, PlanBlockFollowupComponent, DatePipe, DecimalPipe, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header page-header--split">
        <div class="page-header__intro">
          <p class="card-eyebrow" style="margin: 0 0 0.35rem">Ventas</p>
          <h1>
            Venta {{ v()?.codigoPublico ?? '…' }}
            <span class="muted" style="font-size: 0.55em; font-weight: 500">#{{ ventaId() }}</span>
          </h1>
          <app-dismissible-hint hintId="ventas.detalle.pageIntro" persist="local" variant="flush">
            <p class="page-lead muted" style="margin: 0">
              Referencia comercial y trazabilidad con inventario (movimiento asociado).
            </p>
          </app-dismissible-hint>
        </div>
        <div class="row venta-detalle-no-print" style="flex-wrap: wrap; gap: 0.5rem; align-items: center">
          @if (puedeAnular()) {
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="anulando()"
              (click)="anular()"
            >
              @if (anulando()) {
                <span class="spinner" aria-hidden="true"></span>
              }
              Anular venta
            </button>
          }
          @if (puedeVerRecibo()) {
            <a [routerLink]="['/app', 'ventas', 'recibo', ventaId()!]" class="btn btn-primary">Comprobante</a>
          }
          <button type="button" class="btn btn-ghost" (click)="imprimir()">Imprimir esta página</button>
          <a routerLink="/app/ventas" class="btn btn-secondary">Volver al panel</a>
        </div>
      </header>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }

      @if (v(); as row) {
        @if (row.estado === 'PENDIENTE_PAGO') {
          <div class="card card--info" role="status">
            <p class="muted" style="margin: 0; font-size: 0.9rem">
              <strong>Pendiente de pago:</strong> aún no hay movimiento de inventario. Completá el cobro en Stripe o
              cancelá la venta pendiente desde el punto de venta. Estado de pago:
              <span class="badge badge-muted">{{ row.pagoEstado ?? '—' }}</span>
            </p>
          </div>
        }
        @if (row.estado === 'CANCELADA_SIN_PAGO') {
          <div class="card card--info" role="status">
            <p class="muted" style="margin: 0; font-size: 0.9rem">
              <strong>Cancelada sin pago:</strong> no se registró cobro ni descuento de stock.
            </p>
          </div>
        }
        @if (row.estado === 'ANULACION_SOLICITADA') {
          <div class="card card--info venta-anulada-nota" role="status">
            <p class="muted" style="margin: 0; font-size: 0.9rem">
              <strong>Anulación solicitada:</strong> pendiente de revisión administrativa. El stock todavía no se ha
              revertido y el movimiento de inventario sigue siendo la referencia operativa hasta que un ADMIN apruebe.
            </p>
          </div>
        }
        @if (row.estado === 'ANULADA') {
          <div class="card card--info venta-anulada-nota" role="status">
            <p class="muted" style="margin: 0; font-size: 0.9rem">
              <strong>Venta anulada operativamente:</strong>
              @if (row.movimientoId != null) {
                el movimiento #{{ row.movimientoId }} quedó
                <span class="badge badge-muted">{{ row.movimientoEstado }}</span> y el stock de esta venta fue revertido.
              } @else {
                Sin movimiento asociado.
              }
              El registro se conserva para auditoría; <strong>no cuenta</strong> en KPIs de ventas confirmadas.
              @if (esStripePagadaNoRefund(row)) {
                <strong> Pago Stripe registrado:</strong> esta anulación operativa no confirma ni ejecuta un reembolso.
              }
            </p>
          </div>
        }
        <div class="card stack venta-detalle-encabezado">
          <div class="row" style="flex-wrap: wrap; gap: 1rem 1.5rem; align-items: baseline">
            <p style="margin: 0">
              <strong>Estado venta:</strong>
              <span [class]="estadoVentaBadgeClass(row.estado)">{{ labelEstadoVenta(row.estado) }}</span>
            </p>
            <p style="margin: 0">
              <strong>Fecha:</strong> {{ row.fechaVenta | date: 'medium' }}
            </p>
            <p style="margin: 0"><strong>Bodega:</strong> {{ row.bodegaNombre }}</p>
            <p style="margin: 0">
              <strong>Vendedor:</strong>
              @if (row.usuarioNombre) {
                {{ row.usuarioNombre }}
                <span class="muted"> · {{ row.usuarioEmail }}</span>
              } @else {
                {{ row.usuarioEmail }}
              }
            </p>
            <p style="margin: 0"><strong>Total:</strong> {{ row.total | number: '1.2-2' }}</p>
          </div>
          <div class="row" style="flex-wrap: wrap; gap: 1rem 1.5rem">
            <p style="margin: 0">
              <strong>Cliente:</strong>
              @if (row.clienteNombre) {
                {{ row.clienteNombre }}
                @if (row.clienteDocumento) {
                  <span class="muted"> · Doc. {{ row.clienteDocumento }}</span>
                }
                @if (row.clienteTelefono) {
                  <span class="muted"> · {{ row.clienteTelefono }}</span>
                }
              } @else {
                <span class="muted">Sin cliente</span>
              }
            </p>
            <p style="margin: 0">
              <strong>Pago:</strong>
              <span class="badge badge-muted">{{ labelPagoEstado(row.pagoEstado) }}</span>
              @if (esStripePagadaNoRefund(row)) {
                <span class="muted"> · pago no marcado como reembolsado</span>
              }
            </p>
            <p style="margin: 0">
              <strong>Movimiento inventario:</strong>
              @if (row.movimientoId != null) {
                #{{ row.movimientoId }}
                <span class="badge badge-muted">{{ row.movimientoEstado }}</span>
              } @else {
                <span class="muted">— (pendiente de confirmar pago)</span>
              }
            </p>
          </div>
          @if (row.observacion) {
            <p class="muted" style="margin: 0"><strong>Observación:</strong> {{ row.observacion }}</p>
          }
        </div>

        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th class="data-numeric">Cantidad</th>
                <th class="data-numeric">P. unit.</th>
                <th class="data-numeric">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (l of row.lineas; track l.id) {
                <tr>
                  <td>{{ l.productoCodigo }}</td>
                  <td>{{ l.productoNombre }}</td>
                  <td class="data-numeric">{{ l.cantidad | number }}</td>
                  <td class="data-numeric">{{ l.precioUnitario | number: '1.2-2' }}</td>
                  <td class="data-numeric">{{ l.subtotal | number: '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (!error()) {
        <p class="muted" role="status">Cargando…</p>
      }
    </div>
  `,
  styles: `
    .badge-warn {
      background: color-mix(in srgb, var(--color-warning-soft, #fef3c7) 70%, transparent);
    }
    .badge-muted {
      margin-left: 0.35rem;
      font-weight: 500;
      opacity: 0.9;
    }
    .venta-detalle-encabezado p {
      font-size: 0.9375rem;
    }
    .venta-anulada-nota {
      border-style: dashed;
    }
    @media print {
      .venta-detalle-no-print {
        display: none !important;
      }
      .page.stack {
        max-width: 100%;
      }
    }
  `
})
export class VentaDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(VentaApiService);
  private readonly auth = inject(AuthService);

  readonly ventaId = signal<number | null>(null);
  readonly v = signal<VentaDetailResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly anulando = signal(false);

  readonly puedeAnular = computed(() => {
    const row = this.v();
    return this.auth.hasAnyRole(ROLES_ADMIN) && row?.estado === 'CONFIRMADA';
  });

  readonly puedeVerRecibo = computed(() => this.v()?.estado === 'CONFIRMADA');

  /** Solo presentación; el API sigue usando enums en mayúsculas. */
  labelEstadoVenta(estado: string): string {
    if (estado === 'CONFIRMADA') {
      return 'Confirmada';
    }
    if (estado === 'ANULADA') {
      return 'Anulada (stock revertido)';
    }
    if (estado === 'ANULACION_SOLICITADA') {
      return 'Anulación solicitada';
    }
    if (estado === 'PENDIENTE_PAGO') {
      return 'Pendiente pago';
    }
    if (estado === 'CANCELADA_SIN_PAGO') {
      return 'Cancelada sin pago';
    }
    return estado;
  }

  estadoVentaBadgeClass(estado: string): string {
    if (estado === 'CONFIRMADA') return 'badge badge-ok';
    if (estado === 'ANULADA') return 'badge badge-off';
    if (estado === 'ANULACION_SOLICITADA' || estado === 'PENDIENTE_PAGO') return 'badge badge-pending';
    return 'badge badge-muted';
  }

  labelPagoEstado(estado: string | null | undefined): string {
    const labels: Record<string, string> = {
      STRIPE_PENDING: 'Stripe pendiente',
      STRIPE_SUCCEEDED: 'Stripe pagado',
      STRIPE_FAILED: 'Stripe fallido',
      STRIPE_CANCELLED: 'Stripe cancelado'
    };
    return estado ? labels[estado] ?? estado : 'Sin pago Stripe';
  }

  esStripePagadaNoRefund(row: VentaDetailResponse): boolean {
    return row.estado === 'ANULADA' && row.pagoEstado === 'STRIPE_SUCCEEDED';
  }

  imprimir(): void {
    window.print();
  }

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('Identificador de venta inválido.');
      return;
    }
    this.ventaId.set(id);
    this.recargar();
  }

  private recargar(): void {
    const id = this.ventaId();
    if (id == null) {
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

  anular(): void {
    const id = this.ventaId();
    const row = this.v();
    if (id == null || row == null || row.estado !== 'CONFIRMADA') {
      return;
    }
    const ok = window.confirm(
      `¿Anular operativamente la venta ${row.codigoPublico}? Se revertirá el stock y el movimiento #${row.movimientoId ?? '?'} quedará ANULADO. Esta acción no procesa reembolsos ni borra el registro.`
    );
    if (!ok) {
      return;
    }
    this.anulando.set(true);
    this.error.set(null);
    this.api
      .anular(id)
      .pipe(switchMap(() => this.api.get(id)))
      .subscribe({
        next: (det) => {
          this.v.set(det);
          this.anulando.set(false);
        },
        error: (e) => {
          this.anulando.set(false);
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }
}
