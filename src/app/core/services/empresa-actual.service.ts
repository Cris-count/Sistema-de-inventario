import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CambioPlanCancelacionResponseDto,
  CambioPlanSolicitudResponseDto,
  CheckoutResolution,
  CreateCheckoutSessionResponseDto,
  EmpresaActualDto,
  EmpresaMiUpdateRequest,
  ResolveCheckoutSessionResponseDto
} from '../models/empresa-actual.model';

@Injectable({ providedIn: 'root' })
export class EmpresaActualService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMiEmpresa(): Observable<EmpresaActualDto> {
    return this.http.get<EmpresaActualDto>(`${this.base}/empresa/mi`);
  }

  actualizarMiEmpresa(body: EmpresaMiUpdateRequest): Observable<EmpresaActualDto> {
    return this.http.put<EmpresaActualDto>(`${this.base}/empresa/mi`, body);
  }

  solicitarCambioPlan(planCodigo: string): Observable<CambioPlanSolicitudResponseDto> {
    return this.http.post<CambioPlanSolicitudResponseDto>(`${this.base}/empresa/cambio-plan`, { planCodigo });
  }

  cancelarCambioPlanPendiente(): Observable<CambioPlanCancelacionResponseDto> {
    return this.http.post<CambioPlanCancelacionResponseDto>(`${this.base}/empresa/cambio-plan/cancelar`, {});
  }

  createCheckoutSession(planCodigo: string): Observable<CreateCheckoutSessionResponseDto> {
    return this.http.post<CreateCheckoutSessionResponseDto>(`${this.base}/empresa/checkout/session`, { planCodigo });
  }

  resolveCheckoutSession(
    pagoId: number,
    result: CheckoutResolution,
    sessionId?: string | null
  ): Observable<ResolveCheckoutSessionResponseDto> {
    return this.http.post<ResolveCheckoutSessionResponseDto>(
      `${this.base}/empresa/checkout/session/${pagoId}/resolve`,
      { result, sessionId: sessionId ?? null }
    );
  }
}
