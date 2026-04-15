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
          Crea tu espacio de trabajo, invita al equipo y empieza con movimientos reales. Si ya tienes cuenta, inicia sesión para entrar al panel.
        </p>
        <div class="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <app-ui-button variant="landing-primary" class="w-full sm:w-auto" linkTo="/registro"
            >Crear mi cuenta</app-ui-button
          >
          <app-ui-button
            variant="landing-secondary"
            class="w-full !border-white/30 !bg-white/10 !text-white hover:!bg-white/15 sm:w-auto"
            linkTo="/login"
            >Iniciar sesión</app-ui-button
          >
          <app-ui-button
            variant="landing-navbar"
            class="w-full !min-h-[44px] !bg-white/10 !text-slate-100 hover:!bg-white/20 sm:w-auto"
            linkTo="/app"
            >Ir al panel (si ya iniciaste sesión)</app-ui-button
          >
        </div>
      </div>
    </section>
  `
})
export class LandingCtaComponent {}
