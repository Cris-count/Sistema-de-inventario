import { DecimalPipe, JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiAssistantService } from '../../core/api/ai-assistant.service';
import type { AIChatResponse } from '../../core/api/ai-assistant.models';
import { AiPurchaseSuggestionsPanelComponent } from './ai-purchase-suggestions-panel.component';
import { AiRecommendationsPanelComponent } from './ai-recommendations-panel.component';

const MAX_QUESTION = 1000;

@Component({
  selector: 'app-asistente-ia-page',
  standalone: true,
  imports: [FormsModule, AiRecommendationsPanelComponent, AiPurchaseSuggestionsPanelComponent, DecimalPipe, JsonPipe],
  template: `
    <div class="page stack ai-page">
      <header class="page-header">
        <h1>Asistente IA</h1>
        <p class="page-lead muted">
          Haz preguntas sobre inventario, stock, ventas, movimientos y recomendaciones.
        </p>
      </header>

      <section class="chat-card card">
        <h2 class="card-title">Preguntar al asistente</h2>

        <div class="chips" aria-label="Ejemplos de preguntas">
          @for (ex of examples; track ex) {
            <button type="button" class="chip" (click)="useExample(ex)">{{ ex }}</button>
          }
        </div>

        <label class="field">
          <span class="field-label">Tu pregunta</span>
          <textarea
            class="textarea"
            rows="4"
            name="question"
            [(ngModel)]="questionDraft"
            [maxlength]="maxQuestion"
            [disabled]="chatLoading()"
            placeholder="Escribí una pregunta en lenguaje natural…"
          ></textarea>
          <span class="char-count">{{ questionDraft.length }} / {{ maxQuestion }}</span>
        </label>

        @if (chatError()) {
          <div class="alert alert-error">{{ chatError() }}</div>
        }

        <div class="chat-actions">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="chatLoading() || !questionDraft.trim()"
            (click)="submit()"
          >
            @if (chatLoading()) {
              Enviando…
            } @else {
              Enviar
            }
          </button>
        </div>

        @if (chatResponse(); as res) {
          <div class="answer-block" [class.answer-block--warn]="res.intent === 'ai_unavailable'">
            <div class="answer-toolbar">
              <span class="badge badge-intent">{{ res.intent }}</span>
              @if (res.confidence !== null && res.confidence !== undefined) {
                <span class="badge badge-confidence">Confianza {{ res.confidence | number: '1.0-2' }}</span>
              }
              <span class="badge badge-ctx">
                Contexto servidor: {{ res.usedContext ? 'Sí' : 'No' }}
              </span>
            </div>
            @if (res.intent === 'ai_unavailable') {
              <p class="warn-banner">El asistente no está disponible temporalmente o hubo un fallo al generar la respuesta.</p>
            }
            <div class="answer-body">{{ res.answer }}</div>

            @if (res.recommendations.length) {
              <div class="inline-recos">
                <h3 class="inline-recos-title">En esta respuesta</h3>
                <ul>
                  @for (r of res.recommendations; track $index) {
                    <li>
                      <strong>{{ r.title || r.type }}</strong>
                      @if (r.description) {
                        <span> — {{ r.description }}</span>
                      }
                      @if (r.metadata && objectKeys(r.metadata).length) {
                        <pre class="meta-preview">{{ r.metadata | json }}</pre>
                      }
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      </section>

      <app-ai-recommendations-panel />

      <app-ai-purchase-suggestions-panel />
    </div>
  `,
  styles: `
    .ai-page.stack {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 56rem;
    }
    .page-header h1 {
      margin: 0 0 0.35rem;
      font-size: 1.45rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .page-lead {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.45;
    }
    .muted {
      color: var(--muted);
    }
    .card {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1.15rem 1.25rem;
      background: color-mix(in srgb, var(--surface) 94%, var(--bg-panel));
    }
    .card-title {
      margin: 0 0 0.75rem;
      font-size: 1.05rem;
      font-weight: 700;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.85rem;
    }
    .chip {
      font-size: 0.78rem;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.28rem 0.55rem;
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      cursor: pointer;
      color: var(--text);
      max-width: 100%;
      text-align: left;
      line-height: 1.25;
    }
    .chip:hover {
      border-color: var(--accent);
      color: var(--accent-bright);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 0.65rem;
    }
    .field-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--muted);
    }
    .textarea {
      width: 100%;
      resize: vertical;
      min-height: 6rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 0.55rem 0.65rem;
      font: inherit;
      background: var(--bg);
      color: var(--text);
    }
    .char-count {
      font-size: 0.72rem;
      color: var(--muted);
      align-self: flex-end;
    }
    .chat-actions {
      margin-bottom: 0.85rem;
    }
    .alert-error {
      border: 1px solid color-mix(in srgb, #ef4444 45%, var(--border));
      background: color-mix(in srgb, #ef4444 12%, transparent);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.65rem;
      font-size: 0.88rem;
    }
    .answer-block {
      margin-top: 0.75rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }
    .answer-block--warn .answer-body {
      opacity: 0.95;
    }
    .answer-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-bottom: 0.55rem;
    }
    .badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.18rem 0.48rem;
      border-radius: 999px;
    }
    .badge-intent {
      background: color-mix(in srgb, var(--accent-soft) 90%, transparent);
      color: var(--accent-bright);
    }
    .badge-confidence {
      background: color-mix(in srgb, var(--border) 50%, transparent);
      color: var(--muted);
    }
    .badge-ctx {
      background: color-mix(in srgb, #6366f1 18%, transparent);
      color: #4338ca;
    }
    .warn-banner {
      margin: 0 0 0.55rem;
      padding: 0.45rem 0.55rem;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, #f59e0b 22%, transparent);
      color: var(--text);
      font-size: 0.84rem;
      font-weight: 600;
    }
    .answer-body {
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 0.92rem;
    }
    .inline-recos {
      margin-top: 0.85rem;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px dashed var(--border);
      background: color-mix(in srgb, var(--surface) 90%, transparent);
    }
    .inline-recos-title {
      margin: 0 0 0.35rem;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .inline-recos ul {
      margin: 0;
      padding-left: 1.1rem;
      font-size: 0.86rem;
    }
    .meta-preview {
      margin: 0.35rem 0 0;
      font-size: 0.68rem;
      overflow: auto;
      max-height: 6rem;
      border-radius: 4px;
      padding: 0.35rem;
      background: color-mix(in srgb, var(--bg) 90%, transparent);
    }
  `
})
export class AsistenteIaPage {
  private readonly ai = inject(AiAssistantService);

  readonly maxQuestion = MAX_QUESTION;
  questionDraft = '';

  readonly chatLoading = signal(false);
  readonly chatError = signal<string | null>(null);
  readonly chatResponse = signal<AIChatResponse | null>(null);

  readonly examples = [
    '¿Qué productos debo comprar esta semana?',
    '¿Cuáles productos tienen bajo stock?',
    'Resume las ventas recientes',
    '¿Hay movimientos inusuales?'
  ];

  objectKeys(obj: Record<string, unknown>): string[] {
    return Object.keys(obj);
  }

  useExample(text: string): void {
    this.questionDraft = text.slice(0, MAX_QUESTION);
  }

  submit(): void {
    const q = this.questionDraft.trim();
    if (!q || this.chatLoading()) return;

    this.chatLoading.set(true);
    this.chatError.set(null);

    this.ai
      .ask(q)
      .pipe(finalize(() => this.chatLoading.set(false)))
      .subscribe({
        next: (raw) => {
          const res: AIChatResponse = {
            answer: raw.answer ?? '',
            intent: raw.intent ?? 'inventory_assistant',
            confidence: raw.confidence ?? null,
            usedContext: !!raw.usedContext,
            recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : []
          };
          this.chatResponse.set(res);
          this.ai.notifyRecommendationsChanged();
        },
        error: (err: unknown) => {
          const http = err as HttpErrorResponse;
          if (http?.status === 403) {
            this.chatError.set('No tienes permiso para usar el asistente IA.');
          } else {
            this.chatError.set('No se pudo obtener respuesta del asistente. Intentá de nuevo.');
          }
        }
      });
  }
}
