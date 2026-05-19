import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AIChatResponse,
  AiPurchaseSuggestion,
  AiPurchaseSuggestionActionResponse,
  AiPurchaseSuggestionStatus,
  AiPurchaseSuggestionUpdateRequest,
  AiRecommendation,
  AiRecommendationActionResponse,
  AiRecommendationStatus
} from './ai-assistant.models';

/**
 * Integración con Spring Boot (`/api/v1/ai/*`). No llamar al microservicio Python desde el navegador.
 */
@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly chatUrl = `${environment.apiUrl}/ai/chat`;
  private readonly recommendationsUrl = `${environment.apiUrl}/ai/recommendations`;
  private readonly purchaseSuggestionsUrl = `${environment.apiUrl}/ai/purchase-suggestions`;

  private readonly pendingRecommendationsRefreshSubject = new Subject<void>();

  /** Eventos para refrescar contadores/listas sin polling (sidebar + panel). */
  readonly pendingRecommendationsRefresh$ = this.pendingRecommendationsRefreshSubject.asObservable();

  notifyRecommendationsChanged(): void {
    this.pendingRecommendationsRefreshSubject.next();
  }

  ask(question: string): Observable<AIChatResponse> {
    return this.http.post<AIChatResponse>(this.chatUrl, { question });
  }

  getRecommendations(status?: AiRecommendationStatus): Observable<AiRecommendation[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AiRecommendation[]>(this.recommendationsUrl, { params });
  }

  acceptRecommendation(id: number): Observable<AiRecommendationActionResponse> {
    return this.http.post<AiRecommendationActionResponse>(`${this.recommendationsUrl}/${id}/accept`, {});
  }

  dismissRecommendation(id: number): Observable<AiRecommendationActionResponse> {
    return this.http.post<AiRecommendationActionResponse>(`${this.recommendationsUrl}/${id}/dismiss`, {});
  }

  executeRecommendation(id: number): Observable<AiRecommendationActionResponse> {
    return this.http.post<AiRecommendationActionResponse>(`${this.recommendationsUrl}/${id}/execute`, {});
  }

  createPurchaseSuggestionFromRecommendation(id: number): Observable<AiPurchaseSuggestion> {
    return this.http.post<AiPurchaseSuggestion>(`${this.recommendationsUrl}/${id}/create-purchase-suggestion`, {});
  }

  getPurchaseSuggestions(status?: AiPurchaseSuggestionStatus): Observable<AiPurchaseSuggestion[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<AiPurchaseSuggestion[]>(this.purchaseSuggestionsUrl, { params });
  }

  getPurchaseSuggestion(id: number): Observable<AiPurchaseSuggestion> {
    return this.http.get<AiPurchaseSuggestion>(`${this.purchaseSuggestionsUrl}/${id}`);
  }

  updatePurchaseSuggestion(
    id: number,
    payload: AiPurchaseSuggestionUpdateRequest
  ): Observable<AiPurchaseSuggestion> {
    return this.http.patch<AiPurchaseSuggestion>(`${this.purchaseSuggestionsUrl}/${id}`, payload);
  }

  approvePurchaseSuggestion(id: number): Observable<AiPurchaseSuggestionActionResponse> {
    return this.http.post<AiPurchaseSuggestionActionResponse>(`${this.purchaseSuggestionsUrl}/${id}/approve`, {});
  }

  dismissPurchaseSuggestion(id: number): Observable<AiPurchaseSuggestionActionResponse> {
    return this.http.post<AiPurchaseSuggestionActionResponse>(`${this.purchaseSuggestionsUrl}/${id}/dismiss`, {});
  }

  /** Conteo de filas PENDING para el tenant del JWT (errores ⇒ 0, sin tumbar UI). */
  getPendingRecommendationsCount(): Observable<number> {
    const params = new HttpParams().set('status', 'PENDING');
    return this.http.get<unknown[]>(this.recommendationsUrl, { params }).pipe(
      map((rows) => (Array.isArray(rows) ? rows.length : 0)),
      catchError(() => of(0))
    );
  }
}
