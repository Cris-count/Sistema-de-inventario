import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VentaApiService } from '../../core/api/venta-api.service';
import { VentaDetailResponse } from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-venta-pago-retorno',
  imports: [RouterLink, PlanBlockFollowupComponent],
  template: `
    <div class="page stack pago-retorno" style="max-width: 40rem">
      <header class="page-header">
        <p class="card-eyebrow" style="margin: 0 0 0.35rem">Pago con tarjeta</p>
        <h1>Resultado del cobro</h1>
        <p class="page-lead muted" style="margin: 0">
          El sistema confirma el pago con el servidor y Stripe. Esta pantalla no asume que el cobro fue exitoso hasta que
          veas el mensaje correspondiente abajo.
        </p>
      </header>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }

      @if (status() === 'syncing') {
        <div class="card card--info" role="status" aria-busy="true">
          <p class="muted" style="margin: 0; display: flex; align-items: center; gap: 0.65rem">
            <span class="spinner" aria-hidden="true"></span>
            Confirmando el pago con el servidor…
          </p>
          <p class="muted" style="margin: 0.5rem 0 0; font-size: 0.875rem">
            Si recién pagaste, puede tardar unos segundos. No cierres esta pestaña todavía.
          </p>
        </div>
      }

      @if (cancelacionExito()) {
        <div class="alert alert-success" role="status">
          <strong>Listo.</strong> La venta pendiente quedó anulada sin movimiento de inventario. Podés iniciar una venta
          nueva en el punto de venta.
        </div>
        <a routerLink="/app/ventas" [queryParams]="{ limpiar: '1' }" class="btn btn-primary">Ir al punto de venta</a>
      }

      @if (status() === 'cancelled' && !cancelacionExito()) {
        <div class="card stack pago-retorno-card">
          <h2 class="ds-section-title" style="font-size: 1rem; margin: 0">Pago cancelado en Stripe</h2>
          <p class="muted" style="margin: 0; font-size: 0.9375rem">
            No se completó el cobro con tarjeta. La venta sigue <strong>pendiente de pago</strong> en el sistema: el stock
            <strong>no</strong> se descontó.
          </p>
          <p class="muted" style="margin: 0; font-size: 0.875rem">
            Podés volver al POS e intentar cobrar de nuevo, o anular esta venta pendiente si el cliente no compra.
          </p>
          <div class="row" style="flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem">
            <button type="button" class="btn btn-secondary" [disabled]="cancelando()" (click)="cancelarPendiente()">
              @if (cancelando()) {
                <span class="spinner" aria-hidden="true"></span>
              }
              Anular venta pendiente
            </button>
            <a routerLink="/app/ventas" class="btn btn-primary">Volver al punto de venta</a>
            @if (ventaId != null) {
              <a [routerLink]="['/app', 'ventas', 'detalle', ventaId]" class="btn btn-ghost">Ver estado de la venta</a>
            }
          </div>
        </div>
      }

      @if (status() === 'success' && detalle(); as d) {
        <div class="alert alert-success" role="status">
          <strong>Cobro confirmado.</strong> Venta <strong>{{ d.codigoPublico }}</strong> registrada y stock actualizado.
          @if (d.movimientoId != null) {
            <span class="muted"> · Movimiento #{{ d.movimientoId }}</span>
          }
        </div>
        <p class="muted" style="margin: 0; font-size: 0.875rem">
          Entregá el comprobante si hace falta; después podés seguir con la siguiente venta.
        </p>
        <div class="row" style="flex-wrap: wrap; gap: 0.5rem; margin-top: 0.35rem">
          <a [routerLink]="['/app', 'ventas', 'recibo', d.id]" class="btn btn-primary">Ver comprobante / imprimir</a>
          <a routerLink="/app/ventas" [queryParams]="{ limpiar: '1' }" class="btn btn-secondary">Siguiente venta</a>
          <a [routerLink]="['/app', 'ventas', 'detalle', d.id]" class="btn btn-ghost">Detalle</a>
        </div>
      }

      @if (status() === 'pending') {
        <div class="card stack pago-retorno-card pago-retorno-pending" role="status">
          <h2 class="ds-section-title" style="font-size: 1rem; margin: 0">Pago aún no confirmado</h2>
          <p class="muted" style="margin: 0; font-size: 0.9375rem">
            El servidor todavía no marca este cobro como pagado. <strong>Esto no significa que haya fallado:</strong> a
            veces la confirmación llega unos segundos después.
          </p>
          <p class="muted" style="margin: 0; font-size: 0.875rem">
            Reintentá la verificación, revisá el detalle de la venta más tarde, o volvé al POS. Si el cliente fue cobrado
            en Stripe, la venta debería pasar a confirmada al sincronizarse.
          </p>
          <div class="row" style="flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem">
            <button type="button" class="btn btn-secondary" [disabled]="syncing()" (click)="reintentarSync()">
              @if (syncing()) {
                <span class="spinner" aria-hidden="true"></span>
              }
              Reintentar verificación
            </button>
            @if (ventaId != null) {
              <a [routerLink]="['/app', 'ventas', 'detalle', ventaId]" class="btn btn-ghost">Ver venta</a>
            }
            <a routerLink="/app/ventas" class="btn btn-ghost">Volver al POS</a>
          </div>
        </div>
      }

      @if (status() === 'invalid') {
        <div class="card card--info stack">
          <p class="muted" style="margin: 0">
            No llegaron los datos necesarios desde Stripe (venta o sesión). Volvé al punto de venta e iniciá el cobro de
            nuevo. Si ya pagaste, revisá el historial o el detalle de la venta.
          </p>
          <div class="row" style="flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem">
            <a routerLink="/app/ventas" class="btn btn-primary">Ir al punto de venta</a>
            <a routerLink="/app/ventas" [queryParams]="{ limpiar: '1' }" class="btn btn-secondary">Carrito nuevo</a>
            @if (ventaId != null) {
              <a [routerLink]="['/app', 'ventas', 'detalle', ventaId]" class="btn btn-ghost">Ver venta</a>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .pago-retorno-card {
      border: 1px solid var(--border-subtle);
    }
    .pago-retorno-pending {
      background: color-mix(in srgb, var(--surface) 92%, var(--border-subtle));
    }
  `
})
export class VentaPagoRetornoPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(VentaApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly status = signal<'idle' | 'syncing' | 'success' | 'cancelled' | 'pending' | 'invalid'>('idle');
  readonly detalle = signal<VentaDetailResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly cancelando = signal(false);
  readonly syncing = signal(false);
  readonly cancelacionExito = signal(false);

  readonly ventaId: number | null;

  private sessionId: string | null = null;
  private attempt = 0;
  private readonly maxAttempts = 8;
  private readonly delayMs = 2500;
  private pendingTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.pendingTimer != null) {
        globalThis.clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
      }
    });

    const q = this.route.snapshot.queryParamMap;
    const cancelled = q.get('cancelled') === '1';
    const vidRaw = q.get('venta_id');
    const sid = q.get('session_id');

    const vid = vidRaw != null && vidRaw !== '' ? Number(vidRaw) : NaN;
    if (!Number.isFinite(vid)) {
      this.ventaId = null;
      this.status.set('invalid');
      return;
    }
    this.ventaId = vid;

    if (cancelled) {
      this.status.set('cancelled');
      return;
    }

    if (!sid || sid.trim() === '') {
      this.status.set('invalid');
      return;
    }
    this.sessionId = sid.trim();
    this.runSyncChain();
  }

  reintentarSync(): void {
    this.attempt = 0;
    this.error.set(null);
    this.runSyncChain();
  }

  private runSyncChain(): void {
    const ventaId = this.ventaId;
    const sessionId = this.sessionId;
    if (ventaId == null || sessionId == null) {
      return;
    }
    this.status.set('syncing');
    this.syncing.set(true);
    this.trySyncOnce(ventaId, sessionId);
  }

  private trySyncOnce(ventaId: number, sessionId: string): void {
    this.api.sincronizarStripePago(ventaId, sessionId).subscribe({
        next: (res) => {
          this.detalle.set(res);
          this.status.set('success');
          this.syncing.set(false);
        },
        error: (e: unknown) => {
          const http = e instanceof HttpErrorResponse ? e : null;
          const canRetry =
            http?.status === 409 && this.shouldRetryMessage(http) && this.attempt + 1 < this.maxAttempts;
          if (canRetry) {
            this.attempt++;
            this.pendingTimer = globalThis.setTimeout(() => {
              this.pendingTimer = null;
              this.trySyncOnce(ventaId, sessionId);
            }, this.delayMs);
            return;
          }
          this.syncing.set(false);
          if (http?.status === 409 && this.shouldRetryMessage(http)) {
            this.status.set('pending');
            this.error.set(null);
            return;
          }
          this.status.set('pending');
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }

  private shouldRetryMessage(http: HttpErrorResponse): boolean {
    const body = http.error;
    const msg =
      typeof body === 'string'
        ? body
        : body && typeof body === 'object' && 'message' in body
          ? String((body as { message?: string }).message ?? '')
          : '';
    return /Stripe|confirmado|pagado/i.test(msg);
  }

  cancelarPendiente(): void {
    const id = this.ventaId;
    if (id == null) {
      return;
    }
    this.cancelando.set(true);
    this.error.set(null);
    this.api.cancelarVentaPendiente(id).subscribe({
        next: () => {
          this.cancelando.set(false);
          this.error.set(null);
          this.cancelacionExito.set(true);
          this.status.set('idle');
          void this.router.navigateByUrl('/app/ventas/pago-retorno', { replaceUrl: true });
        },
        error: (e) => {
          this.cancelando.set(false);
          this.error.set(getApiErrorMessage(e));
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        }
      });
  }
}
