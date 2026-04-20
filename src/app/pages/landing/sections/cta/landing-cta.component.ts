import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';
import { fadeUp } from '../../../../core/animations';
import { buildWhatsAppLink } from '../../config/landing-contact';

/**
 * CTA final de la landing. Reutiliza el botón primario del sistema y un
 * secundario que abre WhatsApp comercial — sin formularios inventados.
 */
@Component({
  selector: 'app-landing-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent, RouterLink],
  animations: [fadeUp],
  template: `
    <section
      class="relative overflow-hidden border-t border-white/5 bg-linear-to-br from-slate-950 via-slate-900 to-teal-900 px-5 py-16 text-slate-50 sm:px-6 sm:py-20 lg:px-8 lp-section-pad"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_115%,rgba(13,148,136,0.28),transparent)]"
      ></div>
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/30 to-transparent"
      ></div>
      <div @fadeUp class="relative mx-auto max-w-2xl text-center">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-teal-400/90">Siguiente paso</p>
        <h2 class="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Regístrate y opera con inventario real
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
          Sin tarjeta. Carga tu empresa, tus bodegas y empieza a registrar entradas y salidas con tu equipo el mismo día.
        </p>
        <div class="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <app-ui-button
            variant="landing-primary"
            class="w-full min-w-0 px-10! sm:w-auto"
            linkTo="/registro"
            >Crear cuenta gratis</app-ui-button
          >
          <a
            [href]="whatsappLink"
            target="_blank"
            rel="noopener"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/15 sm:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M20.5 3.5A11 11 0 0 0 3.1 16.9L2 22l5.2-1.1A11 11 0 0 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3 .6.6-2.9-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1c-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8 8 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.2-.5a.6.6 0 0 0 0-.5L8.9 7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5 0-.8.4A2.9 2.9 0 0 0 6 9a5 5 0 0 0 1 2.6 11.4 11.4 0 0 0 4.4 3.9c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6 0c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
              />
            </svg>
            Hablar con un asesor
          </a>
        </div>
        <nav
          class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500"
          aria-label="Enlaces relacionados"
        >
          <a
            routerLink="/landing"
            fragment="planes"
            class="font-medium text-slate-400 underline-offset-4 transition hover:text-teal-300 hover:underline"
            >Ver planes y límites</a
          >
          <span class="hidden text-slate-600 sm:inline" aria-hidden="true">·</span>
          <a
            routerLink="/login"
            class="font-medium text-slate-400 underline-offset-4 transition hover:text-teal-300 hover:underline"
            >Ya tengo cuenta</a
          >
          <span class="hidden text-slate-600 sm:inline" aria-hidden="true">·</span>
          <a
            routerLink="/app"
            class="font-medium text-slate-500 underline-offset-4 transition hover:text-slate-300 hover:underline"
            >Ir al panel</a
          >
        </nav>
      </div>
    </section>
  `
})
export class LandingCtaComponent {
  protected readonly whatsappLink = buildWhatsAppLink();
}
