import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriaService } from '../../core/api/categoria.service';
import { Categoria } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-categorias',
  imports: [ReactiveFormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Categorías</h1>
        <p class="page-lead page-header-lead">Clasificación de productos para informes y filtros.</p>
      </header>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      <div class="card stack">
        <h2>Nueva / editar</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="row">
          <div class="field field-flex-1">
            <label>Nombre</label>
            <input formControlName="nombre" />
          </div>
          <div class="field field-flex-2">
            <label>Descripción</label>
            <input formControlName="descripcion" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ editingId() ? 'Actualizar' : 'Crear' }}</button>
          @if (editingId()) {
            <button type="button" class="btn" (click)="cancel()">Cancelar</button>
          }
        </form>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of rows(); track c.id) {
              <tr>
                <td>{{ c.nombre }}</td>
                <td>{{ c.descripcion }}</td>
                <td><button type="button" class="btn btn-ghost" (click)="edit(c)">Editar</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CategoriasPage implements OnInit {
  private readonly api = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly rows = signal<Categoria[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    descripcion: ['']
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.list().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }

  edit(c: Categoria): void {
    this.editingId.set(c.id);
    this.form.patchValue({ nombre: c.nombre, descripcion: c.descripcion ?? '' });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    const v = this.form.getRawValue();
    const id = this.editingId();
    const req = id ? this.api.update(id, v) : this.api.create(v);
    req.subscribe({
      next: () => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set('Guardado.');
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.cancel();
        this.reload();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      },
      complete: () => this.saving.set(false)
    });
  }
}
