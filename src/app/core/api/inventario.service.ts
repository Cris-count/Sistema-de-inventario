import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventarioRow, MovimientoResponse } from '../models/entities.model';
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

  stockInicial(lineas: LineaStockInicial[]): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/stock-inicial`, { lineas });
  }
}
