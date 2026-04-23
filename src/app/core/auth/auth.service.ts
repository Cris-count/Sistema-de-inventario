import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthLoginResponse, UserSummary } from '../models/auth.model';
import { isJwtExpired } from '../util/jwt-expiry';

const TOKEN_KEY = 'inventario_token';
const USER_KEY = 'inventario_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<UserSummary | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly role = computed(() => this._user()?.rolCodigo ?? null);

  constructor() {
    this.restoreFromStorage();
    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key != null && e.key !== TOKEN_KEY && e.key !== USER_KEY) {
          return;
        }
        this.restoreFromStorage();
      });
    }
  }

  private restoreFromStorage(): void {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (!t || !u) {
      if (t != null || u != null) {
        this.clearSession();
      }
      return;
    }
    const trimmed = t.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
      this.clearSession();
      return;
    }
    try {
      if (isJwtExpired(trimmed)) {
        this.clearSession();
        return;
      }
      this._token.set(trimmed);
      this._user.set(JSON.parse(u) as UserSummary);
    } catch {
      this.clearSession();
    }
  }

  /**
   * Login y sincronización inmediata con `GET /auth/me` para alinear rol con la BD
   * (misma fuente que el filtro JWT en el servidor).
   */
  login(email: string, password: string): Observable<UserSummary> {
    const e = email.trim().toLowerCase();
    const p = password.trim();
    this.clearSession();
    return this.http.post<AuthLoginResponse>(`${environment.apiUrl}/auth/login`, { email: e, password: p }).pipe(
      switchMap((res) => {
        if (res.mfaRequired) {
          return throwError(
            () =>
              new Error(
                'Esta cuenta tiene verificación en dos pasos (MFA). Este cliente aún no incluye el paso MFA tras el login; use una cuenta sin MFA o contacte al administrador.'
              )
          );
        }
        const at = res.accessToken?.trim();
        if (!at || at === 'null' || at === 'undefined') {
          return throwError(
            () => new Error('El servidor no devolvió un token de acceso válido. Revise credenciales o el estado de la cuenta.')
          );
        }
        if (!res.user) {
          return throwError(() => new Error('El servidor no devolvió datos de usuario en el login.'));
        }
        this.persistAccessAndUser(at, res.user);
        return this.refreshMe();
      })
    );
  }

  refreshMe(): Observable<UserSummary> {
    return this.http.get<UserSummary>(`${environment.apiUrl}/auth/me`).pipe(
      tap((me) => {
        localStorage.setItem(USER_KEY, JSON.stringify(me));
        this._user.set(me);
      })
    );
  }

  private persistAccessAndUser(accessToken: string, user: UserSummary): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(accessToken);
    this._user.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  /** El backend no expone POST /auth/logout; solo limpia el cliente. */
  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  hasAnyRole(roles: string[]): boolean {
    const r = this.role();
    return !!r && roles.includes(r);
  }
}
