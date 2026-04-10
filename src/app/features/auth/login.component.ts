import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/util/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-layout">
      <div class="login-hero">
        <div class="login-hero-inner">
          <div class="login-hero-mark">IV</div>
          <h2>Inventario corporativo</h2>
          <p>
            Gestión centralizada de productos, bodegas y movimientos. Acceso seguro por roles para equipos de
            administración, bodega y compras.
          </p>
        </div>
      </div>
      <div class="login-panel">
        <div class="card login-card">
          <h1>Acceso al sistema</h1>
          <p class="muted page-lead" style="margin:0">Ingrese sus credenciales corporativas.</p>
          @if (error()) {
            <div class="alert alert-error" role="alert">{{ error() }}</div>
          }
          <form [formGroup]="form" (ngSubmit)="submit()" class="stack" style="margin-top:0.25rem">
            <div class="field">
              <label for="email">Correo electrónico</label>
              <input id="email" type="email" formControlName="email" autocomplete="username" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <span class="err">Indique un correo válido</span>
              }
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <input id="password" type="password" formControlName="password" autocomplete="current-password" />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <span class="err">La contraseña es obligatoria</span>
              }
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.25rem" [disabled]="loading() || form.invalid">
              @if (loading()) {
                <span class="spinner"></span>
              }
              Entrar al panel
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/app']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(err));
      },
      complete: () => this.loading.set(false)
    });
  }
}
