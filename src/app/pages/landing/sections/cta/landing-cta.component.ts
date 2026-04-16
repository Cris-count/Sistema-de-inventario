import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-landing-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiButtonComponent],
  template: `
    <section
      class="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 px-4 py-16 text-slate-50 sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_0%,rgba(45,212,191,0.35),transparent)]"
      ></div>
      <div class="relative mx-auto max-w-4xl text-center">
        <h2 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Pon tu inventario en orden esta semana
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
          Crea tu espacio de trabajo, invita al equipo y empieza con movimientos reales. Si ya tienes cuenta, entra directo al panel.
        </p>
        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <app-ui-button variant="gradient" size="lg" to="/registro">Crear cuenta</app-ui-button>
          <app-ui-button
            variant="secondary"
            size="lg"
            class="!border-white/20 !bg-white/10 !text-white hover:!bg-white/15"
            to="/login"
            >Iniciar sesión</app-ui-button
          >
          <app-ui-button
            variant="ghost"
            size="lg"
            class="!text-slate-100 hover:!bg-white/10"
            to="/app"
            >Ir al panel</app-ui-button
          >
        </div>
      </div>
    </section>
  `
})
export class LandingCtaComponent {}
