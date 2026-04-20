import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="faq" class="bg-surface py-section dark:bg-slate-900">
      <div class="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8 lp-section-pad">
        <h2 class="text-center text-3xl font-semibold tracking-tight text-primary dark:text-slate-100 sm:text-4xl">
          Preguntas frecuentes
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-center text-lg text-secondary dark:text-slate-400">
          Respuestas cortas para decidir rápido. Si necesitas algo más específico, el equipo te acompaña en la puesta en marcha.
        </p>

        <div class="mt-10 space-y-3">
          @for (item of faqs; track item.q) {
            <details
              class="group rounded-2xl border border-slate-200/80 bg-background px-4 py-3 shadow-sm transition-colors open:shadow-soft dark:border-slate-600/70 dark:bg-slate-800/60 dark:open:bg-slate-800/80"
            >
              <summary
                class="cursor-pointer list-none text-left text-sm font-semibold text-primary dark:text-slate-100 outline-none marker:content-none [&::-webkit-details-marker]:hidden"
              >
                <span class="flex items-center justify-between gap-3">
                  {{ item.q }}
                  <span
                    class="text-secondary transition group-open:rotate-45 dark:text-slate-300"
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
      q: '¿Puedo empezar gratis?',
      a: 'Sí. Puedes crear tu cuenta y empezar a usar el sistema con el plan inicial sin costo, para validar que se ajusta a tu negocio antes de escalar.'
    },
    {
      q: '¿Puedo cambiar de plan después?',
      a: 'Sí, puedes subir de plan cuando lo necesites. La información que ya cargaste sigue intacta y simplemente se desbloquean nuevas funciones y mayor capacidad.'
    },
    {
      q: '¿Qué pasa si necesito más usuarios o más bodegas?',
      a: 'Cada plan tiene un tope claro de usuarios y bodegas. Si necesitas más, basta con cambiar a un plan superior — el sistema te avisa y te recomienda la mejor opción.'
    },
    {
      q: '¿Qué incluye cada plan?',
      a: 'Más arriba puedes ver la comparativa con los módulos y capacidades de cada plan: usuarios, bodegas, productos, reportes, transferencias, ajustes e historial.'
    },
    {
      q: '¿Necesito instalar algo?',
      a: 'No. Es una aplicación web: entras desde el navegador en computador, tablet o celular. Sin instalaciones ni servidores propios.'
    },
    {
      q: '¿Cómo me ayuda a controlar mi negocio?',
      a: 'Centraliza productos, movimientos, bodegas y usuarios en un solo lugar. Reduces errores de registro, ves en tiempo real lo que tienes y tomas decisiones con datos reales en vez de suposiciones.'
    }
  ];
}
