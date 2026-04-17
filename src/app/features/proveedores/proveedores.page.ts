import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProveedorService } from '../../core/api/proveedor.service';
import { AuthService } from '../../core/auth/auth.service';
import { Proveedor } from '../../core/models/entities.model';
import { patchPlanErrorSignals, type PlanBlockFollowup } from '../../core/util/api-error';
import { PlanBlockFollowupComponent } from '../../shared/plan-block-followup.component';
import { flashSuccess } from '../../core/util/page-flash';

@Component({
  selector: 'app-proveedores',
  imports: [ReactiveFormsModule, PlanBlockFollowupComponent],
  template: `
    <div class="page stack">
      <h1>Proveedores</h1>
      <p class="muted">
        Listado disponible para ADMIN, SUPER_ADMIN, COMPRAS y GERENCIA. Alta/edición solo ADMIN/SUPER_ADMIN (API).
      </p>
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
          <h2>{{ editingId() ? 'Editar' : 'Nuevo' }} proveedor</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="stack">
            <div class="row">
              <div class="field">
                <label>Documento</label>
                <input formControlName="documento" />
              </div>
              <div class="field" style="flex:1">
                <label>Razón social</label>
                <input formControlName="razonSocial" />
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Contacto</label>
                <input formControlName="contacto" />
              </div>
              <div class="field">
                <label>Teléfono</label>
                <input formControlName="telefono" />
              </div>
              <div class="field">
                <label>Email</label>
                <input formControlName="email" type="email" />
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
      }
      <div class="table-wrap">
        <table class="data">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Razón social</th>
              <th>Email (alertas stock)</th>
              <th>Contacto</th>
              @if (isAdmin()) {
                <th></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (p of rows(); track p.id) {
              <tr>
                <td>{{ p.documento }}</td>
                <td>{{ p.razonSocial }}</td>
                <td>
                  @if (p.email?.trim()) {
                    {{ p.email }}
                  } @else {
                    <span class="muted">— sin correo —</span>
                  }
                </td>
                <td>{{ p.contacto }} {{ p.telefono }}</td>
                @if (isAdmin()) {
                  <td><button type="button" class="btn btn-ghost" (click)="edit(p)">Editar</button></td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProveedoresPage implements OnInit {
  private readonly api = inject(ProveedorService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);

  isAdmin = () => this.auth.hasAnyRole(['ADMIN', 'SUPER_ADMIN']);

  readonly rows = signal<Proveedor[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly planFollowup = signal<PlanBlockFollowup | null>(null);

  readonly form = this.fb.nonNullable.group({
    documento: ['', Validators.required],
    razonSocial: ['', Validators.required],
    contacto: [''],
    telefono: [''],
    email: ['']
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

  edit(p: Proveedor): void {
    this.editingId.set(p.id);
    this.form.patchValue({
      documento: p.documento,
      razonSocial: p.razonSocial,
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      email: p.email ?? ''
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ documento: '', razonSocial: '', contacto: '', telefono: '', email: '' });
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
        this.message.set('Proveedor guardado.');
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
