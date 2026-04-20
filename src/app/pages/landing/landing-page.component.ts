import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingNavbarComponent } from './sections/navbar/landing-navbar.component';
import { LandingHeroComponent } from './sections/hero/landing-hero.component';
import { LandingSocialProofComponent } from './sections/social-proof/landing-social-proof.component';
import { LandingProblemSolutionComponent } from './sections/problem-solution/landing-problem-solution.component';
import { LandingFeaturesComponent } from './sections/features/landing-features.component';
import { LandingProductShowcaseComponent } from './sections/product-showcase/landing-product-showcase.component';
import { LandingBenefitsComponent } from './sections/benefits/landing-benefits.component';
import { LandingPricingComponent } from './sections/pricing/landing-pricing.component';
import { LandingTestimonialsComponent } from './sections/testimonials/landing-testimonials.component';
import { LandingFaqComponent } from './sections/faq/landing-faq.component';
import { LandingCtaComponent } from './sections/cta/landing-cta.component';
import { LandingFooterComponent } from './sections/footer/landing-footer.component';
import { UiButtonComponent } from '../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingSocialProofComponent,
    LandingProblemSolutionComponent,
    LandingFeaturesComponent,
    LandingProductShowcaseComponent,
    LandingBenefitsComponent,
    LandingPricingComponent,
    LandingTestimonialsComponent,
    LandingFaqComponent,
    LandingCtaComponent,
    LandingFooterComponent,
    UiButtonComponent
  ],
  template: `
    <div
      id="lp-root"
      class="min-h-screen bg-background font-sans text-primary antialiased dark:bg-slate-950 dark:text-slate-100"
    >
      <app-landing-navbar />
      <main>
        <app-landing-hero />
        <app-landing-social-proof />
        <app-landing-problem-solution />
        <app-landing-features />
        <app-landing-product-showcase />
        <app-landing-benefits />
        <app-landing-pricing />
        <app-landing-testimonials />
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
          <app-ui-button variant="landing-floating" linkTo="/registro">Empezar</app-ui-button>
        </div>
      </div>

      <div
        class="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-600/60 dark:bg-slate-900/95 sm:hidden"
        aria-label="Acciones rápidas móvil"
      >
        <div class="mx-auto flex max-w-lg items-stretch gap-2.5">
          <app-ui-button variant="landing-secondary" class="flex-1 !min-h-[48px]" linkTo="/login"
            >Iniciar sesión</app-ui-button
          >
          <app-ui-button variant="landing-primary" class="flex-1 !min-h-[48px]" linkTo="/registro"
            >Empezar</app-ui-button
          >
        </div>
      </div>

      <!-- Evita que el contenido quede bajo la barra fija móvil (sin duplicar toggle de tema) -->
      <div class="h-[4.75rem] sm:h-0" aria-hidden="true"></div>
    </div>
  `
})
export class LandingPageComponent {}
