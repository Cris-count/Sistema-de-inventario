import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { BodegaService } from '../../core/api/bodega.service';
import { ClienteApiService } from '../../core/api/cliente-api.service';
import { InventarioService } from '../../core/api/inventario.service';
import { MovimientoApiService } from '../../core/api/movimiento.service';
import { ProductoService } from '../../core/api/producto.service';
import { ProveedorService } from '../../core/api/proveedor.service';
import { VentaApiService } from '../../core/api/venta-api.service';
import { AuthService } from '../../core/auth/auth.service';
import { MovimientoList, VentaListItem, VentaPanelResumen } from '../../core/models/entities.model';
import { NAV_ITEMS, navVisibleForPlan, navVisibleForRole } from '../../core/navigation';
import { EmpresaActualService } from '../../core/services/empresa-actual.service';
import { consumeAccessFlash } from '../../core/util/access-flash';
import { DismissibleHintComponent } from '../../shared/dismissible-hint/dismissible-hint.component';

/** Orden de accesos rápidos; cada entrada debe existir en NAV_ITEMS con la misma ruta. */
const QUICK_NAV_PARTS: string[][] = [
  ['ventas'],
  ['abastecimiento'],
  ['productos'],
  ['movimientos', 'entrada'],
  ['inventario'],
  ['bodegas'],
  ['proveedores'],
  ['reportes', 'kardex'],
  ['stock-inicial']
];

interface DashboardKpi {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  link?: string[];
  tone?: 'default' | 'success' | 'warning' | 'danger';
  priority?: 'primary' | 'secondary';
  state?: 'available' | 'unavailable';
}

interface AttentionItem {
  title: string;
  detail: string;
  icon: string;
  link: string[];
  severity: 'ok' | 'warning' | 'danger';
}

interface ActivityItem {
  kind: 'Venta' | 'Movimiento';
  title: string;
  detail: string;
  date: string;
  link: string[];
  tone: 'sales' | 'stock';
}

type DashboardDataKey =
  | 'inventario'
  | 'alertas'
  | 'productos'
  | 'bodegas'
  | 'proveedores'
  | 'clientes'
  | 'ventasResumen'
  | 'ventasRecientes'
  | 'ventasAnulacion'
  | 'ventasCanceladas'
  | 'movimientos';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, DatePipe, DismissibleHintComponent],
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
            <p class="dash-kicker">Centro de mando · {{ auth.user()?.rolCodigo }}</p>
            <h1>Panel ejecutivo-operativo</h1>
            <p class="dash-greeting">
              {{ greeting() }}, <span class="dash-greeting-name">{{ auth.user()?.nombre }}</span>
              <span class="muted dash-greeting-email"> · {{ auth.user()?.email }}</span>
            </p>
            <p class="dash-microcopy muted">
              Supervisa inventario, ventas, abastecimiento y actividad reciente desde una sola vista.
            </p>
            <div class="dash-status-row" aria-label="Resumen ejecutivo">
              <span
                class="dash-status-chip"
                [class.dash-status-chip--warn]="metricUnavailable('alertas') || alertasCount() > 0"
              >
                {{
                  metricUnavailable('alertas')
                    ? 'Alertas no disponibles'
                    : alertasCount() > 0
                      ? 'Atención requerida'
                      : 'Inventario sin alertas críticas'
                }}
              </span>
              <span class="dash-status-chip">{{ visibleQuickActions().length | number }} accesos disponibles</span>
              <span class="dash-status-chip">Plan: {{ planModulesLabel() }}</span>
            </div>
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

      <section class="dash-command-grid" aria-label="Indicadores ejecutivos">
        @for (kpi of executiveKpis(); track kpi.label) {
          <article
            class="card dash-kpi"
            [class.dash-kpi--primary]="kpi.priority === 'primary'"
            [class.dash-kpi--secondary]="kpi.priority === 'secondary'"
            [class.dash-kpi--unavailable]="kpi.state === 'unavailable'"
            [class.dash-kpi--warn]="kpi.tone === 'warning'"
            [class.dash-kpi--danger]="kpi.tone === 'danger'"
          >
            <div class="dash-kpi-head">
              <span class="dash-kpi-ico" aria-hidden="true">{{ kpi.icon }}</span>
              <span class="dash-kpi-label">{{ kpi.label }}</span>
            </div>
            @if (loading()) {
              <p class="dash-kpi-loading"><span class="spinner" aria-hidden="true"></span> Cargando…</p>
            } @else {
              <strong class="dash-kpi-value">{{ kpi.value }}</strong>
              <p class="dash-kpi-desc muted">{{ kpi.hint }}</p>
              @if (kpi.state === 'unavailable') {
                <span class="dash-data-state">No disponible</span>
              }
              @if (kpi.link) {
                <a class="dash-kpi-link" [routerLink]="kpi.link">Abrir módulo</a>
              }
            }
          </article>
        }
      </section>

      <section class="dash-main-grid" aria-label="Centro operativo">
        <div class="dash-left stack">
          <section class="card dash-panel dash-attention" aria-labelledby="dash-attention-title">
            <div class="dash-panel-head">
              <p class="dash-section-kicker">Prioridades</p>
              <h2 id="dash-attention-title">Qué necesita atención</h2>
              <p class="dash-panel-sub muted">Estados reales derivados de inventario y ventas.</p>
            </div>
            @if (loading()) {
              <p class="dash-kpi-loading"><span class="spinner" aria-hidden="true"></span> Cargando prioridades…</p>
            } @else if (attentionItems().length === 0) {
              <div class="dash-attention-clear">
                <span class="dash-attention-ico" aria-hidden="true">✓</span>
                <span>
                  <strong>Sin prioridades críticas</strong>
                  <span class="muted">No hay alertas de stock ni ventas pendientes de seguimiento con los datos disponibles.</span>
                </span>
              </div>
            } @else {
              <ul class="dash-attention-list">
                @for (item of attentionItems(); track item.title) {
                  <li
                    class="dash-attention-item"
                    [class.dash-attention-item--ok]="item.severity === 'ok'"
                    [class.dash-attention-item--warning]="item.severity === 'warning'"
                    [class.dash-attention-item--danger]="item.severity === 'danger'"
                  >
                    <span class="dash-attention-ico" aria-hidden="true">{{ item.icon }}</span>
                    <span class="dash-attention-copy">
                      <strong>{{ item.title }}</strong>
                      <span class="muted">{{ item.detail }}</span>
                    </span>
                    <a [routerLink]="item.link" [attr.aria-label]="'Abrir ' + item.title">Revisar</a>
                  </li>
                }
              </ul>
            }
          </section>

          <section class="card dash-panel" aria-labelledby="dash-activity-title">
            <div class="dash-panel-head">
              <p class="dash-section-kicker">Actividad reciente</p>
              <h2 id="dash-activity-title">Sistema en movimiento</h2>
              <p class="dash-panel-sub muted">Últimas ventas y movimientos disponibles desde los endpoints actuales.</p>
            </div>
            @if (loading()) {
              <p class="dash-kpi-loading"><span class="spinner" aria-hidden="true"></span> Cargando actividad…</p>
            } @else if (metricUnavailable('ventasRecientes') && metricUnavailable('movimientos')) {
              <p class="dash-data-note">Actividad reciente no disponible en este momento.</p>
            } @else if (activityFeed().length === 0) {
              <p class="muted dash-empty-quick">Aún no hay actividad reciente visible para este período.</p>
            } @else {
              <ol class="dash-activity-list">
                @for (item of activityFeed(); track item.kind + item.title + item.date) {
                  <li>
                    <a class="dash-activity-item" [routerLink]="item.link">
                      <span class="dash-activity-dot" [class.dash-activity-dot--sales]="item.tone === 'sales'" aria-hidden="true"></span>
                      <span class="dash-activity-copy">
                        <span class="dash-activity-kind">{{ item.kind }}</span>
                        <strong>{{ item.title }}</strong>
                        <span class="muted">{{ item.detail }}</span>
                      </span>
                      <time class="muted" [dateTime]="item.date">{{ item.date | date: 'short' }}</time>
                      <span class="dash-activity-arrow" aria-hidden="true">→</span>
                    </a>
                  </li>
                }
              </ol>
            }
          </section>
        </div>

        <aside class="dash-right stack">
          <app-dismissible-hint hintId="dashboard.quickActions" persist="local">
            <section class="card card--info dash-panel" aria-labelledby="dash-quick-title">
              <div class="dash-panel-head">
                <p class="dash-section-kicker">Acción rápida</p>
                <h2 id="dash-quick-title">Atajos de supervisión</h2>
                <p class="dash-panel-sub muted">Accesos filtrados por rol y plan, priorizados para administración.</p>
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
          </app-dismissible-hint>

          <section class="card dash-panel" aria-labelledby="dash-snapshot-title">
            <div class="dash-panel-head">
              <p class="dash-section-kicker">Snapshot</p>
              <h2 id="dash-snapshot-title">Cobertura del sistema</h2>
              <p class="dash-panel-sub muted">Visión compacta de maestros y módulos con datos reales disponibles.</p>
            </div>
            <div class="dash-snapshot-grid">
              @for (item of snapshotItems(); track item.label) {
                <div class="dash-snapshot-item">
                  <span class="dash-snapshot-value">{{ item.value }}</span>
                  <span class="muted">{{ item.label }}</span>
                </div>
              }
            </div>
          </section>

          <app-dismissible-hint hintId="dashboard.workflowRecommended" persist="local">
            <section class="card dash-panel dash-flow-panel" aria-labelledby="dash-flow-title">
              <div class="dash-panel-head">
                <p class="dash-section-kicker">Guía ejecutiva</p>
                <h2 id="dash-flow-title">Ruta de control</h2>
                <p class="dash-panel-sub muted">Orden sugerido para mantener operación y trazabilidad sanas.</p>
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
          </app-dismissible-hint>
        </aside>
      </section>

      <section class="dash-footnote card card--info" aria-label="Límites de datos del dashboard">
        <strong>Datos reales, sin estimaciones inventadas.</strong>
        <span class="muted">
          El panel usa endpoints existentes. Métricas como rentabilidad, margen, usuarios activos por sesión o salud del sistema requieren soporte backend específico.
        </span>
      </section>
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
    .dash-status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.85rem;
    }
    .dash-status-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.6rem;
      border: 1px solid var(--border-subtle);
      border-radius: 999px;
      background: var(--bg-panel);
      color: var(--muted);
      font-size: 0.76rem;
      font-weight: 700;
    }
    .dash-status-chip--warn {
      border-color: color-mix(in srgb, var(--danger) 42%, var(--border-subtle));
      background: color-mix(in srgb, var(--danger) 12%, var(--bg-panel));
      color: var(--text);
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
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--accent-bright);
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
    .dash-command-grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 0.75rem;
      margin-top: 0.35rem;
    }
    .dash-kpi {
      grid-column: span 3;
      padding: 0.9rem;
      min-height: 9.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-color: color-mix(in srgb, var(--border) 86%, var(--accent));
    }
    .dash-kpi--primary {
      grid-column: span 4;
      min-height: 10rem;
      border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
    }
    .dash-kpi--unavailable {
      border-style: dashed;
      background: color-mix(in srgb, var(--bg-panel) 72%, var(--surface2));
    }
    .dash-kpi-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.15rem;
    }
    .dash-kpi-ico {
      font-size: 1.15rem;
      line-height: 1;
    }
    .dash-kpi-label {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dash-kpi-value {
      display: block;
      margin-top: 0.35rem;
      font-size: clamp(1.4rem, 3vw, 2rem);
      line-height: 1;
      letter-spacing: -0.04em;
      font-variant-numeric: tabular-nums;
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
    .dash-kpi--warn .dash-kpi-value,
    .dash-kpi--danger .dash-kpi-value {
      color: var(--danger);
    }
    .dash-kpi--unavailable .dash-kpi-value {
      color: var(--muted);
    }
    .dash-main-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(19rem, 0.75fr);
      gap: 1rem;
      align-items: start;
    }
    .dash-left,
    .dash-right {
      min-width: 0;
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
    .dash-section-kicker {
      margin: 0 0 0.25rem;
      color: var(--muted);
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
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
    .dash-attention-list,
    .dash-activity-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }
    .dash-attention-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.75rem;
      border: 1px solid color-mix(in srgb, var(--danger) 32%, var(--border-subtle));
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--danger) 8%, var(--bg-panel));
    }
    .dash-attention-item--ok {
      border-color: color-mix(in srgb, var(--ok) 36%, var(--border-subtle));
      background: color-mix(in srgb, var(--ok) 7%, var(--bg-panel));
    }
    .dash-attention-item--warning {
      border-color: color-mix(in srgb, var(--accent) 34%, var(--border-subtle));
      background: color-mix(in srgb, var(--accent-soft) 42%, var(--bg-panel));
    }
    .dash-attention-item--danger {
      border-color: color-mix(in srgb, var(--danger) 52%, var(--border));
    }
    .dash-attention-ico {
      font-size: 1.15rem;
    }
    .dash-attention-copy {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      font-size: 0.88rem;
    }
    .dash-attention-item a {
      color: var(--accent-bright);
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
    }
    .dash-attention-clear {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      padding: 0.8rem;
      border: 1px solid color-mix(in srgb, var(--ok) 24%, var(--border-subtle));
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--ok) 5%, var(--bg-panel));
    }
    .dash-attention-clear span:last-child {
      font-size: 0.88rem;
    }
    .dash-activity-item {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: 0.75rem;
      align-items: start;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text);
      text-decoration: none;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    .dash-activity-list li:last-child .dash-activity-item {
      border-bottom: 0;
      padding-bottom: 0;
    }
    .dash-activity-item:hover {
      color: var(--text);
      background: color-mix(in srgb, var(--accent-soft) 35%, transparent);
      transform: translateX(2px);
      text-decoration: none;
    }
    .dash-activity-item:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
      border-radius: var(--radius-sm);
    }
    .dash-activity-dot {
      width: 0.7rem;
      height: 0.7rem;
      margin-top: 0.28rem;
      border-radius: 999px;
      background: var(--accent-bright);
      box-shadow: 0 0 0 4px var(--accent-soft);
    }
    .dash-activity-dot--sales {
      background: var(--ok);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--ok) 14%, transparent);
    }
    .dash-activity-copy {
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
      min-width: 0;
      font-size: 0.88rem;
    }
    .dash-activity-kind {
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dash-activity-item time {
      font-size: 0.72rem;
      white-space: nowrap;
    }
    .dash-activity-arrow {
      color: var(--muted);
      font-weight: 800;
      transition: transform 0.15s ease, color 0.15s ease;
    }
    .dash-activity-item:hover .dash-activity-arrow {
      color: var(--accent-bright);
      transform: translateX(3px);
    }
    .dash-data-state,
    .dash-data-note {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      padding: 0.22rem 0.5rem;
      border-radius: 999px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-panel);
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 700;
    }
    .dash-data-note {
      margin: 0;
      border-radius: var(--radius-sm);
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
    .dash-snapshot-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.55rem;
    }
    .dash-snapshot-item {
      padding: 0.7rem;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      background: var(--bg-panel);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .dash-snapshot-value {
      color: var(--text);
      font-size: 1.15rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    @media (max-width: 1100px) {
      .dash-command-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .dash-kpi,
      .dash-kpi--primary {
        grid-column: span 1;
      }
      .dash-main-grid {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 768px) {
      .dash-command-grid,
      .dash-snapshot-grid {
        grid-template-columns: 1fr;
      }
      .dash-attention-item,
      .dash-activity-item {
        grid-template-columns: auto minmax(0, 1fr);
      }
      .dash-attention-item a,
      .dash-activity-item time,
      .dash-activity-arrow {
        grid-column: 2;
      }
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
  private readonly productoApi = inject(ProductoService);
  private readonly bodegaApi = inject(BodegaService);
  private readonly proveedorApi = inject(ProveedorService);
  private readonly clienteApi = inject(ClienteApiService);
  private readonly ventaApi = inject(VentaApiService);
  private readonly movimientoApi = inject(MovimientoApiService);
  private readonly empresaApi = inject(EmpresaActualService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly totalInventario = signal(0);
  readonly alertasCount = signal(0);
  readonly totalProductos = signal(0);
  readonly totalBodegas = signal(0);
  readonly totalProveedores = signal(0);
  readonly totalClientes = signal(0);
  readonly ventasResumen = signal<VentaPanelResumen | null>(null);
  readonly ventasPendientesAnulacion = signal(0);
  readonly ventasCanceladasSinPago = signal(0);
  readonly movimientosRecientes = signal<MovimientoList[]>([]);
  readonly ventasRecientes = signal<VentaListItem[]>([]);
  readonly dataErrors = signal<Set<DashboardDataKey>>(new Set());
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
      text: 'Cargar existencias de partida (administración o auxiliar de bodega, según permisos).'
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
    ventas: 'POS e historial',
    abastecimiento: 'Reposición y alertas',
    productos: 'Alta y catálogo',
    entrada: 'Ingreso a bodega',
    salida: 'Egreso de bodega',
    inventario: 'Existencias y alertas',
    bodegas: 'Ubicaciones de stock',
    proveedores: 'Red de suministro',
    kardex: 'Trazabilidad',
    'stock-inicial': 'Carga masiva inicial'
  };

  readonly executiveKpis = computed<DashboardKpi[]>(() => {
    const ventas = this.ventasResumen();
    return [
      {
        label: 'Ventas hoy',
        value: this.metricUnavailable('ventasResumen') ? '—' : this.formatCurrency(ventas?.totalVendidoHoy ?? 0),
        hint: this.metricUnavailable('ventasResumen')
          ? 'Resumen comercial no disponible en este momento.'
          : `${ventas?.ventasHoy ?? 0} ventas · ${ventas?.unidadesVendidasHoy ?? 0} unidades`,
        icon: '💳',
        link: ['/app', 'ventas'],
        tone: 'success',
        priority: 'primary',
        state: this.metricState('ventasResumen')
      },
      {
        label: 'Últimos 7 días',
        value: this.metricUnavailable('ventasResumen') ? '—' : ventas?.ventasUltimos7Dias ?? 0,
        hint: this.metricUnavailable('ventasResumen')
          ? 'Resumen comercial no disponible en este momento.'
          : 'Ventas registradas en la última semana.',
        icon: '📈',
        link: ['/app', 'ventas'],
        priority: 'secondary',
        state: this.metricState('ventasResumen')
      },
      {
        label: 'Bajo mínimo',
        value: this.metricUnavailable('alertas') ? '—' : this.alertasCount(),
        hint: this.metricUnavailable('alertas')
          ? 'Alertas de inventario no disponibles en este momento.'
          : 'Productos que requieren revisión de abastecimiento.',
        icon: '⚠️',
        link: ['/app', 'inventario'],
        tone: this.metricUnavailable('alertas') || this.alertasCount() > 0 ? 'warning' : 'success',
        priority: 'primary',
        state: this.metricState('alertas')
      },
      {
        label: 'Inventario',
        value: this.metricUnavailable('inventario') ? '—' : this.totalInventario(),
        hint: this.metricUnavailable('inventario')
          ? 'Inventario no disponible en este momento.'
          : 'Líneas de inventario con stock registrado.',
        icon: '📊',
        link: ['/app', 'inventario'],
        priority: 'secondary',
        state: this.metricState('inventario')
      },
      {
        label: 'Productos',
        value: this.metricUnavailable('productos') ? '—' : this.totalProductos(),
        hint: this.metricUnavailable('productos')
          ? 'Catálogo no disponible en este momento.'
          : 'Catálogo registrado en el sistema.',
        icon: '📦',
        link: ['/app', 'productos'],
        priority: 'secondary',
        state: this.metricState('productos')
      },
      {
        label: 'Bodegas',
        value: this.metricUnavailable('bodegas') ? '—' : this.totalBodegas(),
        hint: this.metricUnavailable('bodegas')
          ? 'Ubicaciones no disponibles en este momento.'
          : 'Ubicaciones operativas configuradas.',
        icon: '🏭',
        link: ['/app', 'bodegas'],
        priority: 'secondary',
        state: this.metricState('bodegas')
      },
      {
        label: 'Proveedores',
        value: this.metricUnavailable('proveedores') ? '—' : this.totalProveedores(),
        hint: this.metricUnavailable('proveedores')
          ? 'Proveedores no disponibles en este momento.'
          : 'Contactos de abastecimiento disponibles.',
        icon: '🤝',
        link: ['/app', 'proveedores'],
        priority: 'secondary',
        state: this.metricState('proveedores')
      },
      {
        label: 'Seguimiento',
        value:
          this.metricUnavailable('ventasAnulacion') || this.metricUnavailable('ventasCanceladas')
            ? '—'
            : this.ventasPendientesAnulacion() + this.ventasCanceladasSinPago(),
        hint:
          this.metricUnavailable('ventasAnulacion') || this.metricUnavailable('ventasCanceladas')
            ? 'Seguimiento de ventas no disponible en este momento.'
            : 'Ventas con anulación solicitada o canceladas sin pago.',
        icon: '🧭',
        link: ['/app', 'ventas'],
        tone:
          this.metricUnavailable('ventasAnulacion') || this.metricUnavailable('ventasCanceladas')
            ? 'warning'
            : this.ventasPendientesAnulacion() > 0
              ? 'danger'
              : 'default',
        priority: 'primary',
        state:
          this.metricUnavailable('ventasAnulacion') || this.metricUnavailable('ventasCanceladas')
            ? 'unavailable'
            : 'available'
      }
    ];
  });

  readonly attentionItems = computed<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (this.metricUnavailable('alertas')) {
      items.push({
        title: 'Alertas de inventario no disponibles',
        detail: 'No se pudo confirmar si existen productos bajo mínimo.',
        icon: '!',
        link: ['/app', 'inventario'],
        severity: 'warning'
      });
    } else if (this.alertasCount() > 0) {
      items.push({
        title: `${this.alertasCount()} productos bajo mínimo`,
        detail: 'Revisar reposición y cobertura de stock.',
        icon: '⚠️',
        link: ['/app', 'abastecimiento'],
        severity: 'danger'
      });
    }
    if (this.metricUnavailable('ventasAnulacion') || this.metricUnavailable('ventasCanceladas')) {
      items.push({
        title: 'Seguimiento de ventas no disponible',
        detail: 'No se pudo confirmar el estado de anulaciones o cancelaciones sin pago.',
        icon: '!',
        link: ['/app', 'ventas'],
        severity: 'warning'
      });
    }
    if (this.ventasPendientesAnulacion() > 0) {
      items.push({
        title: `${this.ventasPendientesAnulacion()} ventas con anulación solicitada`,
        detail: 'Requieren revisión administrativa antes de cerrar seguimiento.',
        icon: '🧾',
        link: ['/app', 'ventas'],
        severity: 'warning'
      });
    }
    if (this.ventasCanceladasSinPago() > 0) {
      items.push({
        title: `${this.ventasCanceladasSinPago()} ventas canceladas sin pago`,
        detail: 'Útiles para auditar intentos de cobro no completados.',
        icon: '⏱️',
        link: ['/app', 'ventas'],
        severity: 'warning'
      });
    }
    if (this.metricUnavailable('movimientos')) {
      items.push({
        title: 'Movimientos recientes no disponibles',
        detail: 'No se pudo cargar la ventana operativa de movimientos.',
        icon: '!',
        link: ['/app', 'movimientos'],
        severity: 'warning'
      });
    }
    return items.slice(0, 4);
  });

  readonly activityFeed = computed<ActivityItem[]>(() => {
    const sales = this.ventasRecientes().map((venta) => ({
      kind: 'Venta' as const,
      title: `${venta.codigoPublico} · ${this.formatCurrency(venta.total)}`,
      detail: `${venta.estado} · ${venta.bodegaNombre}`,
      date: venta.fechaVenta,
      link: ['/app', 'ventas', 'detalle', String(venta.id)],
      tone: 'sales' as const
    }));
    const movements = this.movimientosRecientes().map((mov) => ({
      kind: 'Movimiento' as const,
      title: `${this.movimientoLabel(mov.tipoMovimiento)} · ${mov.totalLineas} líneas`,
      detail: `${mov.estado}${mov.usuarioEmail ? ' · ' + mov.usuarioEmail : ''}`,
      date: mov.fechaMovimiento,
      link: ['/app', 'movimientos', 'detalle', String(mov.id)],
      tone: 'stock' as const
    }));
    return [...sales, ...movements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  });

  readonly snapshotItems = computed(() => [
    { label: 'Clientes', value: this.metricUnavailable('clientes') ? '—' : this.totalClientes() },
    { label: 'Productos', value: this.metricUnavailable('productos') ? '—' : this.totalProductos() },
    { label: 'Bodegas', value: this.metricUnavailable('bodegas') ? '—' : this.totalBodegas() },
    { label: 'Proveedores', value: this.metricUnavailable('proveedores') ? '—' : this.totalProveedores() },
    { label: 'Ventas hoy', value: this.metricUnavailable('ventasResumen') ? '—' : this.ventasResumen()?.ventasHoy ?? 0 },
    { label: 'Mov. recientes', value: this.metricUnavailable('movimientos') ? '—' : this.movimientosRecientes().length }
  ]);

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
    this.loadDashboard();
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

  planModulesLabel(): string {
    const mods = this.planModules();
    if (!mods) return 'cargando';
    if (mods.size === 0) return 'sin módulos';
    return `${mods.size} módulos`;
  }

  metricUnavailable(key: DashboardDataKey): boolean {
    return this.dataErrors().has(key);
  }

  private loadDashboard(): void {
    const { desde, hasta } = this.dateWindow();
    forkJoin({
      inventario: this.inventarioApi.list(0, 1).pipe(catchError(() => of(null))),
      alertas: this.inventarioApi.alertas().pipe(catchError(() => of(null))),
      productos: this.productoApi.list(0, 1).pipe(catchError(() => of(null))),
      bodegas: this.bodegaApi.list().pipe(catchError(() => of(null))),
      proveedores: this.proveedorApi.list().pipe(catchError(() => of(null))),
      clientes: this.clienteApi.list(0, 1).pipe(catchError(() => of(null))),
      ventasResumen: this.ventaApi.panelResumen().pipe(catchError(() => of(null))),
      ventasRecientes: this.ventaApi.list(0, 4).pipe(catchError(() => of(null))),
      ventasAnulacion: this.ventaApi.list(0, 1, { estado: 'ANULACION_SOLICITADA' }).pipe(catchError(() => of(null))),
      ventasCanceladas: this.ventaApi.list(0, 1, { estado: 'CANCELADA_SIN_PAGO' }).pipe(catchError(() => of(null))),
      movimientos: this.movimientoApi.historial(desde, hasta, 0, 4).pipe(catchError(() => of(null)))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const errors = new Set<DashboardDataKey>();
        if (!data.inventario) errors.add('inventario');
        if (!data.alertas) errors.add('alertas');
        if (!data.productos) errors.add('productos');
        if (!data.bodegas) errors.add('bodegas');
        if (!data.proveedores) errors.add('proveedores');
        if (!data.clientes) errors.add('clientes');
        if (!data.ventasResumen) errors.add('ventasResumen');
        if (!data.ventasRecientes) errors.add('ventasRecientes');
        if (!data.ventasAnulacion) errors.add('ventasAnulacion');
        if (!data.ventasCanceladas) errors.add('ventasCanceladas');
        if (!data.movimientos) errors.add('movimientos');
        this.dataErrors.set(errors);

        this.totalInventario.set(data.inventario?.totalElements ?? 0);
        this.alertasCount.set(data.alertas?.length ?? 0);
        this.totalProductos.set(data.productos?.totalElements ?? 0);
        this.totalBodegas.set(data.bodegas?.length ?? 0);
        this.totalProveedores.set(data.proveedores?.length ?? 0);
        this.totalClientes.set(data.clientes?.totalElements ?? 0);
        this.ventasResumen.set(data.ventasResumen);
        this.ventasRecientes.set(data.ventasRecientes?.content ?? []);
        this.ventasPendientesAnulacion.set(data.ventasAnulacion?.totalElements ?? 0);
        this.ventasCanceladasSinPago.set(data.ventasCanceladas?.totalElements ?? 0);
        this.movimientosRecientes.set(data.movimientos?.content ?? []);
        this.loading.set(false);
      });
  }

  private dateWindow(): { desde: string; hasta: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);
    return { desde: this.toIsoDate(start), hasta: this.toIsoDate(end) };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  }

  private metricState(key: DashboardDataKey): 'available' | 'unavailable' {
    return this.metricUnavailable(key) ? 'unavailable' : 'available';
  }

  private movimientoLabel(tipo: string): string {
    return tipo
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
