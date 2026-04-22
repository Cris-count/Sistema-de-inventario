import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AbastecimientoPanelResponse, InventarioRow, MovimientoResponse } from '../models/entities.model';
import { Page } from '../models/page.model';

export interface LineaStockInicial {
  productoId: number;
  bodegaId: number;
  cantidad: string;
  referencia?: string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/inventario`;

  list(
    page = 0,
    size = 20,
    filters?: { productoId?: number; bodegaId?: number }
  ): Observable<Page<InventarioRow>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters?.productoId != null) params = params.set('productoId', filters.productoId);
    if (filters?.bodegaId != null) params = params.set('bodegaId', filters.bodegaId);
    return this.http.get<Page<InventarioRow>>(this.base, { params });
  }

  alertas(bodegaId?: number): Observable<InventarioRow[]> {
    let params = new HttpParams();
    if (bodegaId != null) params = params.set('bodegaId', bodegaId);
    return this.http.get<InventarioRow[]>(`${this.base}/alertas`, { params });
  }

  /** Panel de reposición (misma base que alertas, + proveedor sugerido y última entrada). */
  panelAbastecimiento(bodegaId?: number | null): Observable<AbastecimientoPanelResponse> {
    let params = new HttpParams();
    if (bodegaId != null) params = params.set('bodegaId', bodegaId);
    return this.http.get<AbastecimientoPanelResponse>(`${this.base}/panel-abastecimiento`, { params });
  }

  /**
   * Simula el correo de pedido sugerido por bajo stock (mismo texto y destinatario que el envío automático:
   * correo del proveedor resuelto para el producto).
   */
  simularCorreoStock(body: { productoId?: number | null; bodegaId?: number | null } = {}): Observable<{
    modo: string;
    mensaje: string;
  }> {
    return this.http.post<{ modo: string; mensaje: string }>(`${this.base}/alertas/simular-correo`, body);
  }

  stockInicial(lineas: LineaStockInicial[]): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/stock-inicial`, { lineas });
  }
}
