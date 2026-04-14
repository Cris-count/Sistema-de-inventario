import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  OnboardingRegisterRequestDto,
  OnboardingRegisterResponseDto,
  PublicPlanDto
} from './register.models';

@Injectable({ providedIn: 'root' })
export class RegisterApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listPlanes(): Observable<PublicPlanDto[]> {
    return this.http.get<PublicPlanDto[]>(`${this.base}/public/planes`);
  }

  registerCompany(body: OnboardingRegisterRequestDto): Observable<OnboardingRegisterResponseDto> {
    return this.http.post<OnboardingRegisterResponseDto>(`${this.base}/onboarding/register-company`, body);
  }
}
