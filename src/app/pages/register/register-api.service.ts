import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  OnboardingRegisterRequestDto,
  OnboardingRegisterResponseDto,
  PublicPlanDto,
  SendEmailVerificationResponseDto,
  VerifyEmailResponseDto
} from './register.models';

@Injectable({ providedIn: 'root' })
export class RegisterApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  listPlanes(): Observable<PublicPlanDto[]> {
    return this.http.get<PublicPlanDto[]>(`${this.base}/public/planes`);
  }

  sendEmailVerification(email: string, planCodigo: string): Observable<SendEmailVerificationResponseDto> {
    return this.http.post<SendEmailVerificationResponseDto>(`${this.base}/onboarding/send-email-verification`, {
      email,
      planCodigo
    });
  }

  verifyEmail(email: string, planCodigo: string, code: string): Observable<VerifyEmailResponseDto> {
    return this.http.post<VerifyEmailResponseDto>(`${this.base}/onboarding/verify-email`, {
      email,
      planCodigo,
      code
    });
  }

  registerCompany(body: OnboardingRegisterRequestDto): Observable<OnboardingRegisterResponseDto> {
    return this.http.post<OnboardingRegisterResponseDto>(`${this.base}/onboarding/register-company`, body);
  }
}
