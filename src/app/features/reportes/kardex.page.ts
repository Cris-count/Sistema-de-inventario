import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReporteService } from '../../core/api/reporte.service';
import { ProductoService } from '../../core/api/producto.service';
import { MovimientoList } from '../../core/models/entities.model';
import { defaultDesdeHasta } from '../../core/util/dates';
import { getApiErrorMessage } from '../../core/util/api-error';

@Component({
  selector: 'app-kardex',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="page stack">
      <h1>Kardex por producto</h1>
      <form [formGroup]="form" (ngSubmit)="search()" class="card row">
        <div class="field" style="flex:1">
          <label>Producto</label>
          <select formControlName="productoId">
            <option [ngValue]="null">—</option>
            @for (p of productos(); track p.id) {
              <option [ngValue]="p.id">{{ p.codigo }} — {{ p.nombre }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label>Desde</label>
          <input type="date" formControlName="desde" />
        </div>
        <div class="field">
          <label>Hasta</label>
          <input type="date" formControlName="hasta" />
        </div>
        <button type="submit" class="btn btn-primary">Consultar</button>
      </form>
      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Id</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (m of rows(); track m.id) {
              <tr>
                <td>{{ m.id }}</td>
                <td>{{ m.tipoMovimiento }}</td>
                <td>{{ fmt(m.fechaMovimiento) }}</td>
                <td>{{ m.motivo }}</td>
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
  readonly rows = signal<MovimientoList[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly error = signal<string | null>(null);

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
      this.error.set('Seleccione un producto.');
      return;
    }
    this.error.set(null);
    this.page.set(0);
    this.load();
  }

  load(): void {
    const { productoId, desde, hasta } = this.form.getRawValue();
    if (productoId == null || !desde || !hasta) return;
    this.api.kardex(productoId, desde, hasta, this.page(), 20).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
      },
      error: (e) => this.error.set(getApiErrorMessage(e))
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
