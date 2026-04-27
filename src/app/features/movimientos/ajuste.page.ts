import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { ProductoService } from '../../core/api/producto.service';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

/** Cada línea: suma en destino o resta en origen (no ambos), según regla del backend. */
@Component({
  selector: 'app-mov-ajuste',
  imports: [ReactiveFormsModule, FormsModule, PlanBlockFollowupComponent, DismissibleHintComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Ajuste de inventario</h1>
        <app-dismissible-hint hintId="movimientos.ajuste.pageIntro" persist="local" variant="flush">
          <p class="page-lead page-header-lead">
            Por línea elija “Suma a bodega” o “Resta en bodega” y una sola bodega.
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
        <div class="row">
          <div class="field field-flex-1">
            <label>Motivo</label>
            <input formControlName="motivo" />
          </div>
          <div class="field">
            <label>Ref. documento</label>
            <input formControlName="referenciaDocumento" />
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
              <label>Tipo</label>
              <select formControlName="sentido">
                <option value="SUMA_DESTINO">Suma a bodega</option>
                <option value="RESTA_ORIGEN">Resta en bodega</option>
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
              <input formControlName="cantidad" />
            </div>
            <button type="button" class="btn btn-danger" (click)="removeLine(i)">Quitar</button>
          </div>
        }
        <button type="submit" class="btn btn-primary" [disabled]="saving()">Registrar ajuste</button>
      </form>
    </div>
  `
})
export class MovAjustePage {
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
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
    motivo: ['', Validators.required],
    referenciaDocumento: [''],
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
      sentido: this.fb.nonNullable.control<'SUMA_DESTINO' | 'RESTA_ORIGEN'>('SUMA_DESTINO', Validators.required),
      bodegaId: this.fb.nonNullable.control<number | null>(null, Validators.required),
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
    this.planFollowup.set(null);
    this.message.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    type Linea = {
      productoId: number | null;
      sentido: 'SUMA_DESTINO' | 'RESTA_ORIGEN';
      bodegaId: number | null;
      cantidad: string;
    };
    const lineas = (v.lineas as Linea[]).map((l) => {
      const base = { productoId: l.productoId!, cantidad: l.cantidad };
      if (l.sentido === 'SUMA_DESTINO') {
        return { ...base, bodegaOrigenId: undefined, bodegaDestinoId: l.bodegaId! };
      }
      return { ...base, bodegaOrigenId: l.bodegaId!, bodegaDestinoId: undefined };
    });
    for (const l of lineas) {
      if (parseFloat(String(l.cantidad)) <= 0) {
        this.message.set(null);
        this.planFollowup.set(null);
        this.error.set('Las cantidades deben ser mayores a cero.');
        return;
      }
    }
    this.saving.set(true);
    this.api
      .ajuste({
        motivo: v.motivo,
        referenciaDocumento: v.referenciaDocumento || undefined,
        lineas
      })
      .subscribe({
        next: (m) => {
          this.error.set(null);
          this.planFollowup.set(null);
          this.message.set(`Ajuste #${m.id} registrado.`);
          flashSuccess(this.destroyRef, () => this.message.set(null));
          this.lines.clear();
          this.addLine();
          this.form.patchValue({ motivo: '', referenciaDocumento: '' });
        },
        error: (e) => {
          this.message.set(null);
          patchPlanErrorSignals(e, this.error, this.planFollowup);
        },
        complete: () => this.saving.set(false)
      });
  }
}
