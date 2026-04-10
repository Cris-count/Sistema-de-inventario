import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovimientoList, MovimientoResponse, TipoMovimiento } from '../models/entities.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class MovimientoApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/movimientos`;

  historial(
    desde: string,
    hasta: string,
    page = 0,
    size = 20,
    tipo?: TipoMovimiento
  ): Observable<Page<MovimientoList>> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta).set('page', page).set('size', size);
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<Page<MovimientoList>>(this.base, { params });
  }

  get(id: number): Observable<MovimientoResponse> {
    return this.http.get<MovimientoResponse>(`${this.base}/${id}`);
  }

  entrada(body: Record<string, unknown>): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/entradas`, body);
  }

  salida(body: Record<string, unknown>): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/salidas`, body);
  }

  transferencia(body: Record<string, unknown>): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/transferencias`, body);
  }

  ajuste(body: Record<string, unknown>): Observable<MovimientoResponse> {
    return this.http.post<MovimientoResponse>(`${this.base}/ajustes`, body);
  }
}
