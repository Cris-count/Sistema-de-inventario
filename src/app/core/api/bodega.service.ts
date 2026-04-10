import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bodega } from '../models/entities.model';

export interface BodegaRequest {
  codigo: string;
  nombre: string;
  direccion?: string;
}

@Injectable({ providedIn: 'root' })
export class BodegaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bodegas`;

  list(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.base);
  }

  create(body: BodegaRequest): Observable<Bodega> {
    return this.http.post<Bodega>(this.base, body);
  }

  update(id: number, body: BodegaRequest): Observable<Bodega> {
    return this.http.put<Bodega>(`${this.base}/${id}`, body);
  }
}
