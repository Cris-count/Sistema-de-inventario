import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { routeFadeAnimation, prepareRouteSnapshot } from '../../core/animations';
import {
  matchNavItemByUrl,
  NAV_ITEMS,
  navExactActive,
  navVisibleForPlan,
  navVisibleForRole
} from '../../core/navigation';
import { EmpresaActualService } from '../../core/services/empresa-actual.service';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';

const SIDEBAR_RAIL_KEY = 'inventario_sidebar_rail';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent],
  animations: [routeFadeAnimation],
  template: `
    <div class="shell">
      @if (navOpen()) {
        <div
          class="nav-backdrop"
          aria-hidden="true"
          (click)="navOpen.set(false)"
        ></div>
      }
      <aside
        id="app-sidebar-nav"
        class="sidebar"
        [class.sidebar-open]="navOpen()"
        [class.sidebar--narrow]="railMode()"
        [attr.aria-label]="'Menú principal'"
      >
        <div class="brand">
          @if (railMode()) {
            <button
              type="button"
              class="brand-mark brand-mark--expand"
              (click)="expandRail()"
              [attr.aria-label]="'Expandir menú lateral · ' + activeSectionLabel()"
              [title]="'Abrir panel · ' + activeSectionLabel()"
            >
              <span class="brand-emoji" aria-hidden="true">{{ activeNavIcon() }}</span>
            </button>
          } @else {
            <div class="brand-mark" [attr.aria-label]="'Sección: ' + activeSectionLabel()" role="img">
              <span class="brand-emoji" aria-hidden="true">{{ activeNavIcon() }}</span>
            </div>
          }
          <div class="brand-text">
            <strong class="brand-title">Inventario</strong>
            <span class="brand-tagline">Control multi-bodega</span>
          </div>
        </div>
        @if (!railMode()) {
          <div class="nav-section-head">
            <p class="nav-section-label"><span class="nav-section-text">Navegación</span></p>
            <button
              type="button"
              class="rail-toggle"
              (click)="collapseRail(); $event.stopPropagation()"
              aria-expanded="true"
              aria-label="Contraer menú lateral"
              title="Mostrar solo iconos"
            >
              <svg class="rail-toggle-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="3.5"
                  y="4.5"
                  width="17"
                  height="15"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </button>
          </div>
        }
        <nav>
          @for (item of visibleNav(); track item.parts.join('/')) {
            <a
              class="nav-link"
              [routerLink]="['/app', ...item.parts]"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: navExactActive(item) || item.parts[0] === 'dashboard' }"
              [attr.title]="railMode() ? item.label : null"
              [attr.aria-label]="item.label"
              (click)="closeNav()"
            >
              <span class="nav-ico" aria-hidden="true">{{ item.icon }}</span>
              <span class="nav-txt">{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="user-box">
          <div class="user-box-theme" [class.user-box-theme--compact]="themeToggleCompact()">
            <app-theme-toggle [compact]="themeToggleCompact()" />
          </div>
          @if (auth.user(); as u) {
            <div class="user-row">
              <div class="user-avatar" aria-hidden="true">{{ userInitial(u.nombre) }}</div>
              <div class="user-meta">
                <div class="user-name">{{ u.nombre }}</div>
                <div class="user-role">{{ u.rolNombre }} · {{ u.rolCodigo }}</div>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-ghost logout"
              [attr.title]="railMode() ? 'Cerrar sesión' : null"
              (click)="auth.logout()"
            >
              <span class="logout-ico" aria-hidden="true">🚪</span>
              <span class="logout-txt">Cerrar sesión</span>
            </button>
          }
        </div>
      </aside>
      <div class="main-col">
        <header class="shell-header">
          <button
            type="button"
            class="menu-btn btn btn-ghost"
            [attr.aria-expanded]="navOpen()"
            aria-controls="app-sidebar-nav"
            aria-label="Abrir o cerrar menú"
            (click)="navOpen.update((v) => !v)"
          >
            <span class="menu-icon" aria-hidden="true"></span>
          </button>
          <span class="shell-title">Inventario · Panel</span>
          <div class="shell-header-theme">
            <app-theme-toggle />
          </div>
        </header>
        <div class="main-inner" [@routeFadeAnimation]="prepareRoute(outlet)">
          <router-outlet #outlet="outlet" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .shell {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
    }
    .nav-backdrop {
      display: none;
    }
    .sidebar {
      width: 268px;
      flex-shrink: 0;
      background: var(--surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.15rem 0 0;
      transition: width 0.22s ease;
    }
    .sidebar--narrow {
      width: 72px;
    }
    .brand {
      padding: 0 1rem 1.1rem;
      margin: 0 0.65rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      transition: padding 0.2s ease;
    }
    .sidebar--narrow .brand {
      justify-content: center;
      padding-left: 0.35rem;
      padding-right: 0.35rem;
      margin-left: 0.35rem;
      margin-right: 0.35rem;
    }
    .sidebar--narrow .brand-text {
      display: none;
    }
    .brand-mark {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-bright), var(--accent-dim));
      color: #0c1420;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }
    .brand-emoji {
      font-size: 1.35rem;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button.brand-mark--expand {
      border: none;
      padding: 0;
      font: inherit;
      font-family: inherit;
      cursor: pointer;
    }
    .brand-mark--expand:hover {
      filter: brightness(1.06);
      box-shadow: var(--shadow-md);
    }
    .brand-mark--expand:focus-visible {
      outline: 2px solid var(--accent-bright);
      outline-offset: 2px;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .brand-title {
      font-size: 1.05rem;
      letter-spacing: -0.02em;
    }
    .brand-tagline {
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .nav-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin: 0.65rem 0.65rem 0.35rem;
      flex-shrink: 0;
    }
    .nav-section-label {
      margin: 0;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--muted);
      min-height: 0.85rem;
      flex: 1;
      min-width: 0;
    }
    nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0.2rem 0.65rem 0.5rem;
      gap: 0.2rem;
      min-height: 0;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.85rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      border-radius: var(--radius-sm);
      transition:
        background 0.12s ease,
        color 0.12s ease;
    }
    .nav-ico {
      font-size: 1.15rem;
      line-height: 1;
      width: 1.5rem;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-txt {
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar--narrow .nav-link {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 0.45rem 0.35rem;
      gap: 0.2rem;
      text-align: center;
    }
    .sidebar--narrow .nav-txt {
      display: block;
      max-width: 100%;
      font-size: 0.58rem;
      font-weight: 600;
      line-height: 1.15;
      white-space: normal;
      color: var(--muted);
    }
    .sidebar--narrow .nav-link.active .nav-txt {
      color: var(--accent-bright);
    }
    .nav-link:hover {
      background: var(--accent-soft);
      text-decoration: none;
      color: var(--text);
    }
    .nav-link.active {
      background: var(--accent-soft);
      color: var(--accent-bright);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--accent-glow);
    }
    .rail-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 2.15rem;
      height: 2.15rem;
      padding: 0;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-panel);
      color: var(--muted);
      cursor: pointer;
      font-family: inherit;
      transition:
        border-color 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
    }
    .rail-toggle:hover {
      border-color: var(--accent);
      color: var(--accent-bright);
      background: var(--accent-soft);
    }
    .rail-toggle:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .rail-toggle-svg {
      width: 1.1rem;
      height: 1.1rem;
      display: block;
    }
    .user-box {
      padding: 1rem 1rem 1.15rem;
      margin-top: auto;
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-panel);
    }
    .sidebar--narrow .user-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 0.45rem 1rem;
    }
    .user-box-theme {
      margin-bottom: 0.65rem;
    }
    .sidebar--narrow .user-box-theme {
      margin-bottom: 0.5rem;
    }
    .shell-header-theme {
      margin-left: auto;
    }
    .user-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.65rem;
    }
    .sidebar--narrow .user-meta {
      display: none;
    }
    .sidebar--narrow .user-row {
      justify-content: center;
      margin-bottom: 0.5rem;
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--surface2);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--accent-bright);
      flex-shrink: 0;
    }
    .user-meta {
      min-width: 0;
    }
    .user-name {
      font-weight: 600;
      font-size: 0.88rem;
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .user-role {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 0.15rem;
      line-height: 1.3;
    }
    .logout {
      margin-top: 0;
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
    }
    .logout-ico {
      font-size: 1rem;
      line-height: 1;
    }
    .sidebar--narrow .logout-txt {
      display: none;
    }
    .sidebar--narrow .logout {
      padding: 0.5rem;
    }
    .shell-header {
      display: none;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: var(--shadow-sm);
    }
    .shell-title {
      font-weight: 600;
      font-size: 0.92rem;
      letter-spacing: -0.02em;
    }
    .menu-btn {
      padding: 0.4rem 0.55rem;
      min-width: 2.5rem;
    }
    .menu-icon {
      display: block;
      width: 1.25rem;
      height: 2px;
      background: var(--text);
      border-radius: 1px;
      box-shadow:
        0 6px 0 var(--text),
        0 -6px 0 var(--text);
    }
    .main-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }
    .main-inner {
      flex: 1;
      padding: var(--space-page, 1.5rem);
      overflow-x: auto;
      background: var(--bg);
    }

    @media (max-width: 768px) {
      .shell {
        flex-direction: column;
      }
      .nav-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 150;
        -webkit-tap-highlight-color: transparent;
      }
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        height: 100dvh;
        width: min(280px, 88vw);
        z-index: 200;
        transform: translateX(-100%);
        transition: transform 0.22s ease;
        box-shadow: none;
        overflow-y: auto;
      }
      /* En móvil el cajón siempre muestra texto + iconos; el modo rail no reduce ancho */
      .sidebar.sidebar--narrow {
        width: min(280px, 88vw);
      }
      .sidebar.sidebar--narrow .brand-text,
      .sidebar.sidebar--narrow .nav-txt,
      .sidebar.sidebar--narrow .user-meta,
      .sidebar.sidebar--narrow .logout-txt {
        display: revert;
      }
      .sidebar.sidebar--narrow .nav-link {
        justify-content: flex-start;
        gap: 0.65rem;
        padding: 0.55rem 0.85rem;
      }
      .sidebar.sidebar--narrow .brand {
        justify-content: flex-start;
        padding-left: 1rem;
        padding-right: 1rem;
        margin-left: 0.65rem;
        margin-right: 0.65rem;
      }
      .sidebar.sidebar--narrow .user-row {
        justify-content: flex-start;
      }
      .sidebar.sidebar-open {
        transform: translateX(0);
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.35);
      }
      .shell-header {
        display: flex;
      }
      .nav-section-head .rail-toggle {
        display: none;
      }
      .main-inner {
        padding: 1rem;
        padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
      }
    }
  `
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly empresaApi = inject(EmpresaActualService);
  private readonly destroyRef = inject(DestroyRef);
  readonly navExactActive = navExactActive;
  readonly navOpen = signal(false);
  readonly prepareRoute = prepareRouteSnapshot;

  /**
   * Vista de escritorio (mismo breakpoint que el cajón móvil): en móvil el menú es ancho aunque railMode
   * siga en localStorage; el tema debe mostrar etiqueta como el resto del panel.
   */
  private readonly viewportDesktop = signal(
    typeof globalThis.matchMedia !== 'undefined' ? globalThis.matchMedia('(min-width: 769px)').matches : true
  );

  /** Módulos del plan actual (`GET /empresa/mi`); null = sin cargar o error al cargar. */
  private readonly planModules = signal<Set<string> | null>(null);

  /** Modo solo iconos (barra estrecha); preferencia del usuario, persistida. */
  readonly railMode = signal(false);

  /** Toggle de tema compacto solo en barra estrecha en escritorio. */
  readonly themeToggleCompact = computed(() => this.railMode() && this.viewportDesktop());

  /** URL actual para recalcular el emoji del apartado activo en la marca. */
  private readonly urlPath = signal(this.router.url);

  /** Emoji del ítem de menú que coincide con la ruta (marca superior). */
  readonly activeNavIcon = computed(() => {
    this.urlPath();
    return matchNavItemByUrl(this.router.url)?.icon ?? '🏠';
  });

  /** Etiqueta legible del apartado activo (accesibilidad / tooltips). */
  readonly activeSectionLabel = computed(() => {
    this.urlPath();
    return matchNavItemByUrl(this.router.url)?.label ?? 'Inicio';
  });

  constructor() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_RAIL_KEY) === '1') {
        this.railMode.set(true);
      }
    } catch {
      /* ignore */
    }

    if (typeof globalThis.matchMedia !== 'undefined') {
      const mq = globalThis.matchMedia('(min-width: 769px)');
      const onChange = (): void => this.viewportDesktop.set(mq.matches);
      onChange();
      mq.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mq.removeEventListener('change', onChange));
    }

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.urlPath.set(this.router.url);
        this.navOpen.set(false);
      });

    toObservable(this.auth.user)
      .pipe(
        switchMap((u) => {
          if (!u) return of<Set<string> | null>(null);
          return this.empresaApi.getMiEmpresa().pipe(
            map((e) => new Set(e.modulosHabilitados ?? [])),
            catchError(() => of<Set<string> | null>(null))
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((mods) => this.planModules.set(mods));
  }

  private persistRail(narrow: boolean): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SIDEBAR_RAIL_KEY, narrow ? '1' : '0');
      }
    } catch {
      /* ignore */
    }
  }

  /** Contrae a solo iconos; el botón del panel se oculta hasta volver a expandir. */
  collapseRail(): void {
    this.railMode.set(true);
    this.persistRail(true);
  }

  /** Expande el panel (p. ej. al pulsar el logo IV en modo estrecho). */
  expandRail(): void {
    this.railMode.set(false);
    this.persistRail(false);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  userInitial(nombre: string): string {
    const t = nombre?.trim();
    if (!t) return '?';
    return t.charAt(0).toUpperCase();
  }

  readonly visibleNav = computed(() => {
    const role = this.auth.role();
    const mods = this.planModules();
    return NAV_ITEMS.filter((i) => navVisibleForRole(role, i) && navVisibleForPlan(i, mods));
  });
}
