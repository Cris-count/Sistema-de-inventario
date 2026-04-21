import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  LANDING_COMMERCIAL_TAGLINE,
  LANDING_CONTACT,
  buildMailtoLink,
  buildWhatsAppLink
} from '../../config/landing-contact';

/**
 * Franja superior: contacto fijo (WhatsApp + correo) y cinta tipo ticker con el mensaje comercial.
 * Sin CTAs duplicados del navbar. Respeta `prefers-reduced-motion` (ticker estático).
 */
@Component({
  selector: 'app-landing-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="hidden border-b border-white/10 bg-slate-950 text-slate-300 md:block dark:border-slate-800"
      aria-label="Contacto y mensaje comercial"
    >
      <div class="mx-auto flex max-w-6xl items-stretch gap-0 px-4 text-xs sm:px-6 lg:px-8">
        <div
          class="flex shrink-0 items-center gap-4 border-r border-white/10 py-2 pr-4 sm:gap-5 sm:pr-5"
        >
          <a
            [href]="whatsappLink"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-1.5 font-medium text-slate-200 no-underline transition hover:text-white focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
            aria-label="Abrir WhatsApp comercial"
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
            class="flex max-w-[200px] items-center gap-1.5 truncate font-medium text-slate-200 no-underline transition hover:text-white focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 lg:max-w-none"
            aria-label="Enviar correo comercial"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18v12H3z" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span class="truncate">{{ contact.email }}</span>
          </a>
        </div>

        <div
          class="lp-topbar-ticker relative min-h-[2.25rem] min-w-0 flex-1 overflow-hidden py-2"
          aria-hidden="true"
        >
          <div class="lp-topbar-ticker__track">
            <span
              class="inline-flex shrink-0 items-center gap-3 whitespace-nowrap px-6 text-[11px] font-medium tracking-wide text-slate-400 sm:text-xs"
            >
              <span class="text-slate-500">·</span>
              <span>{{ tagline }}</span>
              <span class="text-slate-500">·</span>
              <span class="text-teal-400/80">Cersik</span>
              <span class="text-slate-500">·</span>
              <span>Pymes en Colombia</span>
              <span class="text-slate-500">·</span>
              <span>{{ tagline }}</span>
            </span>
            <span
              class="inline-flex shrink-0 items-center gap-3 whitespace-nowrap px-6 text-[11px] font-medium tracking-wide text-slate-400 sm:text-xs"
              aria-hidden="true"
            >
              <span class="text-slate-500">·</span>
              <span>{{ tagline }}</span>
              <span class="text-slate-500">·</span>
              <span class="text-teal-400/80">Cersik</span>
              <span class="text-slate-500">·</span>
              <span>Pymes en Colombia</span>
              <span class="text-slate-500">·</span>
              <span>{{ tagline }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="border-b border-slate-200/80 bg-slate-50 py-2 text-[11px] text-secondary md:hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
      aria-label="Contacto comercial"
    >
      <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4">
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <a
            [href]="whatsappLink"
            target="_blank"
            rel="noopener"
            class="font-medium text-primary no-underline hover:underline dark:text-slate-200"
            >WhatsApp</a
          >
          <a
            [href]="mailto"
            class="max-w-[55%] truncate font-medium text-primary no-underline hover:underline dark:text-slate-200"
            >{{ contact.email }}</a
          >
        </div>
        <p class="m-0 text-center leading-snug text-slate-500 dark:text-slate-500">
          {{ tagline }}
        </p>
      </div>
    </div>
  `,
  styles: `
    @keyframes lp-topbar-marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    .lp-topbar-ticker__track {
      display: flex;
      width: max-content;
      animation: lp-topbar-marquee 55s linear infinite;
      will-change: transform;
    }
    @media (prefers-reduced-motion: reduce) {
      .lp-topbar-ticker__track {
        animation: none;
        margin-inline: auto;
        width: auto;
        flex-wrap: wrap;
        justify-content: center;
        row-gap: 0.25rem;
      }
    }
  `
})
export class LandingTopbarComponent {
  protected readonly contact = LANDING_CONTACT;
  protected readonly tagline = LANDING_COMMERCIAL_TAGLINE;
  protected readonly whatsappLink = buildWhatsAppLink();
  protected readonly mailto = buildMailtoLink();
}
