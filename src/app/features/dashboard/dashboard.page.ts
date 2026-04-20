import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { InventarioService } from '../../core/api/inventario.service';
import { AuthService } from '../../core/auth/auth.service';
import { NAV_ITEMS, navVisibleForPlan, navVisibleForRole } from '../../core/navigation';
import { EmpresaActualService } from '../../core/services/empresa-actual.service';
import { consumeAccessFlash } from '../../core/util/access-flash';

/** Orden de accesos rápidos; cada entrada debe existir en NAV_ITEMS con la misma ruta. */
const QUICK_NAV_PARTS: string[][] = [
  ['productos'],
  ['movimientos', 'entrada'],
  ['movimientos', 'salida'],
  ['inventario'],
  ['bodegas'],
  ['stock-inicial']
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page stack dash">
      <header class="dash-header page-header">
        @if (accessDeniedHint()) {
          <div class="alert alert-error dash-alert" role="alert">
            No tiene permiso para acceder a esa sección con su rol actual (<strong>{{ auth.role() }}</strong>). Use el
            menú lateral para las opciones disponibles.
          </div>
        }
        <div class="dash-header-grid">
          <div class="dash-header-copy">
            <p class="dash-kicker">Resumen operativo</p>
            <h1>Panel de control</h1>
            <p class="dash-greeting">
              {{ greeting() }}, <span class="dash-greeting-name">{{ auth.user()?.nombre }}</span>
              <span class="muted dash-greeting-email"> · {{ auth.user()?.email }}</span>
            </p>
            <p class="dash-microcopy muted">
              Operaciones y permisos según su rol; el menú lateral agrupa todas las áreas habilitadas.
            </p>
          </div>
          <div class="dash-header-meta" aria-label="Contexto de sesión">
            <div class="dash-avatar" aria-hidden="true">{{ userInitial(auth.user()?.nombre ?? '') }}</div>
            <div class="dash-meta-col">
              <div class="dash-badges">
                <span class="dash-badge">{{ auth.user()?.rolNombre }}</span>
                <span class="dash-badge dash-badge--code">{{ auth.user()?.rolCodigo }}</span>
              </div>
              @if (auth.user()?.empresaNombre) {
                <div class="dash-empresa">
                  <span class="dash-empresa-label">Empresa</span>
                  <span class="dash-empresa-name">{{ auth.user()?.empresaNombre }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <section class="kpi-grid dash-kpi-row" aria-label="Indicadores clave">
        <div class="card kpi-card dash-kpi">
          <div class="dash-kpi-head">
            <span class="dash-kpi-ico" aria-hidden="true">📊</span>
            <h2>Existencias registradas</h2>
          </div>
          @if (loading()) {
            <p class="dash-kpi-loading"><span class="spinner" aria-hidden="true"></span> Cargando…</p>
          } @else {
            <p class="stat dash-kpi-stat">{{ totalInventario() | number }}</p>
            <p class="dash-kpi-desc muted">Líneas de inventario con stock en el sistema.</p>
            <a class="dash-kpi-link" routerLink="/app/inventario">Abrir inventario</a>
          }
        </div>
        <div
          class="card kpi-card dash-kpi"
          [class.dash-kpi--warn]="!loading() && alertasCount() > 0"
        >
          <div class="dash-kpi-head">
            <span class="dash-kpi-ico" aria-hidden="true">⚠️</span>
            <h2>Alertas bajo mínimo</h2>
          </div>
          @if (loading()) {
            <p class="dash-kpi-loading"><span class="spinner" aria-hidden="true"></span> Cargando…</p>
          } @else {
            <p class="stat dash-kpi-stat">{{ alertasCount() | number }}</p>
            <p class="dash-kpi-desc muted">Productos por debajo del stock mínimo configurado.</p>
            <a class="dash-kpi-link" routerLink="/app/inventario">Revisar en inventario</a>
          }
        </div>
      </section>

      <div class="dash-operational">
        <section class="card dash-panel" aria-labelledby="dash-quick-title">
          <div class="dash-panel-head">
            <h2 id="dash-quick-title">Accesos rápidos</h2>
            <p class="dash-panel-sub muted">Atajos a tareas frecuentes según su plan y rol.</p>
          </div>
          @if (visibleQuickActions().length === 0) {
            <p class="muted dash-empty-quick">No hay atajos adicionales visibles con su configuración actual.</p>
          } @else {
            <ul class="dash-quick-grid">
              @for (item of visibleQuickActions(); track item.trackKey) {
                <li>
                  <a class="dash-quick-card" [routerLink]="item.link">
                    <span class="dash-quick-ico" aria-hidden="true">{{ item.icon }}</span>
                    <span class="dash-quick-text">
                      <span class="dash-quick-label">{{ item.label }}</span>
                      <span class="dash-quick-hint muted">{{ item.hint }}</span>
                    </span>
                    <span class="dash-quick-arrow" aria-hidden="true">→</span>
                  </a>
                </li>
              }
            </ul>
          }
        </section>

        <section class="card dash-panel" aria-labelledby="dash-flow-title">
          <div class="dash-panel-head">
            <h2 id="dash-flow-title">Flujo de trabajo recomendado</h2>
            <p class="dash-panel-sub muted">Orden sugerido para dejar el inventario consistente.</p>
          </div>
          <ol class="dash-flow-steps">
            @for (step of workflowSteps; track step.n) {
              <li class="dash-flow-step">
                <div class="dash-flow-num" aria-hidden="true">{{ step.n }}</div>
                <div class="dash-flow-body">
                  <div class="dash-flow-title-row">
                    <span class="dash-flow-ico" aria-hidden="true">{{ step.icon }}</span>
                    <span class="dash-flow-title">{{ step.title }}</span>
                  </div>
                  <p class="dash-flow-text muted">{{ step.text }}</p>
                </div>
              </li>
            }
          </ol>
        </section>
      </div>
    </div>
  `,
  styles: `
    .dash-header.page-header {
      margin-bottom: 0.25rem;
      padding-bottom: 1.1rem;
    }
    .dash-alert {
      margin-bottom: 1rem;
    }
    .dash-header-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.25rem 1.75rem;
    }
    .dash-header-copy {
      flex: 1 1 280px;
      min-width: 0;
    }
    .dash-kicker {
      margin: 0 0 0.2rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .dash-header-copy h1 {
      margin: 0 0 0.35rem;
      font-size: clamp(1.45rem, 3vw, 1.85rem);
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .dash-greeting {
      margin: 0;
      font-size: var(--text-body);
      color: var(--text);
      line-height: 1.45;
    }
    .dash-greeting-name {
      font-weight: 600;
    }
    .dash-greeting-email {
      font-size: var(--text-body-sm);
    }
    .dash-microcopy {
      margin: 0.55rem 0 0;
      font-size: var(--text-body-sm);
      max-width: 52ch;
      line-height: 1.5;
    }
    .dash-header-meta {
      display: flex;
      align-items: flex-start;
      gap: 0.9rem;
      flex-shrink: 0;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius);
      background: var(--bg-panel);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-sm);
    }
    .dash-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--surface2);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: var(--accent-bright);
      flex-shrink: 0;
    }
    .dash-meta-col {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      min-width: 0;
    }
    .dash-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .dash-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      background: var(--accent-soft);
      color: var(--accent-bright);
      border: 1px solid var(--accent-glow);
    }
    .dash-badge--code {
      font-family: ui-monospace, monospace;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: var(--surface2);
      color: var(--muted);
      border-color: var(--border);
    }
    .dash-empresa {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      padding-top: 0.15rem;
      border-top: 1px solid var(--border-subtle);
      margin-top: 0.1rem;
    }
    .dash-empresa-label {
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
    }
    .dash-empresa-name {
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1.3;
      word-break: break-word;
    }
    .dash-kpi-row {
      margin-top: 0.35rem;
    }
    .dash-kpi .dash-kpi-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.15rem;
    }
    .dash-kpi .dash-kpi-head h2 {
      margin: 0;
    }
    .dash-kpi-ico {
      font-size: 1.15rem;
      line-height: 1;
    }
    .dash-kpi-stat {
      margin-top: 0.25rem;
      margin-bottom: 0.35rem;
    }
    .dash-kpi-desc {
      margin: 0 0 0.75rem;
      font-size: var(--text-body-sm);
      line-height: 1.45;
      max-width: 36ch;
    }
    .dash-kpi-loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.5rem 0 0;
      color: var(--muted);
      font-size: var(--text-body-sm);
    }
    .dash-kpi-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
      font-size: 0.88rem;
      text-decoration: none;
      color: var(--accent-bright);
      border-radius: var(--radius-sm);
      transition: color 0.12s ease, background 0.12s ease;
      padding: 0.2rem 0.15rem;
      margin: -0.2rem -0.15rem;
    }
    .dash-kpi-link:hover {
      color: var(--text);
      background: var(--accent-soft);
      text-decoration: none;
    }
    .dash-kpi-link:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .dash-kpi--warn::before {
      background: linear-gradient(90deg, color-mix(in srgb, var(--danger) 55%, var(--accent-dim)), var(--danger));
      opacity: 1;
    }
    .dash-kpi--warn .dash-kpi-stat {
      color: var(--danger);
    }
    [data-theme='light'] .dash-kpi--warn .dash-kpi-stat {
      color: color-mix(in srgb, var(--danger) 85%, #1a1a1a);
    }
    .dash-operational {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 1.15rem;
      align-items: stretch;
    }
    .dash-panel {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      padding: 1.25rem 1.35rem;
    }
    .dash-panel-head {
      margin-bottom: 1rem;
    }
    .dash-panel-head h2 {
      margin: 0 0 0.25rem;
    }
    .dash-panel-sub {
      margin: 0;
      font-size: var(--text-body-sm);
      line-height: 1.45;
      max-width: 48ch;
    }
    .dash-empty-quick {
      margin: 0;
      font-size: var(--text-body-sm);
    }
    .dash-quick-grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .dash-quick-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--surface2);
      text-decoration: none;
      color: var(--text);
      transition:
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;
    }
    .dash-quick-card:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
      box-shadow: 0 0 0 1px var(--accent-glow);
      text-decoration: none;
      color: var(--text);
    }
    .dash-quick-card:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    .dash-quick-ico {
      font-size: 1.25rem;
      line-height: 1;
      flex-shrink: 0;
      width: 2rem;
      text-align: center;
    }
    .dash-quick-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
      flex: 1;
    }
    .dash-quick-label {
      font-weight: 600;
      font-size: 0.9rem;
      line-height: 1.25;
    }
    .dash-quick-hint {
      font-size: 0.75rem;
      line-height: 1.35;
    }
    .dash-quick-arrow {
      flex-shrink: 0;
      color: var(--muted);
      font-weight: 600;
      transition: transform 0.15s ease, color 0.15s ease;
    }
    .dash-quick-card:hover .dash-quick-arrow {
      color: var(--accent-bright);
      transform: translateX(3px);
    }
    .dash-flow-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .dash-flow-step {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-panel);
    }
    .dash-flow-num {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 800;
      background: var(--accent-soft);
      color: var(--accent-bright);
    }
    .dash-flow-body {
      min-width: 0;
      flex: 1;
    }
    .dash-flow-title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.2rem;
    }
    .dash-flow-ico {
      font-size: 1rem;
      line-height: 1;
    }
    .dash-flow-title {
      font-weight: 600;
      font-size: 0.88rem;
    }
    .dash-flow-text {
      margin: 0;
      font-size: var(--text-body-sm);
      line-height: 1.55;
    }
    @media (max-width: 768px) {
      .dash-header-meta {
        width: 100%;
        box-sizing: border-box;
      }
      .dash-panel {
        padding: 1.1rem 1.15rem;
      }
    }
  `
})
export class DashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly inventarioApi = inject(InventarioService);
  private readonly empresaApi = inject(EmpresaActualService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly totalInventario = signal(0);
  readonly alertasCount = signal(0);
  /** Tras redirect del roleGuard por ruta no permitida. */
  readonly accessDeniedHint = signal(false);

  /** Módulos del plan; misma semántica que la barra lateral (`null` = sin filtrar por plan). */
  private readonly planModules = signal<Set<string> | null>(null);

  readonly workflowSteps = [
    {
      n: 1,
      icon: '🗂️',
      title: 'Maestros',
      text: 'Configurar categorías, productos y bodegas según su rol.'
    },
    {
      n: 2,
      icon: '📥',
      title: 'Stock inicial',
      text: 'Cargar existencias de partida (equipos de administración).'
    },
    {
      n: 3,
      icon: '🔁',
      title: 'Movimientos',
      text: 'Registrar entradas, salidas, transferencias o ajustes en el día a día.'
    },
    {
      n: 4,
      icon: '📑',
      title: 'Consulta y reportes',
      text: 'Revisar existencias, kardex y exportación cuando lo necesite.'
    }
  ] as const;

  private static readonly QUICK_HINTS: Record<string, string> = {
    productos: 'Alta y catálogo',
    entrada: 'Ingreso a bodega',
    salida: 'Egreso de bodega',
    inventario: 'Existencias y alertas',
    bodegas: 'Ubicaciones de stock',
    'stock-inicial': 'Carga masiva inicial'
  };

  readonly visibleQuickActions = computed(() => {
    const role = this.auth.role();
    const mods = this.planModules();
    const out: Array<{
      trackKey: string;
      link: string[];
      label: string;
      hint: string;
      icon: string;
    }> = [];

    for (const parts of QUICK_NAV_PARTS) {
      const item = NAV_ITEMS.find(
        (i) => i.parts.length === parts.length && i.parts.every((seg, j) => seg === parts[j])
      );
      if (!item) continue;
      if (!navVisibleForRole(role, item) || !navVisibleForPlan(item, mods)) continue;

      const last = parts[parts.length - 1];
      const hint =
        DashboardPage.QUICK_HINTS[last] ??
        (parts.length > 1 ? DashboardPage.QUICK_HINTS[parts[1]] ?? item.label : item.label);

      out.push({
        trackKey: parts.join('/'),
        link: ['/app', ...item.parts],
        label: item.label,
        hint,
        icon: item.icon
      });
    }
    return out;
  });

  constructor() {
    toObservable(this.auth.user)
      .pipe(
        switchMap((u) => {
          if (!u) return of<Set<string> | null>(null);
          return this.empresaApi.getMiEmpresa().pipe(
            map((e) => new Set(e.modulosHabilitados ?? [])),
            catchError(() => of<Set<string> | null>(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((mods) => this.planModules.set(mods));
  }

  ngOnInit(): void {
    if (consumeAccessFlash() === 'route_forbidden') {
      this.accessDeniedHint.set(true);
    }
    let pending = 2;
    const done = (): void => {
      pending--;
      if (!pending) this.loading.set(false);
    };
    this.inventarioApi
      .list(0, 1)
      .pipe(finalize(done))
      .subscribe({
        next: (p) => this.totalInventario.set(p.totalElements),
        error: () => this.totalInventario.set(0)
      });
    this.inventarioApi
      .alertas()
      .pipe(finalize(done))
      .subscribe({
        next: (a) => this.alertasCount.set(a.length),
        error: () => this.alertasCount.set(0)
      });
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  userInitial(nombre: string): string {
    const t = nombre?.trim();
    if (!t) return '?';
    return t.charAt(0).toUpperCase();
  }
}
