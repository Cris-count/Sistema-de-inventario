import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClienteCreateRequest, ClienteListItem } from '../models/entities.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class ClienteApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/clientes`;

  list(page = 0, size = 200): Observable<Page<ClienteListItem>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<ClienteListItem>>(this.base, { params });
  }

  create(body: ClienteCreateRequest): Observable<ClienteListItem> {
    return this.http.post<ClienteListItem>(this.base, body);
  }
}
