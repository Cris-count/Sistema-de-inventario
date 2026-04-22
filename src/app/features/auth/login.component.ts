import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { fadeUp, staggerList } from '../../core/animations';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/util/api-error';
import { UiBadgeComponent } from '../../shared/components/ui/badge/ui-badge.component';
import { UiCardComponent } from '../../shared/components/ui/card/ui-card.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ThemeToggleComponent,
    UiBadgeComponent,
    UiCardComponent
  ],
  animations: [fadeUp, staggerList],
  template: `
    <div class="login-page">
      <div class="login-layout">
        <aside class="login-hero" aria-label="Presentación del producto">
          <div class="login-hero-bg" aria-hidden="true">
            <img
              src="assets/images/login/imagen%20de%20fondo.png"
              width="1200"
              height="900"
              alt=""
              decoding="async"
              fetchpriority="low"
              class="login-hero-bg-img"
            />
            <div class="login-hero-bg-overlay"></div>
          </div>

          <div class="login-hero-content">
            <div @fadeUp class="login-hero-intro">
              <app-ui-badge class="login-hero-badge" tone="on-dark">ACCESO CORPORATIVO</app-ui-badge>
              <h2 class="login-hero-title">
                Control total de tu inventario,<br class="login-hero-title-br" aria-hidden="true" />
                en un solo panel
              </h2>
              <p class="login-hero-lead">
                Gestiona productos, stock, bodegas y movimientos con una plataforma clara, segura y fácil de usar.
              </p>
            </div>

            <div class="login-hero-cards" @staggerList>
              <app-ui-card [padded]="false" class="login-hero-feature-card">
                <div class="login-hero-feature">
                  <span class="login-hero-feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </span>
                  <div class="login-hero-feature-copy">
                    <h3 class="login-hero-feature-title">Inventario en tiempo real</h3>
                    <p class="login-hero-feature-text">
                      Consulta tu operación con claridad y sin retrasos.
                    </p>
                  </div>
                </div>
              </app-ui-card>
              <app-ui-card [padded]="false" class="login-hero-feature-card">
                <div class="login-hero-feature">
                  <span class="login-hero-feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </span>
                  <div class="login-hero-feature-copy">
                    <h3 class="login-hero-feature-title">Reportes claros</h3>
                    <p class="login-hero-feature-text">Visualiza datos clave para decidir mejor.</p>
                  </div>
                </div>
              </app-ui-card>
              <app-ui-card [padded]="false" class="login-hero-feature-card">
                <div class="login-hero-feature">
                  <span class="login-hero-feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </span>
                  <div class="login-hero-feature-copy">
                    <h3 class="login-hero-feature-title">Alertas de stock</h3>
                    <p class="login-hero-feature-text">
                      Detecta faltantes antes de que afecten tu operación.
                    </p>
                  </div>
                </div>
              </app-ui-card>
              <app-ui-card [padded]="false" class="login-hero-feature-card">
                <div class="login-hero-feature">
                  <span class="login-hero-feature-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <div class="login-hero-feature-copy">
                    <h3 class="login-hero-feature-title">Información segura</h3>
                    <p class="login-hero-feature-text">
                      Acceso confiable para equipos y procesos críticos.
                    </p>
                  </div>
                </div>
              </app-ui-card>
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
                      <tr>
                        <td>VENTAS</td>
                        <td><code>ventas&#64;inventario.local</code></td>
                        <td><code>Ventas123!</code></td>
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
