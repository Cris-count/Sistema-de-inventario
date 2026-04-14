import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="border-t border-slate-200/80 bg-background py-10">
      <div class="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div class="flex items-center gap-2.5">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-teal-600 text-sm font-bold text-white shadow-soft"
            >IV</span
          >
          <div>
            <p class="text-sm font-semibold text-primary">Inventario Pro</p>
            <p class="text-xs text-secondary">Control operativo, sin ruido.</p>
          </div>
        </div>

        <nav class="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-secondary">
          <a href="#funciones" class="no-underline hover:text-primary">Funciones</a>
          <a href="#planes" class="no-underline hover:text-primary">Planes</a>
          <a href="#faq" class="no-underline hover:text-primary">FAQ</a>
          <a routerLink="/login" class="no-underline hover:text-primary">Iniciar sesión</a>
          <a routerLink="/registro" class="no-underline hover:text-primary">Registro</a>
          <a routerLink="/app" class="no-underline hover:text-primary">Panel</a>
        </nav>

        <p class="text-xs text-secondary">© {{ year }} Inventario Pro. Todos los derechos reservados.</p>
      </div>
    </footer>
  `
})
export class LandingFooterComponent {
  readonly year = new Date().getFullYear();
}
