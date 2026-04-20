import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/api/usuario.service';
import { UsuarioRow } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

const ROLES = [
  { codigo: 'ADMIN', label: 'Administrador' },
  { codigo: 'AUX_BODEGA', label: 'Auxiliar bodega' },
  { codigo: 'COMPRAS', label: 'Compras' },
  { codigo: 'GERENCIA', label: 'Gerencia' }
];

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Usuarios</h1>
        <p class="page-lead page-header-lead">Alta, edición y activación del equipo (según su rol).</p>
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
        <h2>{{ editingId() ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()" class="stack">
          @if (!editingId()) {
            <div class="row">
              <div class="field field-flex-1">
                <label>Email</label>
                <input type="email" formControlName="email" />
              </div>
              <div class="field">
                <label>Contraseña</label>
                <input type="password" formControlName="password" />
              </div>
            </div>
          }
          <div class="row">
            <div class="field">
              <label>Nombre</label>
              <input formControlName="nombre" />
            </div>
            <div class="field">
              <label>Apellido</label>
              <input formControlName="apellido" />
            </div>
            <div class="field">
              <label>Rol</label>
              <select formControlName="rolCodigo">
                @for (r of roles; track r.codigo) {
                  <option [value]="r.codigo">{{ r.label }}</option>
                }
              </select>
            </div>
          </div>
          <div class="row">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">Guardar</button>
            @if (editingId()) {
              <button type="button" class="btn" (click)="cancel()">Cancelar</button>
            }
          </div>
        </form>
      </div>
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Activo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of rows(); track u.id) {
              <tr>
                <td>{{ u.email }}</td>
                <td>{{ u.nombre }} {{ u.apellido }}</td>
                <td>{{ u.rolCodigo }}</td>
                <td>
                  <span class="badge" [class.badge-ok]="u.activo">{{ u.activo ? 'Sí' : 'No' }}</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button type="button" class="btn btn-ghost" (click)="edit(u)">Editar</button>
                    <button type="button" class="btn btn-ghost" (click)="toggle(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="row pager">
        <button type="button" class="btn" [disabled]="page() <= 0" (click)="prev()">Anterior</button>
        <span class="muted">Página {{ page() + 1 }}</span>
        <button type="button" class="btn" [disabled]="!hasNext()" (click)="next()">Siguiente</button>
      </div>
    </div>
  `
})
export class UsuariosPage implements OnInit {
  private readonly api = inject(UsuarioService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = ROLES;

  readonly rows = signal<UsuarioRow[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(1);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.email, Validators.required]],
    password: ['', Validators.required],
    nombre: ['', Validators.required],
    apellido: [''],
    rolCodigo: ['ADMIN', Validators.required]
  });

  ngOnInit(): void {
    this.load();
  }

  hasNext(): boolean {
    return this.page() + 1 < this.totalPages();
  }

  load(): void {
    this.api.list(this.page(), 20).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.totalPages.set(Math.max(1, p.totalPages));
        this.error.set(null);
        this.planFollowup.set(null);
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }

  prev(): void {
    this.message.set(null);
    this.page.update((n) => Math.max(0, n - 1));
    this.load();
  }

  next(): void {
    this.message.set(null);
    this.page.update((n) => n + 1);
    this.load();
  }

  edit(u: UsuarioRow): void {
    this.editingId.set(u.id);
    this.form.patchValue({
      email: u.email,
      password: '',
      nombre: u.nombre,
      apellido: u.apellido ?? '',
      rolCodigo: u.rolCodigo
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.email.disable();
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.controls.email.enable();
    this.form.controls.password.setValidators(Validators.required);
    this.form.controls.password.updateValueAndValidity();
    this.form.reset({ email: '', password: '', nombre: '', apellido: '', rolCodigo: 'ADMIN' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.planFollowup.set(null);
    const id = this.editingId();
    if (id) {
      const v = this.form.getRawValue();
      this.api
        .update(id, { nombre: v.nombre, apellido: v.apellido || undefined, rolCodigo: v.rolCodigo })
        .subscribe({
          next: () => {
            this.error.set(null);
            this.planFollowup.set(null);
            this.message.set('Usuario actualizado.');
            flashSuccess(this.destroyRef, () => this.message.set(null));
            this.cancel();
            this.load();
          },
          error: (e) => {
            this.message.set(null);
            patchPlanErrorSignals(e, this.error, this.planFollowup);
          },
          complete: () => this.saving.set(false)
        });
    } else {
      const v = this.form.getRawValue();
      this.api
        .create({
          email: v.email,
          password: v.password,
          nombre: v.nombre,
          apellido: v.apellido || undefined,
          rolCodigo: v.rolCodigo
        })
        .subscribe({
          next: () => {
            this.error.set(null);
            this.planFollowup.set(null);
            this.message.set('Usuario creado.');
            flashSuccess(this.destroyRef, () => this.message.set(null));
            this.cancel();
            this.load();
          },
          error: (e) => {
            this.message.set(null);
            patchPlanErrorSignals(e, this.error, this.planFollowup);
          },
          complete: () => this.saving.set(false)
        });
    }
  }

  toggle(u: UsuarioRow): void {
    this.api.setActivo(u.id, !u.activo).subscribe({
      next: () => {
        this.error.set(null);
        this.planFollowup.set(null);
        this.message.set('Estado actualizado.');
        flashSuccess(this.destroyRef, () => this.message.set(null));
        this.load();
      },
      error: (e) => {
        this.message.set(null);
        patchPlanErrorSignals(e, this.error, this.planFollowup);
      }
    });
  }
}
