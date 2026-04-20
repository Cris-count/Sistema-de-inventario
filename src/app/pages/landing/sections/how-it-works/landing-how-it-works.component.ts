import { ChangeDetectionStrategy, Component } from '@angular/core';

type StepIcon = 'register' | 'flow' | 'cart' | 'decide';

@Component({
  selector: 'app-landing-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="como-funciona"
      class="scroll-mt-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/90 to-slate-100/80 py-section-lg dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-3xl text-center">
          <p
            class="text-xs font-bold uppercase tracking-[0.22em] text-accent dark:text-teal-400"
          >
            Qué puedes controlar
          </p>
          <h2 class="mt-4 text-4xl font-bold tracking-tight text-primary dark:text-slate-100 sm:text-5xl">
            Todo lo que necesitas para operar con más control
          </h2>
          <p class="mt-4 text-lg leading-relaxed text-secondary dark:text-slate-400 sm:text-xl">
            Organiza lo más importante de tu negocio en una sola plataforma: inventario, ventas, compras, clientes y
            reportes.
          </p>
        </div>

        <div class="mt-16 grid gap-8 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 xl:gap-8">
          @for (step of steps; track step.title; let i = $index) {
            <div
              class="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1.5 hover:border-teal-300/60 hover:shadow-card-hover dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-teal-600/40"
            >
              <div
                class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-accent shadow-inner ring-2 ring-teal-100/80 dark:from-teal-950/80 dark:to-slate-900 dark:text-teal-300 dark:ring-teal-800/60"
                aria-hidden="true"
              >
                @switch (step.icon) {
                  @case ('register') {
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
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
                    </svg>
                  }
                  @case ('flow') {
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
                      <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
                      <path d="M14 3v4h4" />
                      <path d="M8 13h8" />
                      <path d="M8 17h8" />
                    </svg>
                  }
                  @case ('cart') {
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
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.94-1.51L23 6H6" />
                    </svg>
                  }
                  @case ('decide') {
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
                      <path d="m7 11 4 4 4-8" />
                      <path d="M7 17h10" />
                    </svg>
                  }
                }
              </div>
              <span
                class="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-secondary shadow-sm dark:bg-slate-800 dark:text-slate-400"
                >{{ i + 1 }}</span
              >
              <h3 class="text-xl font-bold text-primary dark:text-slate-100">{{ step.title }}</h3>
              <p class="mt-3 text-base leading-relaxed text-secondary dark:text-slate-400">{{ step.body }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingHowItWorksComponent {
  readonly steps: Array<{ title: string; body: string; icon: StepIcon }> = [
    {
      title: 'Inventario en tiempo real',
      body:
        'Ve qué productos tienes disponibles, cuáles necesitan reposición y qué movimientos se registran cada día.',
      icon: 'register'
    },
    {
      title: 'Ventas y movimientos',
      body:
        'Registra entradas, salidas y actividad del negocio con más claridad y menos errores operativos.',
      icon: 'flow'
    },
    {
      title: 'Compras y productos',
      body:
        'Mantén orden sobre productos, abastecimiento y cambios de inventario sin depender de procesos manuales.',
      icon: 'cart'
    },
    {
      title: 'Reportes claros',
      body:
        'Consulta información útil para entender qué se mueve más, qué requiere atención y cómo va tu operación.',
      icon: 'decide'
    }
  ];
}
