import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingTopbarComponent } from './sections/topbar/landing-topbar.component';
import { LandingNavbarComponent } from './sections/navbar/landing-navbar.component';
import { LandingHeroComponent } from './sections/hero/landing-hero.component';
import { LandingAdvisorComponent } from './sections/advisor/landing-advisor.component';
import { LandingProblemComponent } from './sections/problem/landing-problem.component';
import { LandingSolutionComponent } from './sections/solution/landing-solution.component';
import { LandingProductShowcaseComponent } from './sections/product-showcase/landing-product-showcase.component';
import { LandingSectorsComponent } from './sections/sectors/landing-sectors.component';
import { LandingFeaturesComponent } from './sections/features/landing-features.component';
import { LandingBenefitsComponent } from './sections/benefits/landing-benefits.component';
import { LandingPricingComponent } from './sections/pricing/landing-pricing.component';
import { LandingPlansCompareComponent } from './sections/plans-compare/landing-plans-compare.component';
import { LandingTrustComponent } from './sections/trust/landing-trust.component';
import { LandingFaqComponent } from './sections/faq/landing-faq.component';
import { LandingCtaComponent } from './sections/cta/landing-cta.component';
import { LandingFooterComponent } from './sections/footer/landing-footer.component';
import { UiButtonComponent } from '../../shared/components/ui/button/ui-button.component';

/**
 * Landing pública. Orquesta las 15 secciones comerciales:
 *
 *   1.  Top bar comercial (contacto + área de clientes + CTA prueba)
 *   2.  Navbar principal (Soluciones / Funcionalidades / Planes / FAQ)
 *   3.  Hero
 *   4.  Franja de asesoría (WhatsApp + correo)
 *   5.  Problema
 *   6.  Solución
 *   7.  Soluciones por tipo de negocio
 *   8.  Funcionalidades clave
 *   9.  Beneficios
 *   10. Planes (catálogo real desde backend)
 *   11. Comparativa breve de planes
 *   12. Confianza honesta
 *   13. FAQ
 *   14. CTA final
 *   15. Footer
 *
 * `LandingUrgencyComponent` se retira del flujo: el mensaje de urgencia ya
 * está cubierto por el advisor strip y el CTA final, sin saturar el scroll.
 */
@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingTopbarComponent,
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingAdvisorComponent,
    LandingProblemComponent,
    LandingSolutionComponent,
    LandingProductShowcaseComponent,
    LandingSectorsComponent,
    LandingFeaturesComponent,
    LandingBenefitsComponent,
    LandingPricingComponent,
    LandingPlansCompareComponent,
    LandingTrustComponent,
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
      <app-landing-topbar />
      <app-landing-navbar />
      <main>
        <app-landing-hero />
        <app-landing-advisor />
        <app-landing-problem />
        <app-landing-solution />
        <app-landing-product-showcase />
        <app-landing-sectors />
        <app-landing-features />
        <app-landing-benefits />
        <app-landing-pricing />
        <app-landing-plans-compare />
        <app-landing-trust />
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
        <div class="mx-auto flex max-w-lg items-stretch gap-2.5">
          <app-ui-button variant="landing-secondary" class="flex-1 !min-h-[48px]" linkTo="/login"
            >Iniciar sesión</app-ui-button
          >
          <app-ui-button variant="landing-primary" class="flex-1 !min-h-[48px]" linkTo="/registro"
            >Empieza gratis</app-ui-button
          >
        </div>
      </div>

      <!-- Evita que el contenido quede bajo la barra fija móvil (sin duplicar toggle de tema) -->
      <div class="h-[4.75rem] sm:h-0" aria-hidden="true"></div>
    </div>
  `
})
export class LandingPageComponent {}
