import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRANDING_ASSETS } from '../../../../core/branding.paths';
import { UiButtonComponent } from '../../../../shared/components/ui/button/ui-button.component';

@Component({
  selector: 'app-landing-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent],
  template: `
    <section id="producto" class="lp-hero relative overflow-hidden text-slate-50">
      <div
        class="lp-hero-photo-layer absolute inset-0 z-0"
        [style.background-image]="heroBackgroundImage"
        aria-hidden="true"
      ></div>
      <div class="lp-hero-photo-scrim absolute inset-0 z-[1]" aria-hidden="true"></div>

      <div class="lp-hero-bg" aria-hidden="true"></div>
      <div class="lp-hero-right-glow" aria-hidden="true"></div>
      <div class="lp-hero-vignette" aria-hidden="true"></div>

      <div
        class="relative z-10 mx-auto max-w-7xl px-5 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24 lp-hero-pad"
      >
        <div class="max-w-2xl lg:max-w-3xl">
          <div class="mb-3 sm:mb-4">
            <img
              [src]="brand.logoFull"
              alt="Cersik"
              class="block h-auto w-auto max-h-20 max-w-[min(100%,28rem)] object-contain object-left drop-shadow-[0_2px_16px_rgba(0,0,0,0.45)] sm:max-h-24 sm:max-w-[32rem] lg:max-h-28 lg:max-w-xl xl:max-h-[7.5rem] xl:max-w-2xl"
              width="480"
              height="112"
              loading="eager"
            />
          </div>
          <p
            class="max-w-prose text-[13px] font-semibold uppercase leading-snug tracking-[0.14em] text-teal-100/85 drop-shadow-[0_1px_14px_rgba(0,0,0,0.45)] sm:text-sm sm:tracking-[0.16em]"
          >
            Hecho para PYMES en Colombia
          </p>

          <h1
            class="hero-headline mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.55)] sm:mt-6 sm:text-5xl sm:leading-[1.06] lg:text-6xl lg:leading-[1.02]"
          >
            Controla inventario, ventas y compras desde un solo lugar
          </h1>

          <p
            class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 drop-shadow-[0_1px_18px_rgba(0,0,0,0.45)] sm:text-xl"
          >
            Consulta existencias, registra movimientos, organiza productos y toma decisiones con reportes claros en una
            plataforma hecha para el día a día de tu negocio.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:gap-4">
            <div class="flex flex-wrap items-center gap-3">
              <app-ui-button hostClass="contents" variant="gradient" size="lg" class="!rounded-full" to="/registro">Empieza ahora</app-ui-button>
              <app-ui-button
                hostClass="contents"
                variant="landing-on-dark"
                class="!min-h-[48px] !min-w-0 !rounded-full !border-0 !bg-teal-500/32 !px-6 !py-3 !text-base !font-semibold !text-white !shadow-none hover:!bg-teal-400/42 focus-visible:!outline-white"
                to="/login"
                >Iniciar sesión</app-ui-button
              >
            </div>
            <a
              routerLink="/landing"
              fragment="funcionalidades"
              class="inline-flex w-fit max-w-full items-center text-sm font-semibold text-teal-100 drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)] underline-offset-4 transition hover:text-white hover:underline focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Ver funcionalidades
            </a>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300 sm:text-[15px]">
            <span>Sin tarjeta</span>
            <span class="h-1 w-1 rounded-full bg-slate-500"></span>
            <span>Configuración rápida</span>
            <span class="h-1 w-1 rounded-full bg-slate-500"></span>
            <span>Hecho para operación real</span>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-white/12 bg-slate-950/35 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ventas</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Registra y consulta al instante</p>
            </div>
            <div class="rounded-2xl border border-white/12 bg-slate-950/35 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Inventario</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Controla stock y movimientos</p>
            </div>
            <div class="rounded-2xl border border-white/12 bg-slate-950/35 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
              <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Reportes</p>
              <p class="mt-1 text-sm font-medium leading-snug text-white">Decide con información clara</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .lp-hero-photo-layer {
      background-size: cover;
      background-repeat: no-repeat;
      /* Encuadre hacia la derecha: protagonismo visual sin solapar el copy */
      background-position: 88% 42%;
      filter: brightness(0.97) saturate(0.98);
      pointer-events: none;
    }
    /* Zona copy (izq.): protección fuerte. Centro–derecha: transición larga y foto casi limpia */
    .lp-hero-photo-scrim {
      pointer-events: none;
      background:
        linear-gradient(
          108deg,
          rgba(7, 17, 26, 0.94) 0%,
          rgba(7, 17, 26, 0.86) 18%,
          rgba(7, 17, 26, 0.52) 36%,
          rgba(7, 17, 26, 0.16) 54%,
          rgba(7, 17, 26, 0.04) 68%,
          rgba(7, 17, 26, 0) 78%
        ),
        linear-gradient(
          180deg,
          rgba(7, 17, 26, 0.14) 0%,
          transparent 28%,
          transparent 72%,
          rgba(7, 17, 26, 0.1) 100%
        );
      box-shadow: inset min(52vw, 36rem) 0 140px -50px rgba(7, 17, 26, 0.28);
    }
    @media (max-width: 1023px) {
      .lp-hero-photo-layer {
        background-position: 78% 48%;
        filter: brightness(0.9) saturate(0.96);
      }
      .lp-hero-photo-scrim {
        background:
          linear-gradient(
            180deg,
            rgba(7, 17, 26, 0.18) 0%,
            rgba(7, 17, 26, 0.55) 38%,
            rgba(7, 17, 26, 0.72) 100%
          ),
          linear-gradient(
            100deg,
            rgba(7, 17, 26, 0.92) 0%,
            rgba(7, 17, 26, 0.72) 34%,
            rgba(7, 17, 26, 0.28) 58%,
            rgba(7, 17, 26, 0.06) 76%,
            rgba(7, 17, 26, 0) 88%
          );
        box-shadow: inset min(70vw, 28rem) 0 100px -40px rgba(7, 17, 26, 0.22);
      }
    }
    @media (max-width: 639px) {
      .lp-hero-photo-layer {
        background-position: 72% 22%;
        filter: brightness(0.82) saturate(0.93);
      }
      .lp-hero-photo-scrim {
        background:
          linear-gradient(
            180deg,
            rgba(7, 17, 26, 0.96) 0%,
            rgba(7, 17, 26, 0.9) 32%,
            rgba(7, 17, 26, 0.76) 100%
          ),
          linear-gradient(
            90deg,
            rgba(7, 17, 26, 0.88) 0%,
            rgba(7, 17, 26, 0.35) 100%
          );
        box-shadow: inset 0 0 72px rgba(7, 17, 26, 0.2);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .lp-hero-photo-layer {
        filter: brightness(0.93) saturate(0.96);
      }
    }
  `
})
export class LandingHeroComponent {
  protected readonly brand = BRANDING_ASSETS;
  /** Ruta servida por Angular CLI en runtime. */
  readonly heroBackgroundImage = "url('assets/images/landing/portada.jpeg')";
}
