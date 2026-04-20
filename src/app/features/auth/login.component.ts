import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/util/api-error';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  template: `
    <div class="login-layout">
      <aside class="login-hero" aria-label="Presentación del producto">
        <div class="login-hero-inner">
          <div class="login-hero-mark" aria-hidden="true">IV</div>
          <p class="login-hero-eyebrow">Inventario Pro</p>
          <h2>Inventario corporativo</h2>
          <p class="login-hero-lead">
            Gestión centralizada de productos, bodegas y movimientos. Acceso seguro por roles para equipos de
            administración, bodega y compras.
          </p>
          <ul class="login-hero-list">
            <li>Roles y permisos alineados a su operación</li>
            <li>Multibodega con saldos y trazabilidad unificados</li>
            <li>Panel web listo para equipos distribuidos</li>
          </ul>
        </div>
      </aside>
      <div class="login-panel">
        <header class="login-top-bar">
          <a routerLink="/landing" class="login-nav-link">← Volver al inicio</a>
          <app-theme-toggle />
        </header>
        <main class="login-main">
          <div class="login-card-wrap">
            <div class="card login-card">
              <div class="login-card-head">
                <p class="login-eyebrow">Acceso seguro</p>
                <h1>Acceso al sistema</h1>
                <p class="login-sub">Ingrese sus credenciales corporativas.</p>
              </div>
              @if (error()) {
                <div class="alert alert-error" role="alert">{{ error() }}</div>
              }
              <form [formGroup]="form" (ngSubmit)="submit()" class="stack login-form">
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
                <button type="submit" class="btn btn-primary" [disabled]="loading() || form.invalid">
                  @if (loading()) {
                    <span class="spinner"></span>
                  }
                  Entrar al panel
                </button>
              </form>
              <p class="login-footer-text">
                ¿Necesita una cuenta empresarial?
                <a routerLink="/registro">Crear registro</a>
              </p>
              @if (showSeedHint()) {
                <details class="seed-hint">
                  <summary>Cuentas de prueba (desarrollo)</summary>
                  <p class="muted tiny">
                    Misma lista que <code>application.yml</code> / Docker. Si «Credenciales inválidas»: revise mayúsculas y el
                    símbolo <code>!</code> al final.
                  </p>
                  <div class="table-wrap seed-table-wrap">
                  <table class="seed-table">
                    <thead>
                      <tr>
                        <th>Rol</th>
                        <th>Email</th>
                        <th>Contraseña</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ADMIN</td>
                        <td><code>admin&#64;inventario.local</code></td>
                        <td><code>Admin123!</code></td>
                      </tr>
                      <tr>
                        <td>AUX_BODEGA</td>
                        <td><code>aux&#64;inventario.local</code></td>
                        <td><code>AuxBodega123!</code></td>
                      </tr>
                      <tr>
                        <td>COMPRAS</td>
                        <td><code>compras&#64;inventario.local</code></td>
                        <td><code>Compras123!</code></td>
                      </tr>
                      <tr>
                        <td>GERENCIA</td>
                        <td><code>gerencia&#64;inventario.local</code></td>
                        <td><code>Gerencia123!</code></td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </details>
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .seed-hint {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      border-radius: 0 0 var(--radius-sm, 8px) var(--radius-sm, 8px);
    }
    .seed-hint summary {
      cursor: pointer;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--muted);
      list-style: none;
    }
    .seed-hint summary::-webkit-details-marker {
      display: none;
    }
    .tiny {
      font-size: 0.75rem;
      margin: 0.65rem 0 0.5rem;
      line-height: 1.55;
    }
    .seed-table {
      width: 100%;
      font-size: 0.72rem;
      border-collapse: collapse;
    }
    .seed-table th,
    .seed-table td {
      padding: 0.45rem 0.35rem;
      text-align: left;
      border-bottom: 1px solid var(--border-subtle);
    }
    .seed-table th {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    .seed-table code {
      font-size: 0.68rem;
      word-break: break-all;
    }
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showSeedHint = () => environment.showSeedLoginHint === true;

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
