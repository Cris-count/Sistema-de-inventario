import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CambioPlanCancelacionResponseDto,
  CambioPlanSolicitudResponseDto,
  EmpresaActualDto
} from '../models/empresa-actual.model';

@Injectable({ providedIn: 'root' })
export class EmpresaActualService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getMiEmpresa(): Observable<EmpresaActualDto> {
    return this.http.get<EmpresaActualDto>(`${this.base}/empresa/mi`);
  }

  solicitarCambioPlan(planCodigo: string): Observable<CambioPlanSolicitudResponseDto> {
    return this.http.post<CambioPlanSolicitudResponseDto>(`${this.base}/empresa/cambio-plan`, { planCodigo });
  }

  cancelarCambioPlanPendiente(): Observable<CambioPlanCancelacionResponseDto> {
    return this.http.post<CambioPlanCancelacionResponseDto>(`${this.base}/empresa/cambio-plan/cancelar`, {});
  }
}
