import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GsapHoverDirective } from '../../../../shared/motion/gsap-hover.directive';
import { GsapRevealDirective } from '../../../../shared/motion/gsap-reveal.directive';

type TrustIcon = 'cop' | 'lang' | 'team';

@Component({
  selector: 'app-landing-trust',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GsapHoverDirective, GsapRevealDirective],
  template: `
    <section
      id="confianza"
      class="lp-trust-section relative overflow-hidden scroll-mt-24 border-y border-slate-800 text-slate-100 dark:border-slate-700"
    >
      <!-- Fondo: gradiente base + glow teal + grid técnico muy sutil -->
      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute -right-8 top-0 h-[min(55vh,28rem)] w-[min(55vw,24rem)] rounded-full bg-teal-500/[0.11] blur-3xl sm:-right-16 sm:w-[28rem]"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal-600/[0.06] blur-3xl"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)] dark:opacity-[0.28]"
        aria-hidden="true"
      ></div>
      <!-- Transición inferior hacia la siguiente sección -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-14 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent sm:h-16"
        aria-hidden="true"
      ></div>
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-px bg-gradient-to-r from-transparent via-teal-400/25 to-transparent"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-8 sm:pt-12 sm:pb-20 lg:px-10 lg:pt-14 lg:pb-24">
        <div
          appGsapReveal="section"
          gsapRevealTargets="[data-gsap-trust-item]"
          class="grid gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-16"
        >
          <div data-gsap-trust-item class="max-w-xl lg:max-w-none lg:pt-0.5">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-teal-400/35 bg-teal-500/[0.12] px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-teal-200 shadow-[0_0_0_1px_rgba(45,212,191,0.08)] ring-1 ring-teal-400/15"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="opacity-90"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              CONFIANZA LOCAL
            </div>
            <h2
              class="mt-4 text-balance text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-[1.12]"
            >
              Hecho para PYMES en Colombia
            </h2>
            <p
              class="mt-3 max-w-[38ch] text-base leading-relaxed text-slate-400 sm:mt-4 sm:text-[1.0625rem] sm:leading-relaxed"
            >
              Precios en COP y una plataforma clara para equipos pequeños que necesitan controlar inventario, compras y
              operación sin depender de procesos improvisados.
            </p>
            <ul
              class="mt-5 flex flex-wrap gap-2 sm:mt-6"
              role="list"
              aria-label="Ventajas destacadas"
            >
              <li
                class="rounded-full border border-teal-500/25 bg-teal-500/[0.07] px-3 py-1.5 text-xs font-semibold tracking-tight text-teal-100/95 ring-1 ring-teal-500/10"
              >
                Implementación simple
              </li>
              <li
                class="rounded-full border border-teal-500/25 bg-teal-500/[0.07] px-3 py-1.5 text-xs font-semibold tracking-tight text-teal-100/95 ring-1 ring-teal-500/10"
              >
                Planes en COP
              </li>
              <li
                class="rounded-full border border-teal-500/25 bg-teal-500/[0.07] px-3 py-1.5 text-xs font-semibold tracking-tight text-teal-100/95 ring-1 ring-teal-500/10"
              >
                Soporte en español
              </li>
            </ul>
          </div>
          <ul class="space-y-3 lg:space-y-3.5" role="list">
            @for (item of bullets; track item.title) {
              <li
                appGsapHover="card"
                data-gsap-trust-item
                class="flex gap-3 rounded-2xl border border-slate-700/70 bg-slate-800/35 px-4 py-3 shadow-sm backdrop-blur-sm transition duration-300 hover:border-teal-500/35 hover:bg-slate-800/65 sm:gap-3.5 sm:px-4 sm:py-3.5"
              >
                <span
                  class="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-teal-500/12 text-teal-300 ring-1 ring-teal-400/25"
                  aria-hidden="true"
                >
                  @switch (item.icon) {
                    @case ('cop') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2v20" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    }
                    @case ('lang') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="m5 8 6 6" />
                        <path d="m4 14 6-6 2-3" />
                        <path d="M2 5h12" />
                        <path d="M7 2h1" />
                        <path d="m22 22-5-10-5 10" />
                        <path d="M14 18h6" />
                      </svg>
                    }
                    @case ('team') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.75"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    }
                  }
                </span>
                <div class="min-w-0 flex-1 pt-0.5">
                  <p class="text-[0.9375rem] font-semibold leading-snug text-slate-100">{{ item.title }}</p>
                  <p class="mt-0.5 text-sm leading-snug text-slate-400">{{ item.desc }}</p>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `
})
export class LandingTrustComponent {
  readonly bullets: Array<{ title: string; desc: string; icon: TrustIcon }> = [
    {
      title: 'Pagas en COP',
      desc: 'Sin conversiones raras al momento de cobrar.',
      icon: 'cop'
    },
    {
      title: 'Todo en español',
      desc: 'Bodega, compras y administración más claras.',
      icon: 'lang'
    },
    {
      title: 'Operación más ordenada',
      desc: 'Menos dependencia de una sola persona o de planillas.',
      icon: 'team'
    }
  ];
}
