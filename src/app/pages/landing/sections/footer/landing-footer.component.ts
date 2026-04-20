import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LANDING_CONTACT, buildMailtoLink, buildWhatsAppLink } from '../../config/landing-contact';

/**
 * Footer comercial. Estructura por columnas con producto, soporte y contacto.
 * No agrega rutas inexistentes: todos los enlaces internos van a anchors de
 * la misma landing o a rutas reales (/login, /registro).
 */
@Component({
  selector: 'app-landing-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer
      class="border-t border-slate-200/80 bg-background py-12 dark:border-slate-800 dark:bg-slate-950"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div class="flex items-center gap-2.5">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-accent to-accent-strong text-sm font-bold text-white shadow-soft"
                >IV</span
              >
              <div>
                <p class="text-sm font-semibold text-primary dark:text-slate-100">Inventario Pro</p>
                <p class="text-xs text-secondary dark:text-slate-400">Control simple para tu inventario.</p>
              </div>
            </div>
            <p class="mt-4 text-sm leading-relaxed text-secondary dark:text-slate-400">
              Software pensado para pymes en Colombia que quieren operar con más orden, menos
              errores y crecer sin perder el control.
            </p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-primary dark:text-slate-100">
              Producto
            </p>
            <nav class="mt-4 flex flex-col gap-2 text-sm text-secondary dark:text-slate-400">
              <a
                routerLink="/landing"
                fragment="soluciones"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >Soluciones</a
              >
              <a
                routerLink="/landing"
                fragment="funcionalidades"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >Funcionalidades</a
              >
              <a
                routerLink="/landing"
                fragment="panel"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >Panel</a
              >
              <a
                routerLink="/landing"
                fragment="beneficios"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >Beneficios</a
              >
              <a
                routerLink="/landing"
                fragment="planes"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >Planes</a
              >
            </nav>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-primary dark:text-slate-100">
              Soporte
            </p>
            <nav class="mt-4 flex flex-col gap-2 text-sm text-secondary dark:text-slate-400">
              <a
                routerLink="/landing"
                fragment="faq"
                class="no-underline hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:hover:text-slate-100"
                >FAQ</a
              >
              <a routerLink="/login" class="no-underline hover:text-primary dark:hover:text-slate-100"
                >Iniciar sesión</a
              >
              <a routerLink="/registro" class="no-underline hover:text-primary dark:hover:text-slate-100"
                >Empieza ahora</a
              >
              <a [href]="whatsappLink" target="_blank" rel="noopener" class="no-underline hover:text-primary dark:hover:text-slate-100"
                >Hablar por WhatsApp</a
              >
            </nav>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-primary dark:text-slate-100">
              Contacto
            </p>
            <ul class="mt-4 flex flex-col gap-2 text-sm text-secondary dark:text-slate-400">
              <li>
                <a [href]="mailto" class="no-underline hover:text-primary dark:hover:text-slate-100">
                  {{ contact.email }}
                </a>
              </li>
              <li>
                <a [href]="contact.phoneHref" class="no-underline hover:text-primary dark:hover:text-slate-100">
                  {{ contact.phoneDisplay }}
                </a>
              </li>
              <li>Lunes a viernes · Horario laboral COT</li>
            </ul>
          </div>
        </div>

        <div
          class="mt-10 flex flex-col gap-3 border-t border-slate-200/80 pt-6 text-xs text-secondary dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>© {{ year }} Inventario Pro. Todos los derechos reservados.</p>
          <p>Hecho para pymes en Colombia.</p>
        </div>
      </div>
    </footer>
  `
})
export class LandingFooterComponent {
  readonly year = new Date().getFullYear();
  protected readonly contact = LANDING_CONTACT;
  protected readonly whatsappLink = buildWhatsAppLink();
  protected readonly mailto = buildMailtoLink();
}
