import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioRow } from '../models/entities.model';
import { Page } from '../models/page.model';

export interface UsuarioCreateRequest {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rolCodigo: string;
}

export interface UsuarioUpdateRequest {
  nombre?: string;
  apellido?: string;
  rolCodigo?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  list(page = 0, size = 20): Observable<Page<UsuarioRow>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<UsuarioRow>>(this.base, { params });
  }

  get(id: number): Observable<UsuarioRow> {
    return this.http.get<UsuarioRow>(`${this.base}/${id}`);
  }

  create(body: UsuarioCreateRequest): Observable<UsuarioRow> {
    return this.http.post<UsuarioRow>(this.base, body);
  }

  update(id: number, body: UsuarioUpdateRequest): Observable<UsuarioRow> {
    return this.http.put<UsuarioRow>(`${this.base}/${id}`, body);
  }

  setActivo(id: number, activo: boolean): Observable<UsuarioRow> {
    return this.http.patch<UsuarioRow>(`${this.base}/${id}/estado`, { activo });
  }
}
