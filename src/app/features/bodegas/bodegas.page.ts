import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BodegaService } from '../../core/api/bodega.service';
import { AuthService } from '../../core/auth/auth.service';
import { Bodega } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-bodegas',
  imports: [ReactiveFormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <h1>Bodegas</h1>
      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
          <app-plan-block-followup [followup]="planFollowup()" />
        </div>
      } @else if (message()) {
        <div class="alert alert-success" role="status">{{ message() }}</div>
      }
      @if (isAdmin()) {
        <div class="card stack">
          <h2>{{ editingId() ? 'Editar bodega' : 'Nueva bodega' }}</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="stack">
            <div class="row">
              <div class="field">
                <label>Código</label>
                <input formControlName="codigo" />
              </div>
              <div class="field" style="flex:1">
                <label>Nombre</label>
                <input formControlName="nombre" />
              </div>
            </div>
            <div class="field">
              <label>Dirección</label>
              <input formControlName="direccion" />
            </div>
            <div class="row">
              <button type="submit" class="btn btn-primary" [disabled]="saving()">Guardar</button>
              @if (editingId()) {
                <button type="button" class="btn" (click)="cancel()">Cancelar</button>
              }
            </div>
          </form>
        </div>
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Dirección</th>
              @if (isAdmin()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (b of rows(); track b.id) {
              <tr>
                <td>{{ b.codigo }}</td>
                <td>{{ b.nombre }}</td>
                <td>{{ b.direccion }}</td>
                @if (isAdmin()) {
                  <td><button type="button" class="btn btn-ghost" (click)="edit(b)">Editar</button></td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class BodegasPage implements OnInit {
  private readonly api = inject(BodegaService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  isAdmin = () => this.auth.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  readonly rows = signal<Bodega[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    direccion: ['']
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

  edit(b: Bodega): void {
    this.editingId.set(b.id);
    this.form.patchValue({ codigo: b.codigo, nombre: b.nombre, direccion: b.direccion ?? '' });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ codigo: '', nombre: '', direccion: '' });
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
        this.message.set('Bodega guardada.');
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
