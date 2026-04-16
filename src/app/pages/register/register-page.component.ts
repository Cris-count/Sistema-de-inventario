import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RegisterApiService } from './register-api.service';
import {
  emptyEmpresaForm,
  emptySuperAdminForm,
  type EmpresaForm,
  type OnboardingRegisterResponseDto,
  type PublicPlanDto,
  type SuperAdminForm
} from './register.models';
import { RegisterStepPlanComponent } from './steps/register-step-plan.component';
import { RegisterStepEmailVerifyComponent } from './steps/register-step-email-verify.component';
import { RegisterStepCompanyComponent } from './steps/register-step-company.component';
import { RegisterStepAdminComponent } from './steps/register-step-admin.component';
import { RegisterStepReviewComponent } from './steps/register-step-review.component';
import { RegisterStepResultComponent } from './steps/register-step-result.component';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UiButtonComponent } from '../../shared/components/ui/button/ui-button.component';

interface RegisterDraft {
  planCodigo: string | null;
  emailVerificationToken: string | null;
  verifyEmail: string;
  verifyCode: string;
  empresa: EmpresaForm;
  admin: SuperAdminForm;
}

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    UiButtonComponent,
    RegisterStepPlanComponent,
    RegisterStepEmailVerifyComponent,
    RegisterStepCompanyComponent,
    RegisterStepAdminComponent,
    RegisterStepReviewComponent,
    RegisterStepResultComponent
  ],
  template: `
    <!--
      Tailwind important selector #lp-root: utility classes must live on a descendant of #lp-root,
      not on the same element, or background/text tokens won't apply (dark body shows through).
    -->
    <div id="lp-root">
      <div class="min-h-screen bg-background font-sans text-primary antialiased">
        <header class="border-b border-slate-200/80 bg-surface/90 backdrop-blur">
          <div class="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <a routerLink="/landing" class="text-sm font-semibold text-secondary no-underline hover:text-primary">
              ← Inventario Pro
            </a>
            @if (step() < 6) {
              <span class="text-xs font-medium text-secondary">Paso {{ step() }} de 5</span>
            }
          </div>
          @if (step() < 6) {
            <div class="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
              <div class="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-accent to-teal-600 transition-all duration-300"
                  [style.width.%]="progressPct()"
                ></div>
              </div>
            </div>
          }
        </header>

      <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        @if (loadError(); as loadErr) {
          <div class="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-soft">
            <p class="text-sm font-semibold text-amber-950">{{ loadErr }}</p>
            <p class="mt-2 text-xs leading-relaxed text-amber-900/90">
              Comprueba que la API responda en
              <span class="rounded bg-white/80 px-1.5 py-0.5 font-mono text-amber-950">{{ apiBaseUrl }}</span>
              (por ejemplo <span class="font-mono">/public/planes</span>). Si usás Docker, esperá a que el contenedor
              <span class="font-mono">api</span> esté arriba y reiniciá con <span class="font-mono">npm run up</span>.
            </p>
            <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <app-ui-button variant="gradient" class="sm:min-w-[200px]" (click)="reloadPlans()">
                Reintentar cargar planes
              </app-ui-button>
              <app-ui-button variant="outline" class="sm:min-w-[180px]" to="/landing">
                Volver al inicio
              </app-ui-button>
            </div>
          </div>
        } @else if (step() === 1) {
          <app-register-step-plan
            [plans]="plans()"
            [selectedCodigo]="draft().planCodigo"
            [hint]="stepHint()"
            (pick)="onPickPlan($event)"
            (advance)="advanceFromPlan()"
          />
        } @else if (step() === 2) {
          <app-register-step-email-verify
            [plan]="selectedPlan()"
            [email]="draft().verifyEmail"
            [code]="draft().verifyCode"
            [hint]="stepHint()"
            [sending]="emailVerifySending()"
            [verifying]="emailVerifyVerifying()"
            [verified]="emailVerificationDone()"
            [codeSent]="emailCodeSent()"
            (emailInput)="onVerifyEmailInput($event)"
            (codeInput)="onVerifyCodeInput($event)"
            (requestCode)="sendVerificationEmail()"
            (advance)="advanceFromEmail()"
            (back)="backFromEmail()"
          />
        } @else if (step() === 3) {
          <app-register-step-company
            [value]="draft().empresa"
            [hint]="stepHint()"
            (patch)="mergeEmpresa($event)"
            (next)="advanceFromCompany()"
            (back)="goStep(2)"
          />
        } @else if (step() === 4) {
          <app-register-step-admin
            [value]="draft().admin"
            [hint]="stepHint()"
            (patch)="mergeAdmin($event)"
            (next)="advanceFromAdmin()"
            (back)="goStep(3)"
          />
        } @else if (step() === 5) {
          <app-register-step-review
            [planCodigo]="draft().planCodigo!"
            [plan]="selectedPlan()"
            [empresa]="draft().empresa"
            [admin]="draft().admin"
            [submitting]="submitting()"
            [hint]="stepHint()"
            (confirm)="submit()"
            (back)="goStep(4)"
          />
        } @else if (step() === 6) {
          @if (result(); as r) {
            <app-register-step-result [result]="r" />
          }
        }
      </main>
      </div>
    </div>
  `
})
export class RegisterPageComponent implements OnInit {
  private readonly api = inject(RegisterApiService);
  private readonly route = inject(ActivatedRoute);

  /** Expuesto en plantilla si falla la carga de planes. */
  readonly apiBaseUrl = environment.apiUrl;

  readonly step = signal(1);
  readonly plans = signal<PublicPlanDto[]>([]);
  readonly draft = signal<RegisterDraft>({
    planCodigo: null,
    emailVerificationToken: null,
    verifyEmail: '',
    verifyCode: '',
    empresa: emptyEmpresaForm(),
    admin: emptySuperAdminForm()
  });
  readonly result = signal<OnboardingRegisterResponseDto | null>(null);
  readonly submitting = signal(false);
  readonly stepHint = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly emailVerifySending = signal(false);
  readonly emailVerifyVerifying = signal(false);
  readonly emailCodeSent = signal(false);
  readonly emailVerificationDone = signal(false);

  readonly selectedPlan = computed(() => {
    const c = this.draft().planCodigo;
    if (!c) return null;
    return this.plans().find((p) => p.codigo === c) ?? null;
  });

  readonly progressPct = computed(() => (Math.min(this.step(), 5) / 5) * 100);

  ngOnInit(): void {
    this.loadPlans();
  }

  reloadPlans(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.loadError.set(null);
    this.api.listPlanes().subscribe({
      next: (list) => {
        this.plans.set(list);
        const q = this.route.snapshot.queryParamMap.get('plan');
        if (q && list.some((p) => p.codigo === q)) {
          this.draft.update((d) => ({ ...d, planCodigo: q }));
        }
      },
      error: () =>
        this.loadError.set('No se pudieron cargar los planes. La API no respondió o la URL no es la correcta.')
    });
  }

  onPickPlan(codigo: string): void {
    this.stepHint.set(null);
    this.draft.update((d) => ({ ...d, planCodigo: codigo }));
  }

  onVerifyEmailInput(v: string): void {
    this.draft.update((d) => ({ ...d, verifyEmail: v }));
    this.emailVerificationDone.set(false);
    this.draft.update((d) => ({ ...d, emailVerificationToken: null }));
  }

  onVerifyCodeInput(v: string): void {
    this.draft.update((d) => ({ ...d, verifyCode: v.replace(/\D/g, '').slice(0, 6) }));
    this.emailVerificationDone.set(false);
    this.draft.update((d) => ({ ...d, emailVerificationToken: null }));
  }

  mergeEmpresa(p: Partial<EmpresaForm>): void {
    this.draft.update((d) => ({ ...d, empresa: { ...d.empresa, ...p } }));
  }

  mergeAdmin(p: Partial<SuperAdminForm>): void {
    this.draft.update((d) => ({ ...d, admin: { ...d.admin, ...p } }));
  }

  advanceFromPlan(): void {
    this.stepHint.set(null);
    if (!this.draft().planCodigo) {
      this.stepHint.set('Selecciona un plan para continuar.');
      return;
    }
    this.goStep(2);
  }

  sendVerificationEmail(): void {
    this.stepHint.set(null);
    const d = this.draft();
    const plan = d.planCodigo;
    const email = d.verifyEmail.trim();
    if (!plan) {
      this.stepHint.set('Falta el plan.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.stepHint.set('Ingresa un correo electrónico válido.');
      return;
    }
    this.emailVerifySending.set(true);
    this.api.sendEmailVerification(email, plan).subscribe({
      next: () => {
        this.emailVerifySending.set(false);
        this.emailCodeSent.set(true);
        this.stepHint.set(null);
      },
      error: (err: unknown) => {
        this.emailVerifySending.set(false);
        this.stepHint.set(readProblemDetail(err));
      }
    });
  }

  advanceFromEmail(): void {
    this.stepHint.set(null);
    const d = this.draft();
    if (d.emailVerificationToken && this.emailVerificationDone()) {
      this.goStep(3);
      return;
    }
    const plan = d.planCodigo;
    const email = d.verifyEmail.trim().toLowerCase();
    const code = d.verifyCode.trim();
    if (!plan) {
      this.stepHint.set('Falta el plan.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.stepHint.set('Ingresa un correo electrónico válido.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      this.stepHint.set('El código debe tener 6 dígitos.');
      return;
    }
    this.emailVerifyVerifying.set(true);
    this.api.verifyEmail(email, plan, code).subscribe({
      next: (res) => {
        this.emailVerifyVerifying.set(false);
        this.draft.update((x) => ({
          ...x,
          emailVerificationToken: res.verificationToken,
          verifyEmail: email
        }));
        this.mergeAdmin({ email });
        this.emailVerificationDone.set(true);
        this.stepHint.set(null);
        this.goStep(3);
      },
      error: (err: unknown) => {
        this.emailVerifyVerifying.set(false);
        this.stepHint.set(readProblemDetail(err));
      }
    });
  }

  backFromEmail(): void {
    this.emailCodeSent.set(false);
    this.emailVerificationDone.set(false);
    this.draft.update((d) => ({
      ...d,
      emailVerificationToken: null,
      verifyCode: ''
    }));
    this.goStep(1);
  }

  advanceFromCompany(): void {
    this.stepHint.set(null);
    const e = this.draft().empresa;
    const errs: string[] = [];
    if (e.nombre.trim().length < 2) errs.push('nombre de empresa');
    if (e.identificacion.trim().length < 2) errs.push('identificación');
    if (e.sector.trim().length < 2) errs.push('sector');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.emailContacto.trim())) errs.push('correo de contacto');
    if (errs.length) {
      this.stepHint.set(`Revisa: ${errs.join(', ')}.`);
      return;
    }
    this.goStep(4);
  }

  advanceFromAdmin(): void {
    this.stepHint.set(null);
    const d = this.draft();
    const a = d.admin;
    const verifiedEmail = d.verifyEmail.trim().toLowerCase();
    const errs: string[] = [];
    if (a.nombre.trim().length < 1) errs.push('nombre');
    if (a.apellido.trim().length < 1) errs.push('apellido');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) errs.push('correo');
    if (a.email.trim().toLowerCase() !== verifiedEmail) {
      errs.push('el correo del administrador debe ser el verificado');
    }
    if (a.password.length < 8) errs.push('contraseña (mín. 8 caracteres)');
    if (a.password !== a.confirmPassword) errs.push('confirmación de contraseña');
    if (errs.length) {
      this.stepHint.set(`Revisa: ${errs.join(', ')}.`);
      return;
    }
    this.goStep(5);
  }

  goStep(n: number): void {
    this.stepHint.set(null);
    this.step.set(n);
  }

  submit(): void {
    this.stepHint.set(null);
    const d = this.draft();
    if (!d.planCodigo) {
      this.stepHint.set('Falta el plan.');
      return;
    }
    if (!d.emailVerificationToken) {
      this.stepHint.set('Debes verificar el correo antes de registrar.');
      return;
    }
    this.submitting.set(true);
    this.api
      .registerCompany({
        planCodigo: d.planCodigo,
        emailVerificationToken: d.emailVerificationToken,
        empresa: {
          nombre: d.empresa.nombre.trim(),
          identificacion: d.empresa.identificacion.trim(),
          sector: d.empresa.sector.trim(),
          emailContacto: d.empresa.emailContacto.trim(),
          telefono: d.empresa.telefono.trim(),
          pais: d.empresa.pais.trim(),
          ciudad: d.empresa.ciudad.trim()
        },
        superAdmin: {
          nombre: d.admin.nombre.trim(),
          apellido: d.admin.apellido.trim(),
          email: d.admin.email.trim().toLowerCase(),
          password: d.admin.password,
          confirmPassword: d.admin.confirmPassword
        }
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.result.set(res);
          this.step.set(6);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.stepHint.set(readProblemDetail(err));
        }
      });
  }
}

function readProblemDetail(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'detail' in body) {
      return String((body as { detail: unknown }).detail);
    }
    return err.message || 'Error al registrar';
  }
  return 'Error al registrar';
}
