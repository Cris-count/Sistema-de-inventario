import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { InventarioService } from '../../core/api/inventario.service';
import { ProductoService } from '../../core/api/producto.service';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES_GESTION_PRODUCTOS } from '../../core/auth/app-roles';
import { InventarioRow } from '../../core/models/entities.model';
import { getApiErrorMessage, patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';

@Component({
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <h1>Inventario</h1>
      <div class="card stack">
        <h2>Filtros</h2>
        <form [formGroup]="filterForm" (ngSubmit)="applyFilters()" class="row">
          <div class="field">
            <label>Producto</label>
            <select formControlName="productoId">
              <option [ngValue]="null">Todos</option>
              @for (p of productos(); track p.id) {
                <option [ngValue]="p.id">{{ p.codigo }} — {{ p.nombre }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Bodega</label>
            <select formControlName="bodegaId">
              <option [ngValue]="null">Todas</option>
              @for (b of bodegas(); track b.id) {
                <option [ngValue]="b.id">{{ b.codigo }} — {{ b.nombre }}</option>
              }
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Consultar</button>
          <button type="button" class="btn" (click)="loadAlertas()">Ver alertas mínimo</button>
        </form>
      </div>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      }
      @if (alertasMode()) {
        <h2>Alertas (bajo mínimo)</h2>
        @if (rows().length > 0) {
          <p class="muted" style="margin: 0 0 0.75rem; font-size: 0.88rem; max-width: 52rem">
            El aviso automático y la simulación usan el correo del <strong>proveedor vinculado a ese producto</strong>:
            primero el «Proveedor preferido» en la ficha del producto; si no hay, el de la última entrada de compra de
            ese producto. El e-mail se edita en <strong>Proveedores</strong>. Use «Simular» en la fila que corresponda.
          </p>
        }
      }
      @if (simMsg()) {
        <div class="alert alert-success" role="status">{{ simMsg() }}</div>
      }
      @if (simErr()) {
        <div class="alert alert-error" role="alert">{{ simErr() }}</div>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Bodega</th>
              <th>Cantidad</th>
              <th>Stock mín.</th>
              <th>Actualizado</th>
              @if (alertasMode()) {
                <th>Simular correo</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id.productoId + '-' + r.id.bodegaId) {
              <tr>
                <td>{{ r.producto.codigo }} {{ r.producto.nombre }}</td>
                <td>{{ r.bodega.nombre }}</td>
                <td>{{ r.cantidad }}</td>
                <td>
                  @if (minEditKey() === r.id.productoId + '-' + r.id.bodegaId) {
                    <span class="row" style="gap: 0.35rem; align-items: center; flex-wrap: wrap">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        [ngModel]="minEditDraft()"
                        (ngModelChange)="onMinDraftChange($event)"
                        style="width: 6rem"
                      />
                      <button type="button" class="btn btn-primary" [disabled]="minSaving()" (click)="guardarMinimo(r)">
                        Guardar
                      </button>
                      <button type="button" class="btn" [disabled]="minSaving()" (click)="cancelMinEdit()">Cancelar</button>
                    </span>
                  } @else {
                    <span class="row" style="gap: 0.35rem; align-items: center; flex-wrap: wrap">
                      {{ r.producto.stockMinimo }}
                      @if (puedeEditarMinimo()) {
                        <button type="button" class="btn btn-ghost" (click)="startMinEdit(r)">Editar mínimo</button>
                      }
                    </span>
                  }
                </td>
                <td>{{ fmt(r.updatedAt) }}</td>
                @if (alertasMode()) {
                  <td>
                    <button
                      type="button"
                      class="btn btn-ghost"
                      [disabled]="simLoading()"
                      (click)="simularCorreo(r)"
                      title="Mismo destinatario que el aviso automático: proveedor vinculado a este producto"
                    >
                      @if (simLoading()) {
                        <span class="spinner"></span>
                      } @else {
                        Simular
                      }
                    </button>
                  </td>
                }
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
export class InventarioPage implements OnInit {
  private readonly api = inject(InventarioService);
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<InventarioRow[]>([]);
  readonly productos = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly bodegas = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);
  readonly alertasMode = signal(false);
  readonly minEditKey = signal<string | null>(null);
  readonly minEditDraft = signal('');
  readonly minSaving = signal(false);
  readonly simMsg = signal<string | null>(null);
  readonly simErr = signal<string | null>(null);
  readonly simLoading = signal(false);

  readonly puedeEditarMinimo = () => this.auth.hasAnyRole(ROLES_GESTION_PRODUCTOS);

  readonly filterForm = this.fb.nonNullable.group({
    productoId: null as number | null,
    bodegaId: null as number | null
  });

  ngOnInit(): void {
    this.bodegaApi.list().subscribe((b) => this.bodegas.set(b));
    this.productoApi.list(0, 500).subscribe({
      next: (p) => this.productos.set(p.content),
      error: () => this.productos.set([])
    });
    this.loadPage();
  }

  loadPage(): void {
    this.error.set(null);
    this.planFollowup.set(null);
    const { productoId, bodegaId } = this.filterForm.getRawValue();
    const f =
      productoId != null || bodegaId != null ? { productoId: productoId ?? undefined, bodegaId: bodegaId ?? undefined } : undefined;
    this.api.list(this.page(), 20, f).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => patchPlanErrorSignals(e, this.error, this.planFollowup)
    });
  }

  applyFilters(): void {
    this.cancelMinEdit();
    this.alertasMode.set(false);
    this.page.set(0);
    this.loadPage();
  }

  loadAlertas(): void {
    this.cancelMinEdit();
    this.alertasMode.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    this.simMsg.set(null);
    this.simErr.set(null);
    const bodegaId = this.filterForm.getRawValue().bodegaId;
    this.api.alertas(bodegaId ?? undefined).subscribe({
      next: (a) => {
        this.rows.set(a);
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => patchPlanErrorSignals(e, this.error, this.planFollowup)
    });
  }

  simularCorreo(row: InventarioRow): void {
    this.simLoading.set(true);
    this.simMsg.set(null);
    this.simErr.set(null);
    this.api
      .simularCorreoStock({
        productoId: row.id.productoId,
        bodegaId: row.id.bodegaId
      })
      .subscribe({
        next: (r) => {
          this.simLoading.set(false);
          this.simMsg.set(r.mensaje);
        },
        error: (e) => {
          this.simLoading.set(false);
          let msg = getApiErrorMessage(e);
          if (
            /email:\s*no debe estar vac[ií]o|must not be blank/i.test(msg) ||
            /^no debe estar vac[ií]o$/i.test(msg.trim())
          ) {
            msg +=
              ' El servidor parece una versión antigua del API (exigía «email» en el cuerpo). Detenga el backend, en la carpeta `backend` ejecute `mvnw clean spring-boot:run` (o reinicie la app desde el IDE) y vuelva a probar.';
          }
          this.simErr.set(msg);
        }
      });
  }

  prev(): void {
    if (this.alertasMode()) return;
    this.page.update((n) => Math.max(0, n - 1));
    this.loadPage();
  }

  next(): void {
    if (this.alertasMode()) return;
    this.page.update((n) => n + 1);
    this.loadPage();
  }

  fmt(iso: string): string {
    return iso?.slice(0, 19)?.replace('T', ' ') ?? '';
  }

  onMinDraftChange(value: unknown): void {
    this.minEditDraft.set(value != null ? String(value) : '');
  }

  startMinEdit(r: InventarioRow): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.minEditKey.set(`${r.id.productoId}-${r.id.bodegaId}`);
    this.minEditDraft.set(String(r.producto.stockMinimo));
  }

  cancelMinEdit(): void {
    this.minEditKey.set(null);
    this.minEditDraft.set('');
    this.minSaving.set(false);
  }

  guardarMinimo(r: InventarioRow): void {
    const raw = String(this.minEditDraft()).trim();
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n) || n < 0) {
      this.error.set('Indique un stock mínimo válido (número ≥ 0).');
      return;
    }
    this.minSaving.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    this.productoApi.patchStockMinimo(r.producto.id, n).subscribe({
      next: () => {
        this.minSaving.set(false);
        this.cancelMinEdit();
        if (this.alertasMode()) {
          this.loadAlertas();
        } else {
          this.loadPage();
        }
      },
      error: (e) => {
        this.minSaving.set(false);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }
}
