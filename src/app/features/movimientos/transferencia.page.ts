import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { ProductoService } from '../../core/api/producto.service';
import { getApiErrorMessage } from '../../core/util/api-error';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-mov-transferencia',
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="page stack">
      <h1>Transferencia entre bodegas</h1>
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" class="card stack">
        <div class="row">
          <div class="field">
            <label>Ref. documento</label>
            <input formControlName="referenciaDocumento" />
          </div>
          <div class="field" style="flex:1">
            <label>Observación</label>
            <input formControlName="observacion" />
          </div>
        </div>
        <div class="lineas-head">
          <h2>Líneas</h2>
          <button type="button" class="btn" (click)="addLine()">+ Línea</button>
        </div>
        @for (line of lines.controls; track $index; let i = $index) {
          <div class="row" [formGroup]="$any(line)">
            <div class="field">
              <label>Producto</label>
              <select formControlName="productoId">
                <option [ngValue]="null">—</option>
                @for (p of productos(); track p.id) {
                  <option [ngValue]="p.id">{{ p.codigo }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Origen</label>
              <select formControlName="bodegaOrigenId">
                <option [ngValue]="null">—</option>
                @for (b of bodegas(); track b.id) {
                  <option [ngValue]="b.id">{{ b.codigo }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Destino</label>
              <select formControlName="bodegaDestinoId">
                <option [ngValue]="null">—</option>
                @for (b of bodegas(); track b.id) {
                  <option [ngValue]="b.id">{{ b.codigo }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Cantidad</label>
              <input formControlName="cantidad" />
            </div>
            <button type="button" class="btn btn-danger" (click)="removeLine(i)">Quitar</button>
          </div>
        }
        <button type="submit" class="btn btn-primary" [disabled]="saving()">Registrar transferencia</button>
      </form>
    </div>
  `
})
export class MovTransferenciaPage {
  private readonly api = inject(MovimientoApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);

  readonly productos = signal<{ id: number; codigo: string }[]>([]);
  readonly bodegas = signal<{ id: number; codigo: string }[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    referenciaDocumento: [''],
    observacion: [''],
    lineas: this.fb.array<FormGroup>([])
  });

  get lines(): FormArray {
    return this.form.controls.lineas;
  }

  constructor() {
    this.bodegaApi.list().subscribe((b) => this.bodegas.set(b.map((x) => ({ id: x.id, codigo: x.codigo }))));
    this.productoApi.list(0, 500).subscribe({
      next: (p) => this.productos.set(p.content.map((x) => ({ id: x.id, codigo: x.codigo }))),
      error: () => this.productos.set([])
    });
    this.addLine();
  }

  lineGroup(): FormGroup {
    return this.fb.nonNullable.group({
      productoId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      bodegaOrigenId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      bodegaDestinoId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      cantidad: this.fb.nonNullable.control('', Validators.required)
    });
  }

  addLine(): void {
    this.lines.push(this.lineGroup());
  }

  removeLine(i: number): void {
    this.lines.removeAt(i);
    if (this.lines.length === 0) this.addLine();
  }

  submit(): void {
    this.error.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    type Linea = {
      productoId: number | null;
      bodegaOrigenId: number | null;
      bodegaDestinoId: number | null;
      cantidad: string;
    };
    const lineas: { productoId: number; bodegaOrigenId: number; bodegaDestinoId: number; cantidad: string }[] = [];
    for (const l of v.lineas as Linea[]) {
      if (l.bodegaOrigenId === l.bodegaDestinoId) {
        this.message.set(null);
        this.error.set('Origen y destino deben ser distintos en cada línea.');
        return;
      }
      if (parseFloat(String(l.cantidad)) <= 0) {
        this.message.set(null);
        this.error.set('Las cantidades deben ser mayores a cero.');
        return;
      }
      lineas.push({
        productoId: l.productoId!,
        bodegaOrigenId: l.bodegaOrigenId!,
        bodegaDestinoId: l.bodegaDestinoId!,
        cantidad: l.cantidad
      });
    }
    this.saving.set(true);
    this.api
      .transferencia({
        referenciaDocumento: v.referenciaDocumento || undefined,
        observacion: v.observacion || undefined,
        lineas
      })
      .subscribe({
        next: (m) => {
          this.error.set(null);
          this.message.set(`Transferencia #${m.id} registrada.`);
          flashSuccess(this.destroyRef, () => this.message.set(null));
          this.lines.clear();
          this.addLine();
          this.form.patchValue({ referenciaDocumento: '', observacion: '' });
        },
        error: (e) => {
          this.message.set(null);
          this.error.set(getApiErrorMessage(e));
        },
        complete: () => this.saving.set(false)
      });
  }
}
