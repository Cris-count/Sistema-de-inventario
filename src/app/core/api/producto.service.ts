import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../models/page.model';
import { Producto } from '../models/entities.model';

export interface ProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId: number;
  unidadMedida?: string;
  stockMinimo?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/productos`;

  list(page = 0, size = 20): Observable<Page<Producto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Producto>>(this.base, { params });
  }

  get(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.base}/${id}`);
  }

  create(body: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.base, body);
  }

  update(id: number, body: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.base}/${id}`, body);
  }

  setActivo(id: number, activo: boolean): Observable<Producto> {
    return this.http.patch<Producto>(`${this.base}/${id}/estado`, { activo });
  }
}
