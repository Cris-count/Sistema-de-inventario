import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PublicPlanDto } from '../models/public-plan.model';

@Injectable({ providedIn: 'root' })
export class PlanesService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listPublicPlanes(): Observable<PublicPlanDto[]> {
    return this.http.get<PublicPlanDto[]>(`${this.base}/public/planes`);
  }
}
