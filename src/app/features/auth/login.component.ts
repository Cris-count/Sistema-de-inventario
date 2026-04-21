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
    <div class="login-page">
      <div class="login-layout">
        <aside class="login-hero" aria-label="Presentación del producto">
          <div class="login-hero-inner login-hero-split">
            <div class="login-hero-col login-hero-col--visual">
              <div class="login-hero-prelude">
                <div class="login-brand">
                  <div class="login-hero-mark" aria-hidden="true">C</div>
                  <div class="login-brand-text">
                    <span class="login-brand-name">Cersik</span>
                    <span class="login-brand-tag">INVENTARIO CORPORATIVO</span>
                  </div>
                </div>
              </div>
              <figure class="login-hero-visual">
                <div class="login-hero-visual-frame">
                  <img
                    src="assets/images/login/fabrica.png"
                    width="960"
                    height="720"
                    alt=""
                    decoding="async"
                    class="login-hero-visual-img"
                  />
                </div>
              </figure>
            </div>
            <div class="login-hero-col login-hero-col--copy">
              <div class="login-hero-copy">
                <p class="login-hero-eyebrow">ACCESO CORPORATIVO</p>
                <h2 class="login-hero-title">Tu operación centralizada en un solo panel</h2>
                <p class="login-hero-lead">
                  Gestiona productos, bodegas y movimientos con acceso seguro para equipos de administración, compras y
                  operación.
                </p>
                <ul class="login-hero-benefits">
                  <li class="login-benefit">
                    <span class="login-benefit-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <span class="login-benefit-text">Roles y permisos por equipo</span>
                  </li>
                  <li class="login-benefit">
                    <span class="login-benefit-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </span>
                    <span class="login-benefit-text">Multibodega con trazabilidad unificada</span>
                  </li>
                </ul>
              </div>
            </div>
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
                  <p class="login-eyebrow">ACCESO SEGURO</p>
                  <h1 class="login-card-title">Inicia sesión</h1>
                  <p class="login-sub">Ingresa tus credenciales para acceder al panel.</p>
                </div>
              @if (error()) {
                <div class="alert alert-error" role="alert">{{ error() }}</div>
              }
              <form [formGroup]="form" (ngSubmit)="submit()" class="stack login-form">
                <div class="field login-field">
                  <label for="email">Correo electrónico</label>
                  <div class="login-input-shell">
                    <span class="login-input-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="email"
                      class="login-input-with-icon"
                      type="email"
                      formControlName="email"
                      autocomplete="username"
                    />
                  </div>
                  @if (form.controls.email.touched && form.controls.email.invalid) {
                    <span class="err">Indique un correo válido</span>
                  }
                </div>
                <div class="field login-field">
                  <label for="password">Contraseña</label>
                  <div class="login-input-shell">
                    <span class="login-input-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                    <input
                      id="password"
                      class="login-input-with-icon"
                      type="password"
                      formControlName="password"
                      autocomplete="current-password"
                    />
                  </div>
                  @if (form.controls.password.touched && form.controls.password.invalid) {
                    <span class="err">La contraseña es obligatoria</span>
                  }
                </div>
                <button type="submit" class="btn btn-primary login-submit" [disabled]="loading() || form.invalid">
                  @if (loading()) {
                    <span class="spinner"></span>
                  }
                  Entrar al panel
                </button>
              </form>
              <div class="login-footer-register" role="group" aria-label="Alta empresarial">
                <p class="login-footer-register-label">¿Necesitas una cuenta empresarial?</p>
                <a routerLink="/registro" class="login-footer-register-link">Crear registro</a>
              </div>
            </div>
            @if (showSeedHint()) {
              <details class="login-dev-hint">
                <summary>Credenciales locales (solo desarrollo)</summary>
                <p class="login-dev-hint-lead">
                  Uso interno. Alineado a <code>application.yml</code> / Docker. Si el acceso falla, revise mayúsculas y el
                  <code>!</code> final.
                </p>
                <div class="table-wrap login-dev-hint-table-wrap">
                  <table class="login-dev-hint-table">
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
          </main>
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

  /**
   * Bloque técnico opcional: solo si `showSeedLoginHint` está activo y no es build de producción.
   * Desactivar en `environment.ts` cuando no haga falta exponer cuentas semilla.
   */
  readonly showSeedHint = () => !environment.production && environment.showSeedLoginHint === true;

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
