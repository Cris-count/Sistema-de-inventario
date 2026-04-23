import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  CreatePrepayCheckoutResponseDto,
  OnboardingRegisterRequestDto,
  OnboardingRegisterResponseDto,
  SendEmailVerificationResponseDto,
  VerifyEmailResponseDto
} from './register.models';

@Injectable({ providedIn: 'root' })
export class RegisterApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  createPrepaidCheckout(planCodigo: string): Observable<CreatePrepayCheckoutResponseDto> {
    return this.http.post<CreatePrepayCheckoutResponseDto>(`${this.base}/onboarding/prepaid-checkout`, {
      planCodigo
    });
  }

  confirmPrepaidCheckout(sessionId: string, planCodigo: string): Observable<void> {
    return this.http.post<void>(`${this.base}/onboarding/confirm-prepaid-checkout`, {
      sessionId,
      planCodigo
    });
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
