import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MensajePedidoEstado,
  MensajePedidoOrigen,
  MensajePedidoRow,
  MensajesPedidoService
} from '../../core/api/mensajes-pedido.service';
import { backdropFade, modalFadeScale } from '../../core/animations';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-mensajes-pedido',
  imports: [FormsModule, PlanBlockFollowupComponent, DismissibleHintComponent],
  animations: [backdropFade, modalFadeScale],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Mensajes pedido a proveedor</h1>
        <app-dismissible-hint hintId="mensajesPedido.pageIntro" persist="local" variant="flush">
          <p class="page-lead page-header-lead max-w-readable">
            Las alertas de stock bajo y las pruebas desde Inventario generan una solicitud aquí. Solo usted (administrador)
            puede aprobar el envío del correo al proveedor o rechazarla. Si aprueba, puede ajustar la cantidad del pedido.
          </p>
        </app-dismissible-hint>
      </header>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }
      @if (actionMsg()) {
        <div class="alert alert-success" role="status">{{ actionMsg() }}</div>
      }
      @if (actionErr()) {
        <div class="alert alert-error" role="alert">{{ actionErr() }}</div>
      }
      <div class="card stack">
        <h2>Filtro</h2>
        <div class="row">
          <div class="field">
            <label>Estado</label>
            <select [ngModel]="filtroEstado() ?? ''" (ngModelChange)="onFiltroEstadoStr($event)">
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
          <button type="button" class="btn btn-primary" (click)="load()">Actualizar</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Origen</th>
              <th>Producto</th>
              <th>Bodega</th>
              <th>Proveedor</th>
              <th>Sugerida</th>
              <th>Creado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (m of rows(); track m.id) {
              <tr>
                <td>{{ etiquetaEstado(m.estado) }}</td>
                <td>{{ etiquetaOrigen(m.origen) }}</td>
                <td>{{ m.productoCodigo }} {{ m.productoNombre }}</td>
                <td>{{ m.bodegaNombre }}</td>
                <td>
                  {{ m.proveedorRazonSocial }}<br />
                  <span class="muted text-sm-tight">{{ m.proveedorEmail }}</span>
                </td>
                <td>{{ m.cantidadSugerida }} {{ m.unidadMedida }}</td>
                <td>{{ fmt(m.creadoEn) }}</td>
                <td>
                  @if (m.estado === 'PENDIENTE') {
                    <button type="button" class="btn btn-ghost" (click)="abrirResolver(m)">Revisar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="row pager">
        <button type="button" class="btn" [disabled]="page() <= 0" (click)="prev()">Anterior</button>
        <span class="muted">Página {{ page() + 1 }} / {{ totalPages() }}</span>
        <button type="button" class="btn" [disabled]="page() + 1 >= totalPages()" (click)="next()">Siguiente</button>
      </div>
      @if (resolver(); as r) {
        <div
          class="modal-backdrop"
          @backdropFade
          aria-hidden="true"
          (click)="backdropCerrar()"
        ></div>
        <div
          class="modal-dialog"
          @modalFadeScale
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolver-pedido-titulo"
        >
          <div class="resolver-modal-panel stack card-bordered">
            <h2 id="resolver-pedido-titulo">Resolver solicitud #{{ r.id }}</h2>
            <p class="muted resolver-modal-lead">
              Existencia al registrar: {{ r.existenciaSnapshot }} {{ r.unidadMedida }} · Mínimo (snapshot):
              {{ r.stockMinimoSnapshot }} · Cantidad sugerida por el sistema: {{ r.cantidadSugerida }}
              {{ r.unidadMedida }}
            </p>
            <div class="field">
              <label>Cantidad a enviar al proveedor (puede modificarla)</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                class="input-narrow"
                [ngModel]="cantDraft()"
                (ngModelChange)="cantDraft.set($event)"
              />
            </div>
            <div class="field">
              <label>Notas internas (opcional)</label>
              <textarea
                class="textarea-fluid"
                [ngModel]="notasDraft()"
                (ngModelChange)="notasDraft.set($event)"
                rows="3"
              ></textarea>
            </div>
            <div class="row resolver-modal-actions">
              <button type="button" class="btn btn-primary" [disabled]="accionLoading()" (click)="aprobar(r)">
                Aprobar y enviar correo
              </button>
              <button type="button" class="btn" [disabled]="accionLoading()" (click)="rechazar(r)">
                Rechazar (sin correo)
              </button>
              <button type="button" class="btn btn-ghost" [disabled]="accionLoading()" (click)="cerrarResolver()">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .resolver-modal-panel {
      max-width: min(560px, 100%);
      max-height: min(90dvh, 900px);
      overflow-y: auto;
    }
    .resolver-modal-lead {
      line-height: 1.45;
    }
    .resolver-modal-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `
})
export class MensajesPedidoPage implements OnInit {
  private readonly api = inject(MensajesPedidoService);

  readonly rows = signal<MensajePedidoRow[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly filtroEstado = signal<MensajePedidoEstado | undefined>(undefined);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly actionMsg = signal<string | null>(null);
  readonly actionErr = signal<string | null>(null);
  readonly resolver = signal<MensajePedidoRow | null>(null);
  readonly cantDraft = signal<string | number>('');
  readonly notasDraft = signal<string>('');
  readonly accionLoading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  onFiltroEstadoStr(v: string): void {
    const e = v === '' ? undefined : (v as MensajePedidoEstado);
    this.filtroEstado.set(e);
    this.page.set(0);
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.api.listar(this.page(), 20, this.filtroEstado()).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
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

  abrirResolver(m: MensajePedidoRow): void {
    this.actionMsg.set(null);
    this.actionErr.set(null);
    this.resolver.set(m);
    this.cantDraft.set(m.cantidadParaProveedor ?? m.cantidadSugerida);
    this.notasDraft.set('');
  }

  cerrarResolver(): void {
    this.resolver.set(null);
  }

  backdropCerrar(): void {
    if (!this.accionLoading()) {
      this.cerrarResolver();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Escape') {
      return;
    }
    if (this.resolver() && !this.accionLoading()) {
      this.cerrarResolver();
    }
  }

  aprobar(r: MensajePedidoRow): void {
    const raw = String(this.cantDraft()).trim();
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n) || n <= 0) {
      this.actionErr.set('Indique una cantidad válida mayor que cero.');
      return;
    }
    this.accionLoading.set(true);
    this.actionErr.set(null);
    this.actionMsg.set(null);
    this.api
      .aprobar(r.id, {
        cantidadParaProveedor: n,
        notasAdmin: this.notasDraft().trim() || undefined
      })
      .subscribe({
        next: (res) => {
          this.accionLoading.set(false);
          this.actionMsg.set(res.mensaje);
          this.cerrarResolver();
          this.load();
        },
        error: (e) => {
          this.accionLoading.set(false);
          this.actionErr.set(getApiErrorMessage(e));
        }
      });
  }

  rechazar(r: MensajePedidoRow): void {
    this.accionLoading.set(true);
    this.actionErr.set(null);
    this.actionMsg.set(null);
    this.api
      .rechazar(r.id, {
        notasAdmin: this.notasDraft().trim() || undefined
      })
      .subscribe({
        next: (res) => {
          this.accionLoading.set(false);
          this.actionMsg.set(res.mensaje);
          this.cerrarResolver();
          this.load();
        },
        error: (e) => {
          this.accionLoading.set(false);
          this.actionErr.set(getApiErrorMessage(e));
        }
      });
  }

  fmt(iso: string): string {
    return iso?.slice(0, 19)?.replace('T', ' ') ?? '';
  }

  etiquetaEstado(e: MensajePedidoEstado): string {
    switch (e) {
      case 'PENDIENTE':
        return 'Pendiente';
      case 'APROBADO':
        return 'Aprobado';
      case 'RECHAZADO':
        return 'Rechazado';
      default:
        return e;
    }
  }

  etiquetaOrigen(o: MensajePedidoOrigen): string {
    switch (o) {
      case 'ALERTA_AUTOMATICA':
        return 'Alerta automática';
      case 'SIMULACION_INVENTARIO':
        return 'Desde inventario';
      default:
        return o;
    }
  }
}
