import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { routeFadeAnimation, prepareRouteSnapshot } from '../../core/animations';
import {
  matchNavItemByUrl,
  type NavItem,
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
          <div class="brand-main">
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
              <strong class="brand-title">Cersik Inventario</strong>
              <span class="brand-tagline">Panel empresarial</span>
            </div>
          </div>
          @if (!railMode()) {
            <button
              type="button"
              class="rail-toggle rail-toggle--brand"
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
          }
        </div>
        <div class="sidebar-scroll">
          <nav class="sidebar-nav" aria-label="Secciones del sistema">
            @for (group of navGroups(); track group.section; let gi = $index) {
              <div class="nav-group">
                @if (!railMode()) {
                  <p class="nav-group-label" [attr.id]="'shell-nav-grp-' + gi">{{ group.section }}</p>
                }
                <div
                  class="nav-group-links"
                  role="group"
                  [attr.aria-labelledby]="!railMode() ? 'shell-nav-grp-' + gi : null"
                >
                  @for (item of group.items; track item.parts.join('/')) {
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
                </div>
              </div>
            }
          </nav>
        </div>
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
          <div class="shell-title-wrap">
            <span class="shell-title-kicker">Cersik</span>
            <span class="shell-title" aria-live="polite">{{ activeSectionLabel() }}</span>
          </div>
          <div class="shell-header-theme">
            <app-theme-toggle />
          </div>
        </header>
        <div class="main-inner shell-main" [@routeFadeAnimation]="prepareRoute(outlet)">
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
      --shell-sidebar-w: 280px;
      width: var(--shell-sidebar-w);
      flex-shrink: 0;
      background: color-mix(in srgb, var(--surface) 88%, var(--bg-panel));
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 0;
      transition: width 0.22s ease;
      min-height: 0;
      box-shadow: 1px 0 0 color-mix(in srgb, var(--border-subtle) 65%, transparent);
    }
    [data-theme='light'] .sidebar {
      background: color-mix(in srgb, var(--surface) 94%, var(--bg-deep));
    }
    .sidebar--narrow {
      width: 72px;
    }
    .brand {
      padding: 1rem 0.9rem 0.95rem;
      margin: 0 0.65rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
      transition: padding 0.2s ease;
      flex-shrink: 0;
    }
    .brand-main {
      display: flex;
      align-items: flex-start;
      gap: 0.8rem;
      min-width: 0;
      flex: 1;
    }
    .sidebar--narrow .brand {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-left: 0.35rem;
      padding-right: 0.35rem;
      margin-left: 0.35rem;
      margin-right: 0.35rem;
    }
    .sidebar--narrow .brand-main {
      flex-direction: column;
      align-items: center;
    }
    .sidebar--narrow .brand-text {
      display: none;
    }
    .brand-mark {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: linear-gradient(145deg, var(--accent-bright), var(--accent-dim));
      color: #0c1420;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow:
        var(--shadow-sm),
        0 0 0 1px color-mix(in srgb, var(--accent-bright) 22%, transparent);
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
      gap: 0.12rem;
      min-width: 0;
      padding-top: 0.08rem;
    }
    .brand-title {
      font-size: 1.02rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }
    .brand-tagline {
      font-size: 0.68rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }
    .sidebar-scroll {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      padding: 0.5rem 0.6rem 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .nav-group {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .nav-group + .nav-group {
      margin-top: 0.55rem;
      padding-top: 0.55rem;
      border-top: 1px solid color-mix(in srgb, var(--border-subtle) 88%, transparent);
    }
    .sidebar--narrow .nav-group + .nav-group {
      border-top: none;
      margin-top: 0.2rem;
      padding-top: 0;
    }
    .nav-group-label {
      margin: 0;
      padding: 0.35rem 0.75rem 0.15rem;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
    }
    .sidebar--narrow .nav-group-label {
      display: none;
    }
    .nav-group-links {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .nav-link {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.52rem 0.8rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-sm);
      transition:
        background 0.14s ease,
        color 0.14s ease,
        box-shadow 0.14s ease;
    }
    .nav-ico {
      font-size: 1.12rem;
      line-height: 1;
      width: 1.55rem;
      height: 1.55rem;
      display: flex;
      align-items: center;
      justify-content: center;
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
      background: color-mix(in srgb, var(--accent-soft) 85%, transparent);
      text-decoration: none;
      color: var(--text);
    }
    .nav-link:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 1px;
    }
    .nav-link.active {
      background: color-mix(in srgb, var(--accent-soft) 100%, transparent);
      color: var(--accent-bright);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--accent-glow);
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.38rem;
      bottom: 0.38rem;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: linear-gradient(180deg, var(--accent-bright), var(--accent-dim));
    }
    .sidebar--narrow .nav-link.active::before {
      display: none;
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
      background: color-mix(in srgb, var(--surface) 55%, var(--bg-panel));
      color: var(--muted);
      cursor: pointer;
      font-family: inherit;
      transition:
        border-color 0.15s ease,
        color 0.15s ease,
        background 0.15s ease;
    }
    .rail-toggle--brand {
      align-self: flex-start;
      margin-top: 0.12rem;
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
      padding: 1rem 0.9rem 1.1rem;
      margin-top: auto;
      border-top: 1px solid var(--border-subtle);
      background: color-mix(in srgb, var(--bg-panel) 92%, var(--surface));
      flex-shrink: 0;
      box-shadow: 0 -1px 0 color-mix(in srgb, var(--border-subtle) 55%, transparent);
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
      padding: 0.65rem max(1rem, env(safe-area-inset-right, 0px)) 0.65rem max(1rem, env(safe-area-inset-left, 0px));
      padding-top: max(0.65rem, env(safe-area-inset-top, 0px));
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: var(--shadow-sm);
    }
    .shell-title-wrap {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.06rem;
      line-height: 1.2;
    }
    .shell-title-kicker {
      font-size: 0.58rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
    }
    .shell-title {
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: -0.02em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text);
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
      padding: var(--space-ds-5) var(--space-page, 1.5rem) var(--space-ds-6);
      padding-left: max(var(--space-page, 1.5rem), env(safe-area-inset-left, 0px));
      padding-right: max(var(--space-page, 1.5rem), env(safe-area-inset-right, 0px));
      overflow-x: auto;
      background: var(--bg);
    }
    .main-inner.shell-main {
      max-width: 100%;
    }

    @media (min-width: 769px) and (max-width: 1199px) {
      .main-inner {
        padding-left: max(1.15rem, env(safe-area-inset-left, 0px));
        padding-right: max(1.15rem, env(safe-area-inset-right, 0px));
      }
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
        max-height: 100dvh;
        width: min(var(--shell-sidebar-w, 280px), 88vw);
        z-index: 200;
        transform: translateX(-100%);
        transition: transform 0.22s ease;
        box-shadow: none;
        overflow: hidden;
        padding-bottom: env(safe-area-inset-bottom, 0px);
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
        padding-left: max(0, env(safe-area-inset-left, 0px));
      }
      .shell-header {
        display: flex;
      }
      .main-inner {
        padding: var(--space-ds-4) 1rem var(--space-ds-5);
        padding-left: max(1rem, env(safe-area-inset-left, 0px));
        padding-right: max(1rem, env(safe-area-inset-right, 0px));
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

  /** Ítems visibles agrupados por `navSection` (orden estable del catálogo). */
  readonly navGroups = computed(() => {
    const role = this.auth.role();
    const mods = this.planModules();
    const items = NAV_ITEMS.filter((i) => navVisibleForRole(role, i) && navVisibleForPlan(i, mods));
    const groups: { section: string; items: NavItem[] }[] = [];
    for (const item of items) {
      const last = groups[groups.length - 1];
      if (last && last.section === item.navSection) {
        last.items.push(item);
      } else {
        groups.push({ section: item.navSection, items: [item] });
      }
    }
    return groups;
  });
}
