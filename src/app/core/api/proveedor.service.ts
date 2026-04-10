import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor } from '../models/entities.model';

export interface ProveedorRequest {
  documento: string;
  razonSocial: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/proveedores`;

  list(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.base);
  }

  create(body: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.base, body);
  }

  update(id: number, body: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.base}/${id}`, body);
  }
}
