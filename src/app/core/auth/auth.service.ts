import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenResponse, UserSummary } from '../models/auth.model';
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
    try {
      if (isJwtExpired(t)) {
        this.clearSession();
        return;
      }
      this._token.set(t);
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
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, { email: e, password: p }).pipe(
      tap((res) => this.persist(res)),
      switchMap(() => this.refreshMe())
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

  private persist(res: TokenResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set(res.user);
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
