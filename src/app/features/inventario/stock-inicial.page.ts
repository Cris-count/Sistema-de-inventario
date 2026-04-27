import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { InventarioService } from '../../core/api/inventario.service';
import { ProductoService } from '../../core/api/producto.service';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-stock-inicial',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Stock inicial</h1>
        <app-dismissible-hint hintId="inventario.stockInicial.pageIntro" persist="local" variant="flush">
          <p class="page-lead page-header-lead">
            Carga inicial por producto y bodega. El backend rechaza si ya existe cantidad &gt; 0 en esa pareja (409).
          </p>
        </app-dismissible-hint>
      </header>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      <form [formGroup]="form" (ngSubmit)="submit()" class="card stack">
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
              <label>Bodega</label>
              <select formControlName="bodegaId">
                <option [ngValue]="null">—</option>
                @for (b of bodegas(); track b.id) {
                  <option [ngValue]="b.id">{{ b.codigo }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label>Cantidad</label>
              <input formControlName="cantidad" type="text" />
            </div>
            <div class="field">
              <label>Ref.</label>
              <input formControlName="referencia" type="text" />
            </div>
            <button type="button" class="btn btn-danger" (click)="removeLine(i)">Quitar</button>
          </div>
        }
        <button type="submit" class="btn btn-primary" [disabled]="saving() || lines.length === 0">Registrar stock inicial</button>
      </form>
    </div>
  `
})
export class StockInicialPage {
  private readonly api = inject(InventarioService);
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly productos = signal<{ id: number; codigo: string }[]>([]);
  readonly bodegas = signal<{ id: number; codigo: string }[]>([]);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
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

  createLine() {
    return this.fb.nonNullable.group({
      productoId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      bodegaId: this.fb.nonNullable.control<number | null>(null, Validators.required),
      cantidad: this.fb.nonNullable.control('0', [Validators.required]),
      referencia: ['']
    });
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(i: number): void {
    this.lines.removeAt(i);
    if (this.lines.length === 0) this.addLine();
  }

  submit(): void {
    this.error.set(null);
    this.planFollowup.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    type Linea = { productoId: number | null; bodegaId: number | null; cantidad: string; referencia: string };
    const raw = this.lines.getRawValue() as Linea[];
    const lineas = raw.map((l) => ({
      productoId: l.productoId!,
      bodegaId: l.bodegaId!,
      cantidad: l.cantidad,
      referencia: l.referencia || undefined
    }));
    for (const l of lineas) {
      if (parseFloat(l.cantidad) <= 0) {
        this.message.set(null);
        this.planFollowup.set(null);
        this.error.set('Cada cantidad debe ser mayor a cero.');
        return;
      }
    }
    this.saving.set(true);
    this.api.stockInicial(lineas).subscribe({
      next: (m) => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set(`Movimiento registrado #${m.id} (${m.tipoMovimiento}).`);
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.lines.clear();
        this.addLine();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.saving.set(false)
    });
  }
}
