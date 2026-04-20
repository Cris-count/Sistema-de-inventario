import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';

export type MensajePedidoEstado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MensajePedidoOrigen = 'ALERTA_AUTOMATICA' | 'SIMULACION_INVENTARIO';

export interface MensajePedidoRow {
  id: number;
  origen: MensajePedidoOrigen;
  estado: MensajePedidoEstado;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  bodegaId: number;
  bodegaNombre: string;
  proveedorId: number;
  proveedorRazonSocial: string;
  proveedorEmail: string;
  cantidadSugerida: string;
  cantidadParaProveedor: string;
  existenciaSnapshot: string;
  stockMinimoSnapshot: string;
  unidadMedida: string;
  creadoEn: string;
  resueltoEn: string | null;
  resueltoPorUsuarioId: number | null;
  resueltoPorNombre: string | null;
  notasAdmin: string | null;
}

@Injectable({ providedIn: 'root' })
export class MensajesPedidoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/mensajes-pedido`;

  listar(page = 0, size = 20, estado?: MensajePedidoEstado): Observable<Page<MensajePedidoRow>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (estado) params = params.set('estado', estado);
    return this.http.get<Page<MensajePedidoRow>>(this.base, { params });
  }

  obtener(id: number): Observable<MensajePedidoRow> {
    return this.http.get<MensajePedidoRow>(`${this.base}/${id}`);
  }

  aprobar(
    id: number,
    body: { cantidadParaProveedor: number; notasAdmin?: string | null }
  ): Observable<{ modo: string; mensaje: string }> {
    return this.http.post<{ modo: string; mensaje: string }>(`${this.base}/${id}/aprobar`, body);
  }

  rechazar(id: number, body: { notasAdmin?: string | null } = {}): Observable<{ modo: string; mensaje: string }> {
    return this.http.post<{ modo: string; mensaje: string }>(`${this.base}/${id}/rechazar`, body);
  }
}
