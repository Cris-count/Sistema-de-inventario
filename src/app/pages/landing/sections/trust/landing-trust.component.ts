import { ChangeDetectionStrategy, Component } from '@angular/core';

type TrustIcon = 'cop' | 'lang' | 'team';

@Component({
  selector: 'app-landing-trust',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="confianza"
      class="scroll-mt-24 border-y border-slate-800 bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 py-section-lg text-slate-100 dark:border-slate-700"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <div
              class="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Confianza local
            </div>
            <h2 class="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Hecho para PYMES en Colombia
            </h2>
            <p class="mt-4 max-w-prose text-lg leading-relaxed text-slate-400">
              Precios en COP y flujos para equipos pequeños, sin proyecto de implementación eterno.
            </p>
          </div>
          <ul class="space-y-4" role="list">
            @for (item of bullets; track item.text) {
              <li
                class="flex gap-4 rounded-2xl border border-slate-700/80 bg-slate-800/40 px-5 py-4 shadow-card backdrop-blur-sm transition duration-300 hover:border-teal-500/40 hover:bg-slate-800/70"
              >
                <span
                  class="mt-0.5 flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/30"
                  aria-hidden="true"
                >
                  @switch (item.icon) {
                    @case ('cop') {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
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
                        width="24"
                        height="24"
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
                        width="24"
                        height="24"
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
                <span class="text-base font-medium leading-relaxed text-slate-200">{{ item.text }}</span>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `
})
export class LandingTrustComponent {
  readonly bullets: Array<{ text: string; icon: TrustIcon }> = [
    {
      text: 'Planes en COP; sin conversiones raras al pagar.',
      icon: 'cop'
    },
    {
      text: 'Interfaz en español para bodega, compras y administración.',
      icon: 'lang'
    },
    {
      text: 'Operación que no depende de un solo experto en planillas.',
      icon: 'team'
    }
  ];
}
