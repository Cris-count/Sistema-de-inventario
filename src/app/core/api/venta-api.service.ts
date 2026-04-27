import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import {
  VentaCreatedResponse,
  VentaCreateRequest,
  VentaDetailResponse,
  VentaListItem,
  VentaOperativoResumen,
  VentaPanelResumen,
  VentaStripePrepararResponse
} from '../models/entities.model';

@Injectable({ providedIn: 'root' })
export class VentaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/ventas`;

  panelResumen(): Observable<VentaPanelResumen> {
    return this.http.get<VentaPanelResumen>(`${this.base}/panel-resumen`);
  }

  resumenOperativo(fechaDesde?: string, fechaHasta?: string): Observable<VentaOperativoResumen> {
    let params = new HttpParams();
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    return this.http.get<VentaOperativoResumen>(`${this.base}/resumen-operativo`, { params });
  }

  exportCsv(fechaDesde?: string, fechaHasta?: string): Observable<Blob> {
    let params = new HttpParams();
    if (fechaDesde) {
      params = params.set('fechaDesde', fechaDesde);
    }
    if (fechaHasta) {
      params = params.set('fechaHasta', fechaHasta);
    }
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }

  list(
    page = 0,
    size = 20,
    filtros?: {
      fechaDesde?: string;
      fechaHasta?: string;
      bodegaId?: number;
      usuarioVendedorId?: number;
      estado?: string;
      clienteId?: number;
      codigo?: string;
    }
  ): Observable<Page<VentaListItem>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filtros?.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }
    if (filtros?.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }
    if (filtros?.bodegaId != null) {
      params = params.set('bodegaId', String(filtros.bodegaId));
    }
    if (filtros?.usuarioVendedorId != null) {
      params = params.set('usuarioVendedorId', String(filtros.usuarioVendedorId));
    }
    if (filtros?.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros?.clienteId != null) {
      params = params.set('clienteId', String(filtros.clienteId));
    }
    if (filtros?.codigo) {
      params = params.set('codigo', filtros.codigo.trim());
    }
    return this.http.get<Page<VentaListItem>>(this.base, { params });
  }

  get(id: number): Observable<VentaDetailResponse> {
    return this.http.get<VentaDetailResponse>(`${this.base}/${id}`);
  }

  crear(body: VentaCreateRequest): Observable<VentaCreatedResponse> {
    return this.http.post<VentaCreatedResponse>(this.base, body);
  }

  prepararStripeCheckout(body: VentaCreateRequest): Observable<VentaStripePrepararResponse> {
    return this.http.post<VentaStripePrepararResponse>(`${this.base}/stripe/preparar`, body);
  }

  sincronizarStripePago(ventaId: number, sessionId: string): Observable<VentaDetailResponse> {
    return this.http.post<VentaDetailResponse>(`${this.base}/${ventaId}/stripe/sincronizar`, { sessionId });
  }

  cancelarVentaPendiente(ventaId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${ventaId}/cancelar-pendiente`, {});
  }

  anular(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/anular`, {});
  }
}
