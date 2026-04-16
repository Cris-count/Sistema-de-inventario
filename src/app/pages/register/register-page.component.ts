import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal} from '@angular/core';
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
import { RegisterStepCompanyComponent } from './steps/register-step-company.component';
import { RegisterStepAdminComponent } from './steps/register-step-admin.component';
import { RegisterStepReviewComponent } from './steps/register-step-review.component';
import { RegisterStepResultComponent } from './steps/register-step-result.component';
import { HttpErrorResponse } from '@angular/common/http';
import { PlanesService } from '../../core/services/planes.service';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

interface RegisterDraft {
  planCodigo: string | null;
  empresa: EmpresaForm;
  admin: SuperAdminForm;
}

@Component({
  selector: 'app-register-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ThemeToggleComponent,
    RegisterStepPlanComponent,
    RegisterStepCompanyComponent,
    RegisterStepAdminComponent,
    RegisterStepReviewComponent,
    RegisterStepResultComponent
  ],
  template: `
    <div
      id="lp-root"
      class="min-h-screen bg-background font-sans text-primary antialiased dark:bg-slate-950 dark:text-slate-100"
    >
      <header
        class="border-b border-slate-200/80 bg-surface/90 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90"
      >
        <div class="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a
            routerLink="/landing"
            class="text-sm font-semibold text-secondary no-underline hover:text-primary dark:text-slate-300 dark:hover:text-white"
          >
            ← Inventario Pro
          </a>
          <div class="flex items-center gap-2">
            <app-theme-toggle />
            @if (step() < 5) {
              <span class="text-xs font-medium text-secondary dark:text-slate-400">Paso {{ step() }} de 4</span>
            }
          </div>
        </div>
        @if (step() < 5) {
          <div class="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full rounded-full bg-gradient-to-r from-accent to-teal-600 transition-all duration-300"
                [style.width.%]="progressPct()"
              ></div>
            </div>
          </div>
        }
      </header>

      <main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        @if (loadError()) {
          <p
            class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/55 dark:text-amber-100"
          >
            {{ loadError() }}
          </p>
        } @else if (step() === 1) {
          <app-register-step-plan
            [plans]="plans()"
            [selectedCodigo]="draft().planCodigo"
            [hint]="stepHint()"
            (pick)="onPickPlan($event)"
            (advance)="advanceFromPlan()"
          />
        } @else if (step() === 2) {
          <app-register-step-company
            [value]="draft().empresa"
            [hint]="stepHint()"
            (patch)="mergeEmpresa($event)"
            (next)="advanceFromCompany()"
            (back)="goStep(1)"
          />
        } @else if (step() === 3) {
          <app-register-step-admin
            [value]="draft().admin"
            [hint]="stepHint()"
            (patch)="mergeAdmin($event)"
            (next)="advanceFromAdmin()"
            (back)="goStep(2)"
          />
        } @else if (step() === 4) {
          <app-register-step-review
            [planCodigo]="draft().planCodigo!"
            [plan]="selectedPlan()"
            [empresa]="draft().empresa"
            [admin]="draft().admin"
            [submitting]="submitting()"
            [hint]="stepHint()"
            (confirm)="submit()"
            (back)="goStep(3)"
          />
        } @else if (step() === 5) {
          @if (result(); as r) {
            <app-register-step-result [result]="r" />
          }
        }
      </main>
    </div>
  `
})
export class RegisterPageComponent implements OnInit {
  private readonly api = inject(RegisterApiService);
  private readonly planesApi = inject(PlanesService);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal(1);
  readonly plans = signal<PublicPlanDto[]>([]);
  readonly draft = signal<RegisterDraft>({
    planCodigo: null,
    empresa: emptyEmpresaForm(),
    admin: emptySuperAdminForm()
  });
  readonly result = signal<OnboardingRegisterResponseDto | null>(null);
  readonly submitting = signal(false);
  readonly stepHint = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);

  readonly selectedPlan = computed(() => {
    const c = this.draft().planCodigo;
    if (!c) return null;
    return this.plans().find((p) => p.codigo === c) ?? null;
  });

  readonly progressPct = computed(() => (this.step() / 4) * 100);

  ngOnInit(): void {
    this.planesApi.listPublicPlanes().subscribe({
      next: (list) => {
        this.plans.set(list);
        const q = this.route.snapshot.queryParamMap.get('plan');
        if (q) {
          const match = list.find((p) => p.id === q || p.codigo === q);
          if (match) {
            this.draft.update((d) => ({ ...d, planCodigo: match.codigo }));
          }
        }
      },
      error: () =>
        this.loadError.set('No se pudieron cargar los planes. Verifica que la API esté en marcha.')
    });
  }

  onPickPlan(codigo: string): void {
    this.stepHint.set(null);
    this.draft.update((d) => ({ ...d, planCodigo: codigo }));
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
    this.goStep(3);
  }

  advanceFromAdmin(): void {
    this.stepHint.set(null);
    const a = this.draft().admin;
    const errs: string[] = [];
    if (a.nombre.trim().length < 1) errs.push('nombre');
    if (a.apellido.trim().length < 1) errs.push('apellido');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) errs.push('correo');
    if (a.password.length < 8) errs.push('contraseña (mín. 8 caracteres)');
    if (a.password !== a.confirmPassword) errs.push('confirmación de contraseña');
    if (errs.length) {
      this.stepHint.set(`Revisa: ${errs.join(', ')}.`);
      return;
    }
    this.goStep(4);
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
    this.submitting.set(true);
    this.api
      .registerCompany({
        planCodigo: d.planCodigo,
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
          this.step.set(5);
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
