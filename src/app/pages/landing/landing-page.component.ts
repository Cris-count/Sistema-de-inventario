import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingTopbarComponent } from './sections/topbar/landing-topbar.component';
import { LandingNavbarComponent } from './sections/navbar/landing-navbar.component';
import { LandingHeroComponent } from './sections/hero/landing-hero.component';
import { LandingProblemSolutionComponent } from './sections/problem-solution/landing-problem-solution.component';
import { LandingBenefitsComponent } from './sections/benefits/landing-benefits.component';
import { LandingHowItWorksComponent } from './sections/how-it-works/landing-how-it-works.component';
import { LandingInlineCtaComponent } from './sections/inline-cta/landing-inline-cta.component';
import { LandingBusinessVisualComponent } from './sections/business-visual/landing-business-visual.component';
import { LandingTrustComponent } from './sections/trust/landing-trust.component';
import { LandingPricingComponent } from './sections/pricing/landing-pricing.component';
import { LandingFaqComponent } from './sections/faq/landing-faq.component';
import { LandingCtaComponent } from './sections/cta/landing-cta.component';
import { LandingFooterComponent } from './sections/footer/landing-footer.component';
import { UiButtonComponent } from '../../shared/components/ui/button/ui-button.component';

/** Landing pública: topbar, navbar, hero, narrativa comercial, planes (API), FAQ, CTA y footer. */
@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingTopbarComponent,
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingProblemSolutionComponent,
    LandingBenefitsComponent,
    LandingHowItWorksComponent,
    LandingInlineCtaComponent,
    LandingBusinessVisualComponent,
    LandingTrustComponent,
    LandingPricingComponent,
    LandingFaqComponent,
    LandingCtaComponent,
    LandingFooterComponent,
    UiButtonComponent
  ],
  template: `
    <div
      id="lp-root"
      class="min-h-screen overflow-x-hidden bg-background font-sans text-primary antialiased dark:bg-slate-950 dark:text-slate-100"
    >
      <app-landing-topbar />
      <app-landing-navbar />
      <main>
        <app-landing-hero />
        <app-landing-how-it-works />
        <app-landing-inline-cta variant="organize" />
        <app-landing-problem-solution />
        <app-landing-business-visual />
        <app-landing-benefits />
        <app-landing-trust />
        <app-landing-inline-cta variant="free" [showPlansLink]="false" />
        <app-landing-pricing />
        <app-landing-faq />
        <app-landing-cta />
      </main>
      <app-landing-footer />

      <div
        class="fixed bottom-4 right-4 z-50 hidden sm:block"
        aria-label="Acciones rápidas"
      >
        <div
          class="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-surface/95 px-3 py-2.5 shadow-lg backdrop-blur dark:border-slate-600/60 dark:bg-slate-900/90"
        >
          <app-ui-button
            variant="landing-secondary"
            class="!min-h-[44px] !min-w-[120px] !px-[18px] !py-2.5 !text-sm"
            linkTo="/login"
            >Iniciar sesión</app-ui-button
          >
          <app-ui-button variant="landing-floating" linkTo="/registro">Empieza gratis</app-ui-button>
        </div>
      </div>

      <div
        class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-600/60 dark:bg-slate-900/95 sm:hidden"
        aria-label="Acciones rápidas móvil"
      >
        <div class="mx-auto flex max-w-lg items-stretch gap-2">
          <app-ui-button variant="secondary" class="flex-1" to="/login">Entrar</app-ui-button>
          <app-ui-button variant="gradient" class="flex-1" to="/registro">Crear cuenta</app-ui-button>
        </div>
      </div>

      <!-- Evita que el contenido quede bajo la barra fija móvil (sin duplicar toggle de tema) -->
      <div class="h-[4.75rem] sm:h-0" aria-hidden="true"></div>
    </div>
  `
})
export class LandingPageComponent {}
