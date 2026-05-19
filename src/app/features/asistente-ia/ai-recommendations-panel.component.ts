import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, type Observable } from 'rxjs';
import { AiAssistantService } from '../../core/api/ai-assistant.service';
import type { AiRecommendation, AiRecommendationStatus } from '../../core/api/ai-assistant.models';

@Component({
  selector: 'app-ai-recommendations-panel',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <section class="reco-panel stack">
      <header class="reco-head">
        <div>
          <h2 class="reco-title">Recomendaciones IA</h2>
          <p class="reco-sub muted">
            Gestioná sugerencias persistidas por el servidor. Ejecutar solo actualiza el estado en la API.
          </p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="loading()" (click)="load()">
          Actualizar
        </button>
      </header>

      <div class="reco-filters" role="tablist" aria-label="Filtrar por estado">
        @for (st of statuses; track st) {
          <button
            type="button"
            role="tab"
            class="reco-filter"
            [class.reco-filter--active]="statusFilter() === st"
            [attr.aria-selected]="statusFilter() === st"
            (click)="setStatus(st)"
          >
            {{ statusLabel(st) }}
          </button>
        }
      </div>

      @if (loading()) {
        <p class="muted subtle-pad">Cargando recomendaciones…</p>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (rows().length === 0) {
        <p class="muted subtle-pad empty-copy">No hay recomendaciones para este estado.</p>
      } @else {
        <ul class="reco-list">
          @for (row of rows(); track row.id) {
            <li class="reco-card">
              <div class="reco-card__top">
                <span class="badge badge-status">{{ row.status }}</span>
                @if (row.priority) {
                  <span class="badge badge-prio">{{ row.priority }}</span>
                }
                <span class="badge badge-type">{{ row.code }}</span>
              </div>
              @if (row.title) {
                <h3 class="reco-card__title">{{ row.title }}</h3>
              }
              @if (row.detail) {
                <p class="reco-card__detail">{{ row.detail }}</p>
              }
              @if (previewEntries(row).length > 0) {
                <dl class="reco-meta reco-preview">
                  @for (e of previewEntries(row); track e.key + e.value) {
                    <div class="reco-meta-row">
                      <dt>{{ e.label }}</dt>
                      <dd>{{ e.value }}</dd>
                    </div>
                  }
                </dl>
              }
              <dl class="reco-meta">
                @if (row.confidence !== null && row.confidence !== undefined) {
                  <div class="reco-meta-row">
                    <dt>Confianza</dt>
                    <dd>{{ row.confidence | number: '1.0-2' }}</dd>
                  </div>
                }
                <div class="reco-meta-row">
                  <dt>Creada</dt>
                  <dd>{{ row.createdAt | date: 'medium' }}</dd>
                </div>
                @if (row.chatIntent) {
                  <div class="reco-meta-row">
                    <dt>Intent chat</dt>
                    <dd>{{ row.chatIntent }}</dd>
                  </div>
                }
                @if (row.usedContext !== null && row.usedContext !== undefined) {
                  <div class="reco-meta-row">
                    <dt>Contexto enviado</dt>
                    <dd>{{ row.usedContext ? 'Sí' : 'No' }}</dd>
                  </div>
                }
              </dl>
              <div class="reco-actions">
                @if (row.status === 'PENDING') {
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="accept(row.id)"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="dismiss(row.id)"
                  >
                    Descartar
                  </button>
                } @else if (row.status === 'ACCEPTED') {
                  @if (isRestock(row)) {
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      [disabled]="actionBusyId() === row.id"
                      (click)="createPurchaseSuggestion(row.id)"
                    >
                      Crear sugerencia de compra
                    </button>
                  }
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="execute(row.id)"
                  >
                    Marcar como ejecutada
                  </button>
                } @else {
                  <span class="muted read-only-hint">Solo lectura</span>
                }
              </div>
              @if (actionErrorId() === row.id && actionErrorMsg()) {
                <p class="action-err">{{ actionErrorMsg() }}</p>
              }
              @if (actionSuccessId() === row.id && actionSuccessMsg()) {
                <p class="action-ok">{{ actionSuccessMsg() }}</p>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .reco-panel.stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .reco-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .reco-title {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .reco-sub {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .muted {
      color: var(--muted);
    }
    .reco-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .reco-filter {
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 90%, transparent);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
    }
    .reco-filter:hover {
      border-color: var(--accent);
      color: var(--accent-bright);
    }
    .reco-filter--active {
      border-color: var(--accent-bright);
      background: color-mix(in srgb, var(--accent-soft) 100%, transparent);
      color: var(--accent-bright);
    }
    .reco-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .reco-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem;
      background: color-mix(in srgb, var(--surface) 92%, var(--bg-panel));
    }
    .reco-card__top {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.15rem 0.45rem;
      border-radius: 999px;
      line-height: 1.2;
    }
    .badge-status {
      background: color-mix(in srgb, var(--accent-soft) 80%, transparent);
      color: var(--accent-bright);
    }
    .badge-prio {
      background: color-mix(in srgb, #f59e0b 22%, transparent);
      color: #b45309;
    }
    .badge-type {
      background: color-mix(in srgb, var(--border) 55%, transparent);
      color: var(--muted);
    }
    .reco-card__title {
      margin: 0 0 0.35rem;
      font-size: 1rem;
      font-weight: 650;
    }
    .reco-card__detail {
      margin: 0 0 0.65rem;
      font-size: 0.88rem;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .reco-preview {
      margin-bottom: 0.5rem;
      padding: 0.5rem 0.6rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--bg) 65%, transparent);
      border: 1px dashed color-mix(in srgb, var(--border) 80%, transparent);
    }
    .reco-meta {
      margin: 0 0 0.65rem;
      display: grid;
      gap: 0.35rem;
    }
    .reco-meta-row {
      display: grid;
      grid-template-columns: 8rem 1fr;
      gap: 0.5rem;
      font-size: 0.8rem;
    }
    .reco-meta-row dt {
      margin: 0;
      color: var(--muted);
      font-weight: 600;
    }
    .reco-meta-row dd {
      margin: 0;
    }
    .reco-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      align-items: center;
    }
    .read-only-hint {
      font-size: 0.82rem;
    }
    .btn-sm {
      font-size: 0.82rem;
      padding: 0.35rem 0.65rem;
    }
    .alert-error {
      border: 1px solid color-mix(in srgb, #ef4444 45%, var(--border));
      background: color-mix(in srgb, #ef4444 12%, transparent);
      color: var(--text);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.88rem;
    }
    .subtle-pad {
      padding: 0.35rem 0;
    }
    .empty-copy {
      font-size: 0.9rem;
    }
    .action-err {
      margin: 0.35rem 0 0;
      font-size: 0.78rem;
      color: #b91c1c;
    }
    .action-ok {
      margin: 0.35rem 0 0;
      font-size: 0.78rem;
      color: #047857;
    }
  `
})
export class AiRecommendationsPanelComponent implements OnInit {
  private readonly ai = inject(AiAssistantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: AiRecommendationStatus[] = ['PENDING', 'ACCEPTED', 'DISMISSED', 'EXECUTED'];
  readonly statusFilter = signal<AiRecommendationStatus>('PENDING');
  readonly rows = signal<AiRecommendation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionBusyId = signal<number | null>(null);
  readonly actionErrorId = signal<number | null>(null);
  readonly actionErrorMsg = signal<string | null>(null);
  readonly actionSuccessId = signal<number | null>(null);
  readonly actionSuccessMsg = signal<string | null>(null);

  private static readonly PREVIEW_MAX_LEN = 120;
  private static readonly ALLOWED_PREVIEW_KEYS = new Set<string>([
    'productId',
    'productName',
    'currentStock',
    'minimumStock',
    'quantitySoldLast30Days',
    'warehouseName',
    'priority',
    'riskLevel',
    'period',
    'movementType'
  ]);

  previewEntries(row: AiRecommendation): { key: string; label: string; value: string }[] {
    const mp = row.metadataPreview;
    if (mp && Object.keys(mp).length > 0) {
      return Object.entries(mp).map(([key, value]) => ({
        key,
        label: this.previewLabel(key),
        value
      }));
    }
    const meta = row.metadata;
    if (!meta || typeof meta !== 'object') {
      return [];
    }
    const out: { key: string; label: string; value: string }[] = [];
    const seen = new Set<string>();
    for (const [rawKey, val] of Object.entries(meta)) {
      const canon = this.canonicalPreviewKey(rawKey);
      if (!canon || seen.has(canon)) {
        continue;
      }
      if (!AiRecommendationsPanelComponent.ALLOWED_PREVIEW_KEYS.has(canon)) {
        continue;
      }
      const str = this.scalarToPreviewString(val);
      if (!str) {
        continue;
      }
      seen.add(canon);
      const clipped =
        str.length > AiRecommendationsPanelComponent.PREVIEW_MAX_LEN
          ? str.slice(0, AiRecommendationsPanelComponent.PREVIEW_MAX_LEN)
          : str;
      out.push({ key: canon, label: this.previewLabel(canon), value: clipped });
    }
    return out;
  }

  private previewLabel(key: string): string {
    const labels: Record<string, string> = {
      productId: 'Producto (ID)',
      productName: 'Producto',
      currentStock: 'Stock actual',
      minimumStock: 'Stock mínimo',
      quantitySoldLast30Days: 'Vendidas (últ. 30 días)',
      warehouseName: 'Bodega',
      priority: 'Prioridad',
      riskLevel: 'Riesgo',
      period: 'Periodo',
      movementType: 'Tipo de movimiento'
    };
    return labels[key] ?? key;
  }

  private canonicalPreviewKey(raw: string): string | null {
    const t = raw.trim();
    if (AiRecommendationsPanelComponent.ALLOWED_PREVIEW_KEYS.has(t)) {
      return t;
    }
    if (!t.includes('_')) {
      return null;
    }
    const camel = AiRecommendationsPanelComponent.snakeToCamelKey(t);
    return AiRecommendationsPanelComponent.ALLOWED_PREVIEW_KEYS.has(camel) ? camel : null;
  }

  private static snakeToCamelKey(snake: string): string {
    const parts = snake.split('_').filter((p) => p.length > 0);
    if (!parts.length) {
      return snake;
    }
    const head = parts[0].toLowerCase();
    const tail = parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join('');
    return head + tail;
  }

  private scalarToPreviewString(val: unknown): string | null {
    if (val === null || val === undefined) {
      return null;
    }
    if (typeof val === 'object') {
      return null;
    }
    if (typeof val === 'string') {
      const t = val.trim();
      return t.length ? t : null;
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    return null;
  }

  ngOnInit(): void {
    this.load();
    this.ai.pendingRecommendationsRefresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  statusLabel(s: AiRecommendationStatus): string {
    switch (s) {
      case 'PENDING':
        return 'Pendientes';
      case 'ACCEPTED':
        return 'Aceptadas';
      case 'DISMISSED':
        return 'Descartadas';
      case 'EXECUTED':
        return 'Ejecutadas';
      default:
        return s;
    }
  }

  setStatus(st: AiRecommendationStatus): void {
    this.statusFilter.set(st);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ai.getRecommendations(this.statusFilter()).subscribe({
      next: (list) => {
        this.rows.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las recomendaciones.');
        this.loading.set(false);
      }
    });
  }

  accept(id: number): void {
    this.runAction(id, () => this.ai.acceptRecommendation(id));
  }

  dismiss(id: number): void {
    this.runAction(id, () => this.ai.dismissRecommendation(id));
  }

  execute(id: number): void {
    this.runAction(id, () => this.ai.executeRecommendation(id));
  }

  createPurchaseSuggestion(id: number): void {
    this.runAction(id, () => this.ai.createPurchaseSuggestionFromRecommendation(id), {
      success: 'Sugerencia de compra creada para revisión.',
      duplicate: 'Ya existe una sugerencia de compra para esta recomendación.'
    });
  }

  isRestock(row: AiRecommendation): boolean {
    return typeof row.code === 'string' && row.code.trim().toUpperCase().startsWith('RESTOCK');
  }

  private runAction(
    id: number,
    fn: () => Observable<unknown>,
    messages?: { success?: string; duplicate?: string }
  ): void {
    this.actionErrorId.set(null);
    this.actionErrorMsg.set(null);
    this.actionSuccessId.set(null);
    this.actionSuccessMsg.set(null);
    this.actionBusyId.set(id);
    fn()
      .pipe(finalize(() => this.actionBusyId.set(null)))
      .subscribe({
        next: () => {
          if (messages?.success) {
            this.actionSuccessId.set(id);
            this.actionSuccessMsg.set(messages.success);
          }
          this.ai.notifyRecommendationsChanged();
        },
        error: (err: unknown) => {
          this.actionErrorId.set(id);
          this.actionErrorMsg.set(this.actionErrorMessage(err, messages));
        }
      });
  }

  private actionErrorMessage(err: unknown, messages?: { duplicate?: string }): string {
    const detail = err instanceof HttpErrorResponse ? String(err.error?.detail ?? err.error?.message ?? '') : '';
    if (err instanceof HttpErrorResponse && err.status === 409 && detail.toLowerCase().includes('ya existe')) {
      return messages?.duplicate ?? 'Ya existe una sugerencia de compra para esta recomendación.';
    }
    return 'No se pudo completar la acción.';
  }
}
