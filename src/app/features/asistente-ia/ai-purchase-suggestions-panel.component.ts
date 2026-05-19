import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiAssistantService } from '../../core/api/ai-assistant.service';
import type { AiPurchaseSuggestion, AiPurchaseSuggestionStatus } from '../../core/api/ai-assistant.models';

@Component({
  selector: 'app-ai-purchase-suggestions-panel',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <section class="purchase-panel stack">
      <header class="purchase-head">
        <div>
          <h2 class="purchase-title">Sugerencias de compra</h2>
          <p class="purchase-sub muted">
            Revisa borradores creados desde recomendaciones RESTOCK aceptadas. Aprobar no mueve inventario.
          </p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="loading()" (click)="load()">
          Actualizar
        </button>
      </header>

      <div class="purchase-filters" role="tablist" aria-label="Filtrar sugerencias por estado">
        @for (st of statuses; track st) {
          <button
            type="button"
            role="tab"
            class="purchase-filter"
            [class.purchase-filter--active]="statusFilter() === st"
            [attr.aria-selected]="statusFilter() === st"
            (click)="setStatus(st)"
          >
            {{ statusLabel(st) }}
          </button>
        }
      </div>

      @if (panelMessage()) {
        <p class="panel-ok">{{ panelMessage() }}</p>
      }

      @if (loading()) {
        <p class="muted subtle-pad">Cargando sugerencias...</p>
      } @else if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      } @else if (rows().length === 0) {
        <p class="muted subtle-pad empty-copy">No hay sugerencias para este estado.</p>
      } @else {
        <ul class="purchase-list">
          @for (row of rows(); track row.id) {
            <li class="purchase-card">
              <div class="purchase-card__top">
                <span class="badge badge-status">{{ row.status }}</span>
                @if (row.priority) {
                  <span class="badge badge-prio">{{ row.priority }}</span>
                }
                @if (row.sourceRecommendationId) {
                  <span class="badge badge-type">Reco #{{ row.sourceRecommendationId }}</span>
                }
              </div>

              <h3 class="purchase-card__title">{{ row.productName || 'Producto sin nombre' }}</h3>

              <dl class="purchase-meta">
                <div class="purchase-meta-row">
                  <dt>Producto ID</dt>
                  <dd>{{ row.productId || '-' }}</dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Bodega</dt>
                  <dd>
                    @if (row.status === 'DRAFT') {
                      <input class="input input-sm" [(ngModel)]="editState(row.id).warehouseName" />
                    } @else {
                      {{ row.warehouseName || '-' }}
                    }
                  </dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Stock actual</dt>
                  <dd>{{ row.currentStock ?? '-' }}</dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Stock minimo</dt>
                  <dd>{{ row.minimumStock ?? '-' }}</dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Vendidas 30 dias</dt>
                  <dd>{{ row.quantitySoldLast30Days ?? '-' }}</dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Cantidad sugerida</dt>
                  <dd>
                    @if (row.status === 'DRAFT') {
                      <input
                        class="input input-qty"
                        type="number"
                        min="1"
                        step="1"
                        [(ngModel)]="editState(row.id).suggestedQuantity"
                      />
                    } @else {
                      {{ row.suggestedQuantity | number: '1.0-0' }}
                    }
                  </dd>
                </div>
                <div class="purchase-meta-row purchase-meta-row--wide">
                  <dt>Notas</dt>
                  <dd>
                    @if (row.status === 'DRAFT') {
                      <textarea class="textarea" rows="2" [(ngModel)]="editState(row.id).notes"></textarea>
                    } @else {
                      {{ row.notes || '-' }}
                    }
                  </dd>
                </div>
                <div class="purchase-meta-row">
                  <dt>Creada</dt>
                  <dd>{{ row.createdAt | date: 'medium' }}</dd>
                </div>
                @if (row.createdByName) {
                  <div class="purchase-meta-row">
                    <dt>Creada por</dt>
                    <dd>{{ row.createdByName }}</dd>
                  </div>
                }
                @if (row.approvedAt) {
                  <div class="purchase-meta-row">
                    <dt>Aprobada</dt>
                    <dd>{{ row.approvedAt | date: 'medium' }}</dd>
                  </div>
                }
                @if (row.dismissedAt) {
                  <div class="purchase-meta-row">
                    <dt>Descartada</dt>
                    <dd>{{ row.dismissedAt | date: 'medium' }}</dd>
                  </div>
                }
              </dl>

              <div class="purchase-actions">
                @if (row.status === 'DRAFT') {
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="save(row)"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="approve(row.id)"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    [disabled]="actionBusyId() === row.id"
                    (click)="dismiss(row.id)"
                  >
                    Descartar
                  </button>
                } @else {
                  <span class="muted read-only-hint">Solo lectura</span>
                }
              </div>

              @if (messageId() === row.id && message()) {
                <p class="action-ok">{{ message() }}</p>
              }
              @if (actionErrorId() === row.id && actionErrorMsg()) {
                <p class="action-err">{{ actionErrorMsg() }}</p>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .purchase-panel.stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .purchase-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    .purchase-title {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .purchase-sub {
      margin: 0;
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .muted {
      color: var(--muted);
    }
    .purchase-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .purchase-filter {
      border: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 90%, transparent);
      color: var(--text);
      border-radius: var(--radius-sm);
      padding: 0.35rem 0.65rem;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }
    .purchase-filter:hover,
    .purchase-filter--active {
      border-color: var(--accent-bright);
      color: var(--accent-bright);
      background: color-mix(in srgb, var(--accent-soft) 100%, transparent);
    }
    .purchase-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .purchase-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1rem;
      background: color-mix(in srgb, var(--surface) 92%, var(--bg-panel));
    }
    .purchase-card__top,
    .purchase-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      align-items: center;
    }
    .purchase-card__top {
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
    .purchase-card__title {
      margin: 0 0 0.65rem;
      font-size: 1rem;
      font-weight: 650;
    }
    .purchase-meta {
      margin: 0 0 0.75rem;
      display: grid;
      gap: 0.45rem;
    }
    .purchase-meta-row {
      display: grid;
      grid-template-columns: 9rem minmax(0, 1fr);
      gap: 0.5rem;
      font-size: 0.82rem;
      align-items: start;
    }
    .purchase-meta-row dt {
      margin: 0;
      color: var(--muted);
      font-weight: 600;
    }
    .purchase-meta-row dd {
      margin: 0;
      min-width: 0;
    }
    .input,
    .textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--bg);
      color: var(--text);
      font: inherit;
    }
    .input {
      min-height: 2rem;
      padding: 0.3rem 0.45rem;
    }
    .input-qty {
      max-width: 8rem;
    }
    .textarea {
      padding: 0.4rem 0.5rem;
      resize: vertical;
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
    .subtle-pad,
    .empty-copy,
    .read-only-hint {
      font-size: 0.9rem;
    }
    .action-err,
    .action-ok,
    .panel-ok {
      margin: 0.35rem 0 0;
      font-size: 0.78rem;
    }
    .action-err {
      color: #b91c1c;
    }
    .action-ok,
    .panel-ok {
      color: #047857;
    }
    @media (max-width: 640px) {
      .purchase-meta-row {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class AiPurchaseSuggestionsPanelComponent implements OnInit {
  private readonly ai = inject(AiAssistantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses: AiPurchaseSuggestionStatus[] = ['DRAFT', 'APPROVED', 'DISMISSED'];
  readonly statusFilter = signal<AiPurchaseSuggestionStatus>('DRAFT');
  readonly rows = signal<AiPurchaseSuggestion[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionBusyId = signal<number | null>(null);
  readonly actionErrorId = signal<number | null>(null);
  readonly actionErrorMsg = signal<string | null>(null);
  readonly messageId = signal<number | null>(null);
  readonly message = signal<string | null>(null);
  readonly panelMessage = signal<string | null>(null);

  private readonly edits = new Map<number, { suggestedQuantity: number; notes: string; warehouseName: string }>();

  ngOnInit(): void {
    this.load();
    this.ai.pendingRecommendationsRefresh$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  statusLabel(status: AiPurchaseSuggestionStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'APPROVED':
        return 'Approved';
      case 'DISMISSED':
        return 'Dismissed';
      case 'PENDING_REVIEW':
        return 'Pending review';
      default:
        return status;
    }
  }

  setStatus(status: AiPurchaseSuggestionStatus): void {
    this.statusFilter.set(status);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ai.getPurchaseSuggestions(this.statusFilter()).subscribe({
      next: (rows) => {
        const list = Array.isArray(rows) ? rows : [];
        this.rows.set(list);
        this.seedEdits(list);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.errorMessage(err, 'No se pudieron cargar las sugerencias de compra.'));
        this.loading.set(false);
      }
    });
  }

  editState(id: number): { suggestedQuantity: number; notes: string; warehouseName: string } {
    const found = this.edits.get(id);
    if (found) {
      return found;
    }
    const row = this.rows().find((r) => r.id === id);
    const state = {
      suggestedQuantity: row?.suggestedQuantity ?? 1,
      notes: row?.notes ?? '',
      warehouseName: row?.warehouseName ?? ''
    };
    this.edits.set(id, state);
    return state;
  }

  save(row: AiPurchaseSuggestion): void {
    const edit = this.editState(row.id);
    this.clearMessages();
    if (!Number.isInteger(Number(edit.suggestedQuantity)) || Number(edit.suggestedQuantity) <= 0) {
      this.actionErrorId.set(row.id);
      this.actionErrorMsg.set('La cantidad debe ser un entero mayor que cero.');
      return;
    }
    this.actionBusyId.set(row.id);
    this.ai
      .updatePurchaseSuggestion(row.id, {
        suggestedQuantity: Number(edit.suggestedQuantity),
        notes: edit.notes,
        warehouseName: edit.warehouseName
      })
      .pipe(finalize(() => this.actionBusyId.set(null)))
      .subscribe({
        next: (updated) => {
          this.replaceRow(updated);
          this.messageId.set(row.id);
          this.message.set('Cantidad actualizada');
        },
        error: (err: unknown) => {
          this.actionErrorId.set(row.id);
          this.actionErrorMsg.set(this.errorMessage(err, 'No se pudo actualizar la sugerencia.'));
        }
      });
  }

  approve(id: number): void {
    this.runAction(id, () => this.ai.approvePurchaseSuggestion(id), 'Sugerencia aprobada');
  }

  dismiss(id: number): void {
    this.runAction(id, () => this.ai.dismissPurchaseSuggestion(id), 'Sugerencia descartada');
  }

  private runAction(
    id: number,
    fn: () => ReturnType<AiAssistantService['approvePurchaseSuggestion']>,
    success: string
  ): void {
    this.clearMessages();
    this.actionBusyId.set(id);
    fn()
      .pipe(finalize(() => this.actionBusyId.set(null)))
      .subscribe({
        next: (res) => {
          this.replaceRow(res.suggestion);
          this.messageId.set(id);
          this.message.set(success);
          this.panelMessage.set(success);
          this.load();
        },
        error: (err: unknown) => {
          this.actionErrorId.set(id);
          this.actionErrorMsg.set(this.errorMessage(err, 'No se pudo gestionar la sugerencia de compra.'));
        }
      });
  }

  private seedEdits(rows: AiPurchaseSuggestion[]): void {
    this.edits.clear();
    for (const row of rows) {
      this.edits.set(row.id, {
        suggestedQuantity: row.suggestedQuantity,
        notes: row.notes ?? '',
        warehouseName: row.warehouseName ?? ''
      });
    }
  }

  private replaceRow(updated: AiPurchaseSuggestion): void {
    this.rows.set(this.rows().map((row) => (row.id === updated.id ? updated : row)));
    this.edits.set(updated.id, {
      suggestedQuantity: updated.suggestedQuantity,
      notes: updated.notes ?? '',
      warehouseName: updated.warehouseName ?? ''
    });
  }

  private clearMessages(): void {
    this.actionErrorId.set(null);
    this.actionErrorMsg.set(null);
    this.messageId.set(null);
    this.message.set(null);
    this.panelMessage.set(null);
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && err.status === 403) {
      return 'No tienes permiso para gestionar sugerencias de compra';
    }
    if (err instanceof HttpErrorResponse) {
      const detail = String(err.error?.detail ?? err.error?.message ?? '').trim();
      if (detail) {
        return detail;
      }
    }
    return fallback;
  }
}
