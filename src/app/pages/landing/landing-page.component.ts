import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingTopbarComponent } from './sections/topbar/landing-topbar.component';
import { LandingNavbarComponent } from './sections/navbar/landing-navbar.component';
import { LandingHeroComponent } from './sections/hero/landing-hero.component';
import { LandingProblemSolutionComponent } from './sections/problem-solution/landing-problem-solution.component';
import { LandingBenefitsComponent } from './sections/benefits/landing-benefits.component';
import { LandingSectorsComponent } from './sections/sectors/landing-sectors.component';
import { LandingFeaturesComponent } from './sections/features/landing-features.component';
import { LandingHowItWorksComponent } from './sections/how-it-works/landing-how-it-works.component';
import { LandingInlineCtaComponent } from './sections/inline-cta/landing-inline-cta.component';
import { LandingBusinessVisualComponent } from './sections/business-visual/landing-business-visual.component';
import { LandingTrustComponent } from './sections/trust/landing-trust.component';
import { LandingPricingComponent } from './sections/pricing/landing-pricing.component';
import { LandingFaqComponent } from './sections/faq/landing-faq.component';
import { LandingCtaComponent } from './sections/cta/landing-cta.component';
import { LandingFooterComponent } from './sections/footer/landing-footer.component';

/** Landing pública: topbar, navbar, hero, narrativa comercial, planes (API), FAQ, CTA y footer. */
@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingTopbarComponent,
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingSectorsComponent,
    LandingFeaturesComponent,
    LandingProblemSolutionComponent,
    LandingBenefitsComponent,
    LandingHowItWorksComponent,
    LandingInlineCtaComponent,
    LandingBusinessVisualComponent,
    LandingTrustComponent,
    LandingPricingComponent,
    LandingFaqComponent,
    LandingCtaComponent,
    LandingFooterComponent
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
        <app-landing-sectors />
        <app-landing-features />
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
    </div>
  `
})
export class LandingPageComponent {}
