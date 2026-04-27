import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KardexMovimiento } from '../models/entities.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportes`;

  kardex(productoId: number, desde: string, hasta: string, page = 0, size = 20): Observable<Page<KardexMovimiento>> {
    const params = new HttpParams()
      .set('productoId', productoId)
      .set('desde', desde)
      .set('hasta', hasta)
      .set('page', page)
      .set('size', size);
    return this.http.get<Page<KardexMovimiento>>(`${this.base}/kardex`, { params });
  }

  exportMovimientosCsv(desde: string, hasta: string): Observable<Blob> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get(`${this.base}/movimientos/export`, { params, responseType: 'blob' });
  }
}
