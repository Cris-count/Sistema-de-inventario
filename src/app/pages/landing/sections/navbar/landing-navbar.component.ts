import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

const LANDING = '/landing';

/**
 * Navbar principal. Enlaces a anclas vía `routerLink` + `fragment` para que
 * funcionen también fuera de la landing (p. ej. /login → /landing#planes).
 *
 * Escritorio: una fila. Móvil: marca + tema, CTAs a ancho completo, anclas con área táctil.
 */
@Component({
  selector: 'app-landing-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, ThemeToggleComponent],
  template: `
    <header
      class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:border-slate-700/60 dark:bg-slate-950/80 dark:shadow-none"
    >
      <div class="mx-auto max-w-6xl px-5 py-2 sm:px-6 sm:py-2.5 lg:px-8 lg:py-2.5 lp-nav-pad">
        <!-- Escritorio / tablet: una sola fila -->
        <div class="hidden items-center justify-between gap-3 md:gap-4 lg:gap-5 md:flex">
          <a
            [routerLink]="LANDING"
            class="flex shrink-0 items-center text-primary no-underline transition hover:opacity-90 dark:text-slate-100"
          >
            <img
              src="/branding/cersik-logo-full.png"
              alt="Cersik"
              class="block h-auto w-auto max-h-16 max-w-[min(44rem,calc(100vw-9rem))] object-contain object-left sm:max-h-[4.5rem] sm:max-w-[min(44rem,calc(100vw-20.5rem))] md:max-h-20 md:max-w-[min(44rem,calc(100vw-20rem))] lg:max-h-[5.25rem] xl:max-h-24"
              width="440"
              height="96"
              loading="eager"
            />
          </a>

          <nav class="flex min-w-0 shrink items-center gap-3 text-sm font-medium text-secondary md:gap-3.5 lg:gap-4 dark:text-slate-300">
            <a
              [routerLink]="LANDING"
              fragment="soluciones"
              class="no-underline transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-white"
              >Soluciones</a
            >
            <a
              [routerLink]="LANDING"
              fragment="funcionalidades"
              class="no-underline transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-white"
              >Funcionalidades</a
            >
            <a
              [routerLink]="LANDING"
              fragment="panel"
              class="no-underline transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-white"
              >Panel</a
            >
            <a
              [routerLink]="LANDING"
              fragment="planes"
              class="no-underline transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-white"
              >Planes</a
            >
            <a
              [routerLink]="LANDING"
              fragment="faq"
              class="no-underline transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-white"
              >FAQ</a
            >
          </nav>

          <div class="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <app-theme-toggle />
            <app-ui-button
              variant="landing-secondary"
              class="!min-h-[40px] !min-w-0 !px-3.5 !py-2 !text-sm sm:!px-5"
              linkTo="/login"
              >Iniciar sesión</app-ui-button
            >
            <app-ui-button variant="landing-navbar" class="!min-w-0 sm:!min-w-[140px]" linkTo="/registro"
              >Empieza ahora</app-ui-button
            >
          </div>
        </div>

        <!-- Móvil: marca + tema; CTAs a ancho completo; anclas con área táctil -->
        <div class="flex flex-col gap-3 md:hidden">
          <div class="flex items-center justify-between gap-2">
            <a
              [routerLink]="LANDING"
              class="flex min-w-0 flex-1 items-center text-primary no-underline transition hover:opacity-90 dark:text-slate-100"
            >
              <img
                src="/branding/cersik-logo-full.png"
                alt="Cersik"
                class="block h-auto w-auto max-h-[4.5rem] max-w-[min(44rem,92vw)] shrink-0 object-contain object-left sm:max-h-20"
                width="440"
                height="96"
                loading="eager"
              />
            </a>
            <div class="shrink-0">
              <app-theme-toggle />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <app-ui-button
              variant="landing-secondary"
              class="!min-h-[44px] w-full !px-3 !text-sm"
              linkTo="/login"
              >Iniciar sesión</app-ui-button
            >
            <app-ui-button variant="landing-navbar" class="!min-h-[44px] w-full !text-sm" linkTo="/registro"
              >Empieza ahora</app-ui-button
            >
          </div>

          <nav
            class="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Secciones"
          >
            <a
              [routerLink]="LANDING"
              fragment="soluciones"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Soluciones</a
            >
            <a
              [routerLink]="LANDING"
              fragment="funcionalidades"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Funcionalidades</a
            >
            <a
              [routerLink]="LANDING"
              fragment="panel"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Panel</a
            >
            <a
              [routerLink]="LANDING"
              fragment="planes"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Planes</a
            >
            <a
              [routerLink]="LANDING"
              fragment="faq"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >FAQ</a
            >
          </nav>
        </div>
      </div>
    </header>
  `
})
export class LandingNavbarComponent {
  protected readonly LANDING = LANDING;
}
