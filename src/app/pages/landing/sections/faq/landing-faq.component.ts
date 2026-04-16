import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="faq" class="bg-surface py-section dark:bg-slate-900">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-center text-lg text-secondary dark:text-slate-400">
          Respuestas cortas para decidir rápido. Si necesitas algo más específico, el equipo te acompaña en la puesta en marcha.
        </p>

        <div class="mt-10 space-y-3">
          @for (item of faqs; track item.q) {
            <details
              class="group rounded-2xl border border-slate-200/80 bg-background px-4 py-3 shadow-sm open:shadow-soft dark:border-slate-700/80 dark:bg-slate-950"
            >
              <summary
                class="cursor-pointer list-none text-left text-sm font-semibold text-primary dark:text-slate-100 outline-none marker:content-none [&::-webkit-details-marker]:hidden"
              >
                <span class="flex items-center justify-between gap-3">
                  {{ item.q }}
                  <span
                    class="text-secondary transition group-open:rotate-45 dark:text-slate-500"
                    aria-hidden="true"
                    >+</span
                  >
                </span>
              </summary>
              <p class="mt-3 text-sm leading-relaxed text-secondary dark:text-slate-400">{{ item.a }}</p>
            </details>
          }
        </div>
      </div>
    </section>
  `
})
export class LandingFaqComponent {
  readonly faqs = [
    {
      q: '¿Puedo migrar desde planillas o desde otro sistema?',
      a: 'Sí. La mayoría de los equipos importa catálogo y saldos iniciales, luego congela el Excel “maestro” para evitar divergencias.'
    },
    {
      q: '¿Cómo funcionan roles y permisos?',
      a: 'Puedes separar administración, bodega, compras y lectura. Cada perfil ve solo lo necesario para su trabajo diario.'
    },
    {
      q: '¿Hay límites por plan?',
      a: 'Los planes están pensados para crecer con tu operación: bodegas, usuarios y consumo pueden ajustarse según tu suscripción.'
    },
    {
      q: '¿Necesito instalar algo en servidores propios?',
      a: 'No para empezar: el panel es web. Si tu empresa requiere despliegue dedicado, se evalúa como proyecto aparte.'
    }
  ];
}
