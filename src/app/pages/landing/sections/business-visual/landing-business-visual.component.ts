import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-landing-business-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      id="producto-visual"
      class="relative scroll-mt-24 overflow-hidden border-y border-slate-800/80 bg-slate-950 py-section-lg text-slate-100"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0)_0%,rgba(15,118,110,0.06)_50%,rgba(15,23,42,0)_100%)]"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-teal-400/90">Vista de producto</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.35rem] lg:leading-tight">
            El panel que tu equipo usa cada día
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            Métricas, alertas y tabla de stock en la misma pantalla: menos idas y venidas entre archivos y más decisiones con
            datos actuales.
          </p>
        </div>

        <div class="mt-12 lg:mt-14">
          <div class="relative mx-auto w-full max-w-6xl">
            <div
              class="relative overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/5 sm:rounded-[1.35rem]"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 bg-slate-900/95 px-4 py-3.5 sm:px-6"
              >
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-red-500/90"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-amber-400/90"></span>
                  <span class="h-2.5 w-2.5 rounded-full bg-emerald-500/90"></span>
                </div>
                <span class="text-xs font-semibold text-slate-500">Inventario · vista general</span>
                <div class="hidden w-full items-center justify-end gap-2 sm:flex sm:w-auto">
                  <span
                    class="rounded-md border border-slate-600/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300"
                    >En vivo</span
                  >
                  <span
                    class="rounded-md border border-teal-500/40 bg-teal-950/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-200/95"
                    >Sincronizado</span
                  >
                </div>
              </div>

              <div class="relative bg-slate-950 p-3 sm:p-5 lg:p-6">
                <div
                  class="pointer-events-none absolute left-4 top-4 z-20 hidden max-w-[11rem] rounded-lg border border-slate-600/80 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur-sm ring-1 ring-white/5 sm:block lg:left-6 lg:top-6 lg:max-w-[12rem] lg:p-3"
                  aria-hidden="true"
                >
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resumen rápido</p>
                  <p class="mt-1 text-sm font-semibold text-white">Stock bajo control</p>
                  <p class="mt-0.5 text-[11px] leading-snug text-slate-400">
                    Alertas y movimientos visibles sin salir de la vista.
                  </p>
                </div>
                <div
                  class="pointer-events-none absolute bottom-4 right-4 z-20 hidden max-w-[10.5rem] rounded-lg border border-amber-500/35 bg-amber-950/90 p-2.5 shadow-xl ring-1 ring-amber-500/20 sm:block lg:bottom-6 lg:right-6"
                  aria-hidden="true"
                >
                  <p class="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">Atención</p>
                  <p class="mt-0.5 text-xs font-semibold text-amber-50">8 SKUs en mínimo</p>
                  <p class="mt-0.5 text-[11px] text-amber-100/85">Revisa antes de comprar.</p>
                </div>

                <div
                  class="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 shadow-inner ring-1 ring-slate-800/80 sm:rounded-xl"
                >
                  <img
                    src="/landing/showcase-dashboard.svg"
                    alt="Vista general del panel de inventario con métricas y estado operativo"
                    width="1200"
                    height="675"
                    loading="lazy"
                    decoding="async"
                    class="relative z-10 h-auto w-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class LandingBusinessVisualComponent {}
