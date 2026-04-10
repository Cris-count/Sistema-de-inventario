import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { InventarioService } from '../../core/api/inventario.service';
import { ProductoService } from '../../core/api/producto.service';
import { InventarioRow } from '../../core/models/entities.model';
import { getApiErrorMessage } from '../../core/util/api-error';

@Component({
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, FormsModule],
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
        <div class="alert alert-error">{{ error() }}</div>
      }
      @if (alertasMode()) {
        <h2>Alertas (bajo mínimo)</h2>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Bodega</th>
              <th>Cantidad</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            @for (r of rows(); track r.id.productoId + '-' + r.id.bodegaId) {
              <tr>
                <td>{{ r.producto.codigo }} {{ r.producto.nombre }}</td>
                <td>{{ r.bodega.nombre }}</td>
                <td>{{ r.cantidad }}</td>
                <td>{{ fmt(r.updatedAt) }}</td>
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
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<InventarioRow[]>([]);
  readonly productos = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly bodegas = signal<{ id: number; codigo: string; nombre: string }[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly error = signal<string | null>(null);
  readonly alertasMode = signal(false);

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
    const { productoId, bodegaId } = this.filterForm.getRawValue();
    const f =
      productoId != null || bodegaId != null ? { productoId: productoId ?? undefined, bodegaId: bodegaId ?? undefined } : undefined;
    this.api.list(this.page(), 20, f).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
      },
      error: (e) => this.error.set(getApiErrorMessage(e))
    });
  }

  applyFilters(): void {
    this.alertasMode.set(false);
    this.page.set(0);
    this.loadPage();
  }

  loadAlertas(): void {
    this.alertasMode.set(true);
    this.error.set(null);
    const bodegaId = this.filterForm.getRawValue().bodegaId;
    this.api.alertas(bodegaId ?? undefined).subscribe({
      next: (a) => this.rows.set(a),
      error: (e) => this.error.set(getApiErrorMessage(e))
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
}
