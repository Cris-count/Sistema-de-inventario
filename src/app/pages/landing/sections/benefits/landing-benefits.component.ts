import { ChangeDetectionStrategy, Component } from '@angular/core';

type BenefitIcon = 'shield' | 'clock' | 'control' | 'chart';

@Component({
  selector: 'app-landing-benefits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <section
      id="beneficios"
      class="scroll-mt-24 border-y border-teal-100/50 bg-gradient-to-br from-teal-50/50 via-white to-slate-50 py-section-lg dark:border-teal-900/30 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-950"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-3xl text-center">
          <h2 class="text-4xl font-bold tracking-tight text-primary dark:text-slate-100 sm:text-5xl">
            Tiempo recuperado, dinero mejor usado y control real
          </h2>
          <p class="mt-4 text-lg leading-relaxed text-secondary dark:text-slate-400 sm:text-xl">
            Para PYMES en Colombia: menos fricción en compras, despacho y cierre, con cifras defendibles.
          </p>
        </div>

        <div class="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          @for (b of cards; track b.title) {
            <article
              class="group flex h-full flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-7 shadow-card backdrop-blur-sm transition duration-300 hover:-translate-y-1.5 hover:border-teal-300/50 hover:shadow-card-hover dark:border-slate-700/80 dark:bg-slate-900/90 dark:hover:border-teal-600/40"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-accent shadow-inner ring-2 ring-teal-100/90 dark:from-teal-950/80 dark:to-slate-900 dark:text-teal-300 dark:ring-teal-800/50"
                aria-hidden="true"
              >
                @switch (b.icon) {
                  @case ('shield') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.65"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                  }
                  @case ('clock') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.65"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  }
                  @case ('control') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.65"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  }
                  @case ('chart') {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.65"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                      <path d="M7 11h8" />
                      <path d="M7 16h12" />
                      <path d="M7 6h3" />
                    </svg>
                  }
                }
              </div>
              <h3 class="mt-5 text-xl font-bold text-primary dark:text-slate-100">{{ b.title }}</h3>
              <p class="mt-3 flex-1 text-base leading-relaxed text-secondary dark:text-slate-400">{{ b.body }}</p>
            </article>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingBenefitsComponent {
  readonly cards: Array<{ title: string; body: string; icon: BenefitIcon }> = [
    {
      title: 'Evita pérdidas',
      body: 'Menos faltantes que frenan ventas y menos compras duplicadas por no ver el stock real.',
      icon: 'shield'
    },
    {
      title: 'Ahorra tiempo',
      body: 'Consultas y cierres sin reconciliar planillas, fotos y mensajes a mano.',
      icon: 'clock'
    },
    {
      title: 'Control total',
      body: 'Saldos por bodega, movimientos trazados y respaldo cuando hay reclamo o revisión.',
      icon: 'control'
    },
    {
      title: 'Información confiable',
      body: 'Una sola fuente de verdad para compras, bodega y administración.',
      icon: 'chart'
    }
  ];
}
