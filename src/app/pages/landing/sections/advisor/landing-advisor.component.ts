import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeUp } from '../../../../core/animations';
import { LANDING_CONTACT, buildMailtoLink, buildWhatsAppLink } from '../../config/landing-contact';

/**
 * Franja de asesoría comercial. Aparece justo debajo del hero para captar al
 * visitante que aún no sabe qué plan elegir.
 *
 * No inventa formularios: usa WhatsApp y correo configurables vía
 * `landing-contact.ts`. CTA honestos, abre el canal real.
 */
@Component({
  selector: 'app-landing-advisor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeUp],
  template: `
    <section
      @fadeUp
      aria-label="Asesoría comercial"
      class="bg-surface py-section-sm dark:bg-slate-900"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          class="lp-card-hover relative overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-surface via-surface-hover to-accent-soft shadow-soft transition duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-600/70 dark:from-slate-900 dark:via-slate-900 dark:to-accent/10 dark:hover:border-slate-500"
        >
          <div class="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-accent">Asesoría sin costo</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight text-primary sm:text-3xl dark:text-slate-100">
              ¿No sabes qué plan le conviene a tu negocio?
            </h2>
            <p class="mt-2 text-base text-secondary dark:text-slate-300">
              Cuéntanos cómo opera tu inventario hoy y te ayudamos a elegir la mejor opción para
              crecer sin perder el control.
            </p>
          </div>

          <div class="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center">
            <a
              [href]="whatsappLink"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground no-underline shadow-sm transition hover:brightness-110"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="M20.5 3.5A11 11 0 0 0 3.1 16.9L2 22l5.2-1.1A11 11 0 0 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3 .6.6-2.9-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1c-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8 8 0 0 1-1.5-1.8c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.2-.5a.6.6 0 0 0 0-.5L8.9 7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5 0-.8.4A2.9 2.9 0 0 0 6 9a5 5 0 0 0 1 2.6 11.4 11.4 0 0 0 4.4 3.9c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6 0c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
                />
              </svg>
              Hablar por WhatsApp
            </a>
            <a
              [href]="mailto"
              class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-surface px-5 py-3 text-sm font-semibold text-primary no-underline transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Escribir un correo
            </a>
          </div>
          </div>
        </div>

        <p class="mt-3 text-xs text-secondary dark:text-slate-500">
          Te respondemos en horario laboral colombiano · {{ contact.phoneDisplay }}
        </p>
      </div>
    </section>
  `
})
export class LandingAdvisorComponent {
  protected readonly contact = LANDING_CONTACT;
  protected readonly whatsappLink = buildWhatsAppLink();
  protected readonly mailto = buildMailtoLink();
}
