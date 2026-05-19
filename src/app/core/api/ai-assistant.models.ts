/** Contratos JSON expuestos por Spring Boot (`/api/v1/ai/*`). */

export type AiRecommendationStatus = 'PENDING' | 'ACCEPTED' | 'DISMISSED' | 'EXECUTED';

export interface AIChatRecommendation {
  type: string;
  title: string;
  description: string;
  confidence: number | null;
  metadata: Record<string, unknown> | null;
}

export interface AIChatResponse {
  answer: string;
  intent: string;
  confidence: number | null;
  usedContext: boolean;
  recommendations: AIChatRecommendation[];
}

export interface AiRecommendation {
  id: number;
  status: AiRecommendationStatus;
  code: string;
  title: string | null;
  detail: string | null;
  confidence: number | null;
  priority: string | null;
  chatIntent: string | null;
  chatConfidence: number | null;
  usedContext: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  /** Vista previa segura desde el backend (allowlist + truncado). */
  metadataPreview?: Record<string, string> | null;
  /** Fallback opcional si la API envía metadata cruda (no usado por Spring actualmente). */
  metadata?: Record<string, unknown> | null;
}

/** Respuesta de POST accept | dismiss | execute (misma forma que la fila actualizada). */
export type AiRecommendationActionResponse = AiRecommendation;

export type AiPurchaseSuggestionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'DISMISSED';

export interface AiPurchaseSuggestion {
  id: number;
  sourceRecommendationId: number;
  productId: number | null;
  productName: string | null;
  warehouseName: string | null;
  currentStock: number | null;
  minimumStock: number | null;
  quantitySoldLast30Days: number | null;
  suggestedQuantity: number;
  priority: string | null;
  status: AiPurchaseSuggestionStatus;
  createdBy?: number;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string | null;
  approvedAt?: string | null;
  dismissedAt?: string | null;
  notes?: string | null;
}

export interface AiPurchaseSuggestionUpdateRequest {
  suggestedQuantity: number;
  notes?: string | null;
  warehouseName?: string | null;
}

export interface AiPurchaseSuggestionActionResponse {
  id: number;
  status: AiPurchaseSuggestionStatus;
  message: string;
  suggestion: AiPurchaseSuggestion;
}
