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
      <div
        class="mx-auto max-w-6xl px-5 py-3 sm:px-6 lg:px-8 lp-nav-pad"
      >
        <!-- Escritorio / tablet: una sola fila -->
        <div class="hidden items-center justify-between gap-6 md:flex">
          <a
            routerLink="/landing"
            class="flex min-w-0 shrink-0 items-center gap-2.5 text-primary no-underline hover:opacity-90 dark:text-slate-100"
          >
            <span
              class="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-strong text-sm font-bold text-white shadow-soft"
              >IV</span
            >
            <span class="truncate text-base font-semibold tracking-tight">Inventario Pro</span>
          </a>

          <nav class="flex items-center gap-7 text-sm font-medium text-secondary dark:text-slate-300">
            <a routerLink="/landing" fragment="soluciones" class="no-underline transition hover:text-primary dark:hover:text-white"
              >Soluciones</a
            >
            <a routerLink="/landing" fragment="funcionalidades" class="no-underline transition hover:text-primary dark:hover:text-white"
              >Funcionalidades</a
            >
            <a routerLink="/landing" fragment="planes" class="no-underline transition hover:text-primary dark:hover:text-white">Planes</a>
            <a routerLink="/landing" fragment="faq" class="no-underline transition hover:text-primary dark:hover:text-white">FAQ</a>
          </nav>

          <div class="flex shrink-0 items-center gap-2.5 sm:gap-3">
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

        <!-- Móvil: marca + tema; CTAs a ancho completo; anclas con área táctil -->
        <div class="flex flex-col gap-3.5 md:hidden">
          <div class="flex items-center justify-between gap-3">
            <a
              routerLink="/landing"
              class="flex min-w-0 flex-1 items-center gap-2.5 text-primary no-underline hover:opacity-90 dark:text-slate-100"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-teal-600 text-sm font-bold text-white shadow-soft"
                >IV</span
              >
              <span class="truncate text-base font-semibold tracking-tight">Inventario Pro</span>
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
              >Crear cuenta</app-ui-button
            >
          </div>

          <nav
            class="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Secciones"
          >
            <a
              routerLink="/landing"
              fragment="soluciones"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Soluciones</a
            >
            <a
              routerLink="/landing"
              fragment="funcionalidades"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Funcionalidades</a
            >
            <a
              routerLink="/landing"
              fragment="planes"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >Planes</a
            >
            <a
              routerLink="/landing"
              fragment="faq"
              class="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-secondary no-underline hover:bg-slate-100/80 active:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-slate-800/80"
              >FAQ</a
            >
          </nav>
        </div>
      </div>
    </header>
  `
})
export class LandingNavbarComponent {}
