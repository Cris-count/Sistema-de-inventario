import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/util/api-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-wrap">
      <div class="card login-card">
        <h1>Iniciar sesión</h1>
        <p class="muted">Sistema de inventario — use las credenciales del backend.</p>
        @if (error()) {
          <div class="alert alert-error" role="alert">{{ error() }}</div>
        }
        <form [formGroup]="form" (ngSubmit)="submit()" class="stack" style="margin-top:1rem">
          <div class="field">
            <label for="email">Correo</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="err">Correo obligatorio</span>
            }
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="err">Contraseña obligatoria</span>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading() || form.invalid">
            @if (loading()) {
              <span class="spinner"></span>
            }
            Entrar
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .login-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
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
