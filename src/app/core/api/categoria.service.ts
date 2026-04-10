import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models/entities.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categorias`;

  list(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.base);
  }

  create(body: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.post<Categoria>(this.base, body);
  }

  update(id: number, body: { nombre: string; descripcion?: string }): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.base}/${id}`, body);
  }
}
