import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';

/**
 * Navbar principal. Sitemap alineado al brief: Soluciones → Funcionalidades →
 * Planes → FAQ (todos anchors internos de la misma landing, sin inventar rutas).
 *
 * En desktop se muestra la navegación inline. En móvil hay una navegación
 * secundaria en formato scroll-horizontal que replica el menú, manteniendo la
 * experiencia cercana a la del navbar.
 */
@Component({
  selector: 'app-landing-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, ThemeToggleComponent],
  template: `
    <header
      class="sticky top-0 z-50 border-b border-slate-200/80 bg-surface/75 backdrop-blur-md supports-[backdrop-filter]:bg-surface/65 dark:border-slate-700/60 dark:bg-slate-900/85"
    >
      <div class="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-3">
          <a
            routerLink="/landing"
            class="flex min-w-0 items-center gap-2.5 text-primary no-underline hover:opacity-90 dark:text-slate-100"
          >
            <span
              class="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-sm font-bold text-white shadow-soft"
              >IV</span
            >
            <span class="truncate text-sm font-semibold tracking-tight sm:text-base">Inventario Pro</span>
          </a>

          <nav class="hidden items-center gap-7 text-sm font-medium text-secondary dark:text-slate-300 md:flex">
            <a routerLink="/landing" fragment="soluciones" class="no-underline transition hover:text-primary dark:hover:text-white"
              >Soluciones</a
            >
            <a routerLink="/landing" fragment="funcionalidades" class="no-underline transition hover:text-primary dark:hover:text-white"
              >Funcionalidades</a
            >
            <a routerLink="/landing" fragment="planes" class="no-underline transition hover:text-primary dark:hover:text-white">Planes</a>
            <a routerLink="/landing" fragment="faq" class="no-underline transition hover:text-primary dark:hover:text-white">FAQ</a>
          </nav>

          <div class="flex flex-none items-center gap-2 sm:gap-3">
            <app-theme-toggle />
            <app-ui-button
              variant="landing-secondary"
              class="!min-h-[40px] !min-w-0 !px-3.5 !py-2 !text-sm sm:!px-5"
              linkTo="/login"
              >Iniciar sesión</app-ui-button
            >
            <app-ui-button variant="landing-navbar" class="!min-w-0 sm:!min-w-[150px]" linkTo="/registro"
              >Empieza ahora</app-ui-button
            >
          </div>
        </div>

        <nav
          class="-mx-1 mt-3 flex gap-4 overflow-x-auto px-1 pb-1 text-xs font-semibold text-secondary dark:text-slate-300 md:hidden"
          aria-label="Secciones"
        >
          <a routerLink="/landing" fragment="soluciones" class="whitespace-nowrap no-underline hover:text-primary dark:hover:text-white"
            >Soluciones</a
          >
          <a routerLink="/landing" fragment="funcionalidades" class="whitespace-nowrap no-underline hover:text-primary dark:hover:text-white"
            >Funcionalidades</a
          >
          <a routerLink="/landing" fragment="planes" class="whitespace-nowrap no-underline hover:text-primary dark:hover:text-white">Planes</a>
          <a routerLink="/landing" fragment="faq" class="whitespace-nowrap no-underline hover:text-primary dark:hover:text-white">FAQ</a>
        </nav>
      </div>
    </header>
  `
})
export class LandingNavbarComponent {}
