import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LANDING_CONTACT, buildMailtoLink, buildWhatsAppLink } from '../../config/landing-contact';

/**
 * Franja superior comercial (tipo "top bar" de sitios SaaS B2B).
 *
 * Desktop: muestra WhatsApp, correo y teléfono + accesos rápidos a área de
 * clientes y CTA de prueba gratis. En móvil sólo se muestra un resumen
 * compacto para no competir con el navbar.
 *
 * Honesto: sin formularios inventados, todo son enlaces `mailto:`, `tel:` y
 * `wa.me` configurables desde `landing-contact.ts`.
 */
@Component({
  selector: 'app-landing-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div
      class="hidden border-b border-white/10 bg-slate-950 text-slate-200 md:block dark:border-slate-800"
      aria-label="Contacto comercial"
    >
      <div
        class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5 text-xs sm:px-6 lg:px-8"
      >
        <div class="flex items-center gap-5">
          <a
            [href]="whatsappLink"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1.5 no-underline text-slate-200 transition hover:text-white"
            aria-label="WhatsApp comercial"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M20.5 3.5A11 11 0 0 0 3.1 16.9L2 22l5.2-1.1A11 11 0 0 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3 .6.6-2.9-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1c-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8 8 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.2-.5a.6.6 0 0 0 0-.5L8.9 7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5 0-.8.4A2.9 2.9 0 0 0 6 9a5 5 0 0 0 1 2.6 11.4 11.4 0 0 0 4.4 3.9c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6 0c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
              />
            </svg>
            <span>{{ contact.phoneDisplay }}</span>
          </a>

          <a
            [href]="mailto"
            class="flex items-center gap-1.5 no-underline text-slate-200 transition hover:text-white"
            aria-label="Correo comercial"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 6h18v12H3z" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span>{{ contact.email }}</span>
          </a>
        </div>

        <div class="flex items-center gap-4">
          <a
            routerLink="/login"
            class="no-underline text-slate-200 transition hover:text-white"
          >
            Área de clientes
          </a>
          <span class="h-3 w-px bg-slate-700" aria-hidden="true"></span>
          <a
            routerLink="/registro"
            class="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 font-medium text-white no-underline shadow-sm transition hover:brightness-110"
          >
            Prueba gratis
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div
      class="border-b border-slate-200/80 bg-slate-50 text-[11px] text-secondary md:hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
      aria-label="Contacto comercial móvil"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
        <a [href]="whatsappLink" target="_blank" rel="noopener" class="no-underline hover:text-primary dark:hover:text-white">
          WhatsApp
        </a>
        <a [href]="mailto" class="no-underline hover:text-primary dark:hover:text-white">
          {{ contact.email }}
        </a>
        <a routerLink="/login" class="no-underline hover:text-primary dark:hover:text-white">Área de clientes</a>
      </div>
    </div>
  `
})
export class LandingTopbarComponent {
  protected readonly contact = LANDING_CONTACT;
  protected readonly whatsappLink = buildWhatsAppLink();
  protected readonly mailto = buildMailtoLink();
}
