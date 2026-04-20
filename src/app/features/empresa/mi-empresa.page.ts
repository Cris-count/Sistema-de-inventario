import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import type { EmpresaActualDto } from '../../core/models/empresa-actual.model';
import type { EmpresaCapacidadSnapshot } from '../../core/models/empresa-capacidad.model';
import type { PublicPlanDto } from '../../core/models/public-plan.model';
import { EmpresaCapacidadService } from '../../core/services/empresa-capacidad.service';
import { EmpresaActualService } from '../../core/services/empresa-actual.service';
import { PlanesService } from '../../core/services/planes.service';
import { ROLES_ADMIN } from '../../core/auth/app-roles';
import { AuthService } from '../../core/auth/auth.service';
import { resolvePlanBlockUx } from '../../core/util/api-error';
import { planUpgradeContext } from '../../core/services/plan-upgrade-context';
import { formatPlanPrecioMensual, planMensualCadence } from '../../core/util/format-plan-price';
import { MODULO_LABELS } from '../../core/util/modulo-labels';
import { fadeIn, fadeUp, slideDown, staggerList } from '../../core/animations';

@Component({
  selector: 'app-mi-empresa',
  imports: [ReactiveFormsModule],
  animations: [fadeIn, fadeUp, slideDown, staggerList],
  template: `
    <div class="page stack">
      <header class="page-header">
        <h1>Mi empresa</h1>
        <p class="page-lead">Resumen de tu cuenta empresarial, plan actual y estado de acceso.</p>
      </header>

      @if (loading()) {
        <div class="card"><span class="spinner"></span></div>
      } @else if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }}
        </div>
      } @else if (empresa(); as e) {
        <section class="card stack">
          <div class="row-between">
            <h2 class="card-title-flush">{{ e.nombre }}</h2>
            <span class="badge" [class.badge-ok]="statusInfo().kind === 'ok'" [class.badge-off]="statusInfo().kind !== 'ok'">
              {{ statusInfo().title }}
            </span>
          </div>
          <p class="muted mt-tight">{{ statusInfo().description }}</p>
          <p class="page-lead mt-lead">
            <strong>Acceso:</strong> {{ accessInfo() }}
          </p>
        </section>

        <section class="card stack">
          <h2>Suscripción</h2>
          <div class="row">
            <div class="field field-flex-1">
              <label>Tu plan actual</label>
              <p>{{ e.planNombre || 'No disponible' }}</p>
            </div>
            <div class="field field-flex-1">
              <label>Estado de suscripción</label>
              <p>{{ subscriptionLabel() }}</p>
            </div>
          </div>
        </section>

        <section id="cambio-plan" class="card stack">
          <h2>Cambiar de plan</h2>
          @if (cambioPlanMsg()) {
            <p class="page-lead">{{ cambioPlanMsg() }}</p>
          }
          @if (cambioPlanErr()) {
            <div class="alert alert-error" role="alert">{{ cambioPlanErr() }}</div>
          }
          @if (e.cambioPlanPendientePagoId) {
            <div
              @slideDown
              id="cambio-pendiente"
              class="stack plan-pending-callout"
              role="status"
            >
              <div class="row-between-top">
                <div>
                  <h3 class="pending-plan-title">Tienes un cambio de plan pendiente de pago</h3>
                  <p class="muted mt-sub">
                    Tu plan actual sigue activo hasta que se confirme el pago. No pierdas este cambio: completa el proceso
                    antes de la fecha límite.
                  </p>
                </div>
                <span
                  class="badge"
                  [class.badge-ok]="pendingUrgency().level === 'normal'"
                  [class.badge-off]="pendingUrgency().level === 'high'"
                >
                  {{ pendingUrgency().label }}
                </span>
              </div>
              <div class="row row-stretch mt-block">
                <div class="field field-flex-1">
                  <label>Plan actual</label>
                  <p class="p-flush"><strong>{{ e.planNombre || e.planCodigo || '—' }}</strong></p>
                </div>
                <div class="field field-flex-1">
                  <label>Plan que solicitaste</label>
                  <p class="p-flush">
                    <strong>{{ e.cambioPlanPendientePlanNombre || e.cambioPlanPendientePlanCodigo || '—' }}</strong>
                  </p>
                </div>
              </div>
              @if (planDestinoPublico(); as pub) {
                <p class="page-lead mt-block">{{ pub.descripcionCorta }}</p>
                @if (pub.features.length) {
                  <p class="muted mt-standard"><strong>En este plan destacan:</strong></p>
                  <ul class="muted-list">
                    @for (f of pub.features.slice(0, 4); track f) {
                      <li>{{ f }}</li>
                    }
                  </ul>
                }
              } @else {
                <p class="page-lead mt-block">
                  Cuando el pago quede confirmado, tu suscripción adoptará los límites y funciones del plan que elegiste.
                </p>
              }
              @if (tiempoRestanteLinea(); as tl) {
                <p class="page-lead mt-block">{{ tl }}</p>
              }
              <p class="muted mt-standard">
                Si no completas el proceso antes de la fecha límite, este cambio se cancelará automáticamente y podrás
                iniciar uno nuevo. Puedes cancelarlo tú mismo si ya no lo necesitas.
              </p>
              <p class="muted mt-sub">
                <strong>Referencia para soporte o seguimiento:</strong> {{ e.cambioPlanPendientePagoId }}
                <span class="muted"> (también puedes indicar <strong>PAGO-{{ e.cambioPlanPendientePagoId }}</strong>)</span>
              </p>
              @if (e.cambioPlanPendienteCreadoAt) {
                <p class="muted mt-xs">Solicitado: {{ fmtDateTime(e.cambioPlanPendienteCreadoAt) }}</p>
              }
              @if (e.cambioPlanPendienteExpiraAt) {
                <p class="muted mt-xs">
                  Fecha límite: {{ fmtDateTime(e.cambioPlanPendienteExpiraAt) }}
                </p>
              }
              <p class="muted mt-standard">
                El cobro y la confirmación los gestiona el proceso de facturación de la plataforma; aquí ves el estado de
                tu solicitud.
              </p>
              <div class="row mt-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="referenciaCopiadaFlashing() || !e.cambioPlanPendientePagoId"
                  (click)="copiarReferenciaPago(e.cambioPlanPendientePagoId!)"
                >
                  {{ referenciaCopiadaFlashing() ? 'Referencia copiada' : 'Copiar referencia de pago' }}
                </button>
                <button type="button" class="btn" (click)="scrollToCambioPlanCards()">Ver planes otra vez</button>
                <button
                  type="button"
                  class="btn"
                  [disabled]="cancelPlanBusy() || planChangeBusy()"
                  (click)="cancelarCambioPendiente()"
                >
                  @if (cancelPlanBusy()) {
                    Cancelando...
                  } @else {
                    Cancelar este cambio
                  }
                </button>
              </div>
            </div>
          }
          @if (e.cambioPlanMensaje) {
            <div class="alert alert-info" role="status">{{ e.cambioPlanMensaje }}</div>
          }
          @if (publicPlanesLoading()) {
            <p><span class="spinner"></span></p>
          } @else if (publicPlanesErr()) {
            <p class="muted">{{ publicPlanesErr() }}</p>
          } @else {
            @if (contextualRecommendation(); as rec) {
              <div
                @fadeUp
                class="stack"
                style="
                  margin: 0;
                  padding: 1rem 1.1rem;
                  border: 1px solid rgb(var(--color-accent) / 0.35);
                  border-radius: 8px;
                  background: rgb(var(--color-accent) / 0.08);
                "
              >
                <div
                  class="row"
                  style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem"
                >
                  <div>
                    <p
                      class="muted"
                      style="margin: 0; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.72rem"
                    >
                      {{ rec.reason === 'fallback' ? 'Plan recomendado para ti' : 'Recomendación para tu caso' }}
                    </p>
                    <h3 style="margin: 0.15rem 0 0; font-size: 1.15rem">
                      {{ rec.title }}
                      <span class="muted" style="font-weight: 400; font-size: 0.95rem; display: block; margin-top: 0.2rem">
                        {{ rec.plan.nombre }} · {{ etiquetaPrecioPublico(rec.plan) }}
                      </span>
                    </h3>
                  </div>
                  <span class="badge badge-ok">
                    {{ rec.reason === 'fallback' ? 'Más elegido' : 'Según tu uso' }}
                  </span>
                </div>
                <p class="page-lead" style="margin: 0.5rem 0 0">{{ rec.body }}</p>
                @if (rec.benefits.length) {
                  <ul style="margin: 0.35rem 0 0; padding-left: 1.25rem">
                    @for (b of rec.benefits; track b) {
                      <li>{{ b }}</li>
                    }
                  </ul>
                }
                <div class="row" style="margin-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem">
                  <button
                    type="button"
                    class="btn btn-primary"
                    [disabled]="planChangeBusy() || cancelPlanBusy()"
                    (click)="iniciarCambioPlan(rec.plan.codigo)"
                  >
                    @if (planChangeBusy()) {
                      …
                    } @else {
                      {{ rec.primaryCtaLabel }}
                    }
                  </button>
                  <button type="button" class="btn" (click)="scrollToCambioPlanCards()">
                    Ver todos los planes
                  </button>
                </div>
              </div>
            }

            <div
              id="planes-disponibles"
              class="row"
              style="flex-wrap: wrap; gap: 1rem; align-items: stretch"
              [@staggerList]="publicPlanes().length"
            >
              @for (p of publicPlanes(); track p.codigo) {
                <div
                  class="card"
                  [style.flex]="'1'"
                  [style.minWidth]="'220px'"
                  [style.padding]="'1rem'"
                  [style.boxSizing]="'border-box'"
                  [style.position]="'relative'"
                  [style.border]="
                    isHighlightedPlan(p, e.planCodigo)
                      ? '1px solid rgb(var(--color-accent) / 0.5)'
                      : '1px solid var(--border)'
                  "
                  [style.boxShadow]="
                    isHighlightedPlan(p, e.planCodigo)
                      ? '0 0 0 2px rgb(var(--color-accent) / 0.35)'
                      : 'none'
                  "
                  [style.transform]="isHighlightedPlan(p, e.planCodigo) ? 'scale(1.03)' : 'none'"
                  [style.zIndex]="isHighlightedPlan(p, e.planCodigo) ? '1' : 'auto'"
                >
                  @if (isHighlightedPlan(p, e.planCodigo)) {
                    <span
                      class="badge badge-ok"
                      style="position: absolute; top: -0.6rem; left: 1rem; font-size: 0.72rem"
                    >
                      Recomendado
                    </span>
                  }
                  <p style="margin: 0"><strong>{{ p.nombre }}</strong></p>
                  @if (p.codigo === e.planCodigo) {
                    <p class="muted mt-sub">Tu plan actual</p>
                  } @else {
                    <p class="muted mt-sub">{{ etiquetaPrecioPublico(p) }}</p>
                    <button
                      type="button"
                      class="btn btn-primary mt-sub"
                      [disabled]="planChangeBusy() || cancelPlanBusy() || !!e.cambioPlanPendientePagoId"
                      (click)="iniciarCambioPlan(p.codigo)"
                    >
                      @if (planChangeBusy()) {
                        …
                      } @else {
                        Cambiar a este plan
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <div @fadeUp class="stack" style="margin-top: 0.25rem">
              <h3 style="margin: 0; font-size: 1.05rem">Por qué cambiar de plan</h3>
              <ul style="margin: 0.35rem 0 0; padding-left: 1.25rem">
                <li>Más bodegas y usuarios a medida que crece tu operación, sin cambiar de sistema.</li>
                <li>Mismos datos y misma forma de trabajar: solo se amplían los límites y módulos incluidos.</li>
                <li>Puedes iniciar el cambio cuando quieras y tu plan actual sigue activo hasta que se confirme el pago.</li>
              </ul>
            </div>

            @if (!e.cambioPlanPendientePagoId) {
              <div
                @fadeUp
                class="row"
                style="
                  justify-content: space-between;
                  align-items: center;
                  flex-wrap: wrap;
                  gap: 0.75rem;
                  margin-top: 0.25rem;
                  padding: 1rem 1.1rem;
                  border: 1px solid var(--border);
                  border-radius: 8px;
                "
              >
                <div style="flex: 1; min-width: 220px">
                  <p style="margin: 0; font-weight: 600">¿Listo para escalar tu operación?</p>
                  <p class="muted" style="margin: 0.2rem 0 0">
                    Elige el plan que mejor acompañe tu crecimiento y actívalo cuando quieras.
                  </p>
                </div>
                <button
                  type="button"
                  class="btn btn-primary"
                  (click)="scrollToCambioPlanCards()"
                >
                  Elegir plan ahora
                </button>
              </div>
            }
          }
        </section>

        <section class="card stack">
          <h2>Incluido en tu plan</h2>
          <p class="muted">
            Esto refleja tu suscripción actual. El menú solo muestra lo que puedes usar hoy en la aplicación.
          </p>
          @if (modulosOrdenados().length === 0) {
            <p class="muted">No hay lista de módulos disponible por ahora.</p>
          } @else {
            <ul class="muted-list-spaced">
              @for (m of modulosOrdenados(); track m) {
                <li>{{ etiquetaModulo(m) }}</li>
              }
            </ul>
          }
          <p class="muted mt-loose">
            Si algo aparece aquí y no ves la opción en el menú, puede estar en preparación: no es un fallo técnico.
          </p>
        </section>

        <section @fadeUp class="card stack">
          <h2>Capacidad del plan</h2>
          @if (capacityLoading()) {
            <p><span class="spinner"></span></p>
          } @else {
            @if (capacityNearHint(); as hint) {
              <div class="alert alert-info" role="status">{{ hint }}</div>
            }
            @if (capacityError()) {
              <div class="alert alert-error" role="alert">{{ capacityError() }}</div>
            }
            @if (capacity(); as cap) {
              @if (cap.plan) {
                <p class="page-lead">
                  Tu plan activo es <strong>{{ cap.plan.nombre }}</strong
                  >.
                </p>
              } @else if (e.planNombre) {
                <p class="page-lead">Tu plan activo es <strong>{{ e.planNombre }}</strong>.</p>
              }
              <p class="muted">
                Regla visual de capacidad: desde 80% se marca como “cerca del límite” (no cambia reglas de negocio).
              </p>
              <div class="row">
                @for (r of cap.resources; track r.key) {
                  <div class="field field-min-220">
                    <label>{{ r.label }}</label>
                    @if (r.used == null) {
                      <p>No disponible</p>
                    } @else if (r.limit == null) {
                      <p>{{ r.used }} usados</p>
                    } @else {
                      <p>{{ r.used }} de {{ r.limit }} usados</p>
                      <p class="muted">Uso: {{ r.usagePct }}%</p>
                    }
                    <p class="muted">{{ r.helper }}</p>
                    @if (r.status === 'near') {
                      <span @fadeIn class="badge badge-warn">Cerca del límite</span>
                    } @else if (r.status === 'full') {
                      <span class="badge badge-danger">Límite alcanzado</span>
                    } @else if (r.status === 'ok') {
                      <span class="badge badge-ok">Capacidad disponible</span>
                    }
                  </div>
                }
              </div>
            }
          }
        </section>

        <section class="card stack">
          <h2>Datos de contacto</h2>
          <div class="row">
            <div class="field field-flex-1">
              <label>Identificación</label>
              <p>{{ e.identificacion || 'No registrada' }}</p>
            </div>
            <div class="field field-flex-1">
              <label>Email de contacto</label>
              <p>{{ e.emailContacto || 'No registrado' }}</p>
            </div>
            <div class="field field-flex-1">
              <label>Teléfono</label>
              <p>{{ e.telefono || 'No registrado' }}</p>
            </div>
          </div>
        </section>

        @if (canConfigurarAlertas()) {
          <section class="card stack">
            <h2>Alertas de inventario (pedidos a proveedor)</h2>
            <p class="muted mt-0">
              Correo a la empresa en copia cuando el stock llega al mínimo; el mensaje va al proveedor del producto (o al
              de la última entrada). Requiere módulo de proveedores y correo del proveedor configurado.
            </p>
            @if (alertasMsg()) {
              <div class="alert alert-success" role="status">{{ alertasMsg() }}</div>
            }
            @if (alertasErr()) {
              <div class="alert alert-error" role="alert">{{ alertasErr() }}</div>
            }
            <form [formGroup]="alertasForm" (ngSubmit)="guardarAlertas()" class="stack">
              <div class="field">
                <label>Email de notificaciones (copia en el correo al proveedor)</label>
                <input type="email" formControlName="emailNotificacionesInventario" placeholder="ej. compras@miempresa.com" />
                <p class="muted mt-xs">
                  Si lo deja vacío, se usa el email de contacto de la empresa. Debe ser un correo de la empresa, no del
                  usuario que inicia sesión.
                </p>
              </div>
              <div class="field">
                <label class="row row-checkbox">
                  <input type="checkbox" formControlName="alertasPedidoProveedorActivas" />
                  Enviar alertas automáticas al proveedor cuando el stock esté en o bajo el mínimo
                </label>
              </div>
              <div class="field field-max-280">
                <label>Cantidad máxima por pedido sugerido (opcional)</label>
                <input type="number" step="any" min="0" formControlName="pedidoProveedorCantidadMaxima" placeholder="Sin tope" />
                <p class="muted mt-xs">
                  Tope de unidades en un solo correo. Vacío o 0 = sin límite explícito (el texto del correo lo indica).
                </p>
              </div>
              <div class="row">
                <button type="submit" class="btn btn-primary" [disabled]="alertasGuardando()">Guardar ajustes</button>
              </div>
            </form>
          </section>
        }
      }
    </div>
  `
})
export class MiEmpresaPage implements OnInit, OnDestroy {
  private readonly empresaApi = inject(EmpresaActualService);
  private readonly capacidadApi = inject(EmpresaCapacidadService);
  private readonly planesApi = inject(PlanesService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  /** Actualiza cada minuto mientras hay cambio pendiente con expiración (texto de urgencia). */
  private readonly clockTick = signal(Date.now());
  private pendingClockId: ReturnType<typeof setInterval> | undefined;
  private copyFlashTimer: ReturnType<typeof setTimeout> | undefined;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly empresa = signal<EmpresaActualDto | null>(null);
  readonly capacityLoading = signal(false);
  readonly capacityError = signal<string | null>(null);
  readonly capacity = signal<EmpresaCapacidadSnapshot | null>(null);
  /**
   * Último `PLAN_*` de conversión observado antes de navegar a esta página
   * (consumido one-shot desde `planUpgradeContext`). Null si no hubo bloqueo previo.
   */
  readonly lastBlockCode = signal<string | null>(null);
  /**
   * Código técnico del módulo exacto bloqueado cuando el backend lo transporta
   * (sólo para `PLAN_MODULO_NO_INCLUIDO` / `PLAN_REPORTES_NO_INCLUIDO`).
   * `null` si no aplica o si el backend todavía no envía `blockModule`.
   */
  readonly lastBlockModule = signal<string | null>(null);
  readonly publicPlanes = signal<PublicPlanDto[]>([]);
  readonly publicPlanesLoading = signal(false);
  readonly publicPlanesErr = signal<string | null>(null);
  readonly planChangeBusy = signal(false);
  readonly cancelPlanBusy = signal(false);
  readonly cambioPlanMsg = signal<string | null>(null);
  readonly cambioPlanErr = signal<string | null>(null);
  readonly referenciaCopiadaFlashing = signal(false);
  readonly alertasGuardando = signal(false);
  readonly alertasMsg = signal<string | null>(null);
  readonly alertasErr = signal<string | null>(null);

  readonly canConfigurarAlertas = () => this.auth.hasAnyRole(ROLES_ADMIN);

  readonly alertasForm = this.fb.nonNullable.group({
    emailNotificacionesInventario: [''],
    alertasPedidoProveedorActivas: [true],
    pedidoProveedorCantidadMaxima: ['']
  });

  readonly statusInfo = computed(() => mapEmpresaStatus(this.empresa()?.estado));
  readonly accessInfo = computed(() => (this.statusInfo().kind === 'ok' ? 'Habilitado para ingresar' : 'Pendiente o restringido'));
  readonly subscriptionLabel = computed(() => mapSuscripcionStatus(this.empresa()?.suscripcionEstado));
  readonly modulosOrdenados = computed(() => {
    const raw = this.empresa()?.modulosHabilitados ?? [];
    return [...raw].sort((a, b) => a.localeCompare(b));
  });

  /** Aviso suave cuando algún recurso del snapshot marca uso ≥ umbral “cerca” (datos reales del API). */
  readonly capacityNearHint = computed((): string | null => {
    const cap = this.capacity();
    if (!cap?.resources?.length) return null;
    const near = cap.resources.filter((r) => r.status === 'near');
    if (!near.length) return null;
    const parts = near.map((r) => {
      if (r.limit != null && r.used != null) {
        const rest = Math.max(0, r.limit - r.used);
        return `${r.label}: llevas ${r.used} de ${r.limit} (${rest} antes de llegar al tope)`;
      }
      return `${r.label}: estás cerca del límite de tu plan`;
    });
    return `${parts.join('. ')}. Puedes revisar o ampliar tu plan en la sección Cambiar de plan.`;
  });

  /** Catálogo público del plan destino (si coincide el código); datos reales del API de planes. */
  readonly planDestinoPublico = computed((): PublicPlanDto | null => {
    const e = this.empresa();
    const codigo = e?.cambioPlanPendientePlanCodigo?.trim();
    if (!codigo) return null;
    const u = codigo.toUpperCase();
    return this.publicPlanes().find((p) => p.codigo.toUpperCase() === u) ?? null;
  });

  /**
   * Recomendación contextual para /app/mi-empresa.
   *
   * Se prioriza según el brief, en este orden estricto (una sola razón elegida):
   *  1. Módulo bloqueado (`PLAN_MODULO_NO_INCLUIDO` / `PLAN_REPORTES_NO_INCLUIDO`).
   *  2. Límite alcanzado (`PLAN_LIMITE_*` desde `lastBlockCode` o `capacity.status === 'full'`).
   *  3. Capacidad cerca del tope (`capacity.status === 'near'`).
   *  4. Fallback: plan con `recomendado: true` del backend.
   *
   * Reglas anti-alucinación:
   *  - El plan destino siempre sale de `publicPlanes()` (API real).
   *  - Para límites de usuarios/bodegas/productos se elige el plan *más pequeño*
   *    cuyo tope sea estrictamente mayor que el del plan actual (usando
   *    `maxUsuarios`, `maxBodegas`, `maxProductos` del catálogo público).
   *  - Para `PLAN_MODULO_NO_INCLUIDO` se elige el plan *más pequeño* cuyo
   *    conjunto de `modulos` sea superconjunto estricto del actual; el copy usa
   *    el delta real de módulos desbloqueados.
   *  - Para `PLAN_REPORTES_NO_INCLUIDO` se elige el plan más pequeño que agrega
   *    al menos un módulo del grupo reportes respecto al actual.
   *  - Si el backend aún no envía `modulos`/`maxProductos` (despliegue viejo),
   *    se cae al `recomendado: true`. Nunca se inventan reglas.
   *  - Oculta todo si hay cambio pendiente (para no competir con el bloque pendiente).
   */
  readonly contextualRecommendation = computed((): ContextualRecommendation | null => {
    const e = this.empresa();
    if (!e) return null;
    if (e.cambioPlanPendientePagoId) return null;

    const planes = this.publicPlanes();
    if (!planes.length) return null;

    const currentCode = e.planCodigo?.toUpperCase() ?? '';
    const currentPlan = planes.find((p) => p.codigo.toUpperCase() === currentCode) ?? null;
    const currentModulos = new Set<string>(
      e.modulosHabilitados ?? (currentPlan?.modulos ?? [])
    );
    const bc = this.lastBlockCode();
    const bm = this.lastBlockModule();
    const cap = this.capacity();

    // 1. Módulo bloqueado.
    //    Prioridad: match EXACTO por blockModule → superconjunto estricto → fallback.
    if (bc === 'PLAN_MODULO_NO_INCLUIDO') {
      if (bm) {
        const exact = pickPlanForExactModule(planes, currentModulos, currentCode, bm);
        if (exact) {
          return {
            reason: 'modulo',
            plan: exact,
            title: `${exact.nombre} desbloquea ${moduloLabelFor(bm).toLowerCase()}`,
            body: copyExactModule(exact, bm),
            benefits: deriveBenefitsForExactModule(exact, currentPlan, bm, currentModulos),
            primaryCtaLabel: `Elegir ${exact.nombre}`
          };
        }
      }
      const pick = pickPlanForModuleBlock(planes, currentModulos, currentCode);
      if (pick) {
        return {
          reason: 'modulo',
          plan: pick.plan,
          title: `Desbloquea esa función con ${pick.plan.nombre}`,
          body: copyModuleDelta(pick.plan, pick.nuevos),
          benefits: deriveBenefits(pick.plan, currentPlan, 'modulo', pick.nuevos),
          primaryCtaLabel: `Elegir ${pick.plan.nombre}`
        };
      }
      const target =
        planes.find((p) => p.recomendado && p.codigo.toUpperCase() !== currentCode) ??
        planes.find((p) => p.codigo.toUpperCase() !== currentCode);
      if (!target) return null;
      return {
        reason: 'modulo',
        plan: target,
        title: `Desbloquea esa función con ${target.nombre}`,
        body: 'Intentaste usar una función que no está incluida en tu plan actual. Con este plan amplías los módulos disponibles para tu operación.',
        benefits: deriveBenefits(target, currentPlan, 'generic'),
        primaryCtaLabel: `Elegir ${target.nombre}`
      };
    }

    // 2. Reportes bloqueado.
    //    Prioridad: match EXACTO por blockModule (p. ej. `reportes_basicos`) →
    //    primer plan que suma reportes → fallback.
    if (bc === 'PLAN_REPORTES_NO_INCLUIDO') {
      if (bm) {
        const exact = pickPlanForExactModule(planes, currentModulos, currentCode, bm);
        if (exact) {
          return {
            reason: 'reportes',
            plan: exact,
            title: `${exact.nombre} te da acceso a ${moduloLabelFor(bm).toLowerCase()}`,
            body: copyExactReporte(exact, bm),
            benefits: deriveBenefitsForExactModule(exact, currentPlan, bm, currentModulos),
            primaryCtaLabel: `Elegir ${exact.nombre}`
          };
        }
      }
      const pick = pickPlanForReportesBlock(planes, currentModulos, currentCode);
      if (pick) {
        return {
          reason: 'reportes',
          plan: pick.plan,
          title: `Accede a reportes con ${pick.plan.nombre}`,
          body: copyReportesDelta(pick.plan, pick.nuevosReportes),
          benefits: deriveBenefits(pick.plan, currentPlan, 'reportes', pick.nuevosReportes),
          primaryCtaLabel: `Elegir ${pick.plan.nombre}`
        };
      }
      const target =
        planes.find((p) => p.recomendado && p.codigo.toUpperCase() !== currentCode) ??
        planes.find((p) => p.codigo.toUpperCase() !== currentCode);
      if (!target) return null;
      return {
        reason: 'reportes',
        plan: target,
        title: `Accede a reportes con ${target.nombre}`,
        body: 'Intentaste consultar o exportar reportes que no están incluidos en tu plan actual. Con este plan pasas a tener acceso a esa sección.',
        benefits: deriveBenefits(target, currentPlan, 'generic'),
        primaryCtaLabel: `Elegir ${target.nombre}`
      };
    }

    // 2. Límite alcanzado (por blockCode explícito o por capacity.status === 'full').
    const limitFromCode =
      bc === 'PLAN_LIMITE_USUARIOS'
        ? 'usuarios'
        : bc === 'PLAN_LIMITE_BODEGAS'
        ? 'bodegas'
        : bc === 'PLAN_LIMITE_PRODUCTOS'
        ? 'productos'
        : null;
    const fullFromCap =
      cap?.resources.find((r) => r.status === 'full')?.key ?? null;
    const limitKey = limitFromCode ?? fullFromCap;
    if (limitKey) {
      const target = pickPlanForLimit(planes, currentPlan, currentCode, limitKey);
      if (target) {
        const targetLimit = limitOf(target, limitKey);
        return {
          reason: `limite-${limitKey}`,
          plan: target,
          title: `Aumenta tu capacidad de ${limitKey} con ${target.nombre}`,
          body: copyLimit(limitKey, target, targetLimit),
          benefits: deriveBenefits(target, currentPlan, limitKey),
          primaryCtaLabel: `Elegir ${target.nombre}`
        };
      }
    }

    // 3. Capacidad `near` (aviso preventivo usando datos reales del snapshot).
    const nearKey = cap?.resources.find((r) => r.status === 'near')?.key ?? null;
    if (nearKey) {
      const target = pickPlanForLimit(planes, currentPlan, currentCode, nearKey);
      if (target) {
        const targetLimit = limitOf(target, nearKey);
        return {
          reason: `near-${nearKey}`,
          plan: target,
          title: `Prepárate antes del límite con ${target.nombre}`,
          body: copyNear(nearKey, target, targetLimit),
          benefits: deriveBenefits(target, currentPlan, nearKey),
          primaryCtaLabel: `Elegir ${target.nombre}`
        };
      }
    }

    // 4. Fallback: recomendado del backend, distinto del actual.
    const fallback = planes.find(
      (p) => p.recomendado && p.codigo.toUpperCase() !== currentCode
    );
    if (!fallback) return null;
    return {
      reason: 'fallback',
      plan: fallback,
      title: `${fallback.nombre}: el plan recomendado para crecer`,
      body:
        fallback.descripcionCorta ||
        'Este plan es el más elegido por empresas que quieren más control y capacidad para crecer sin perder el orden.',
      benefits: deriveBenefits(fallback, currentPlan, 'generic'),
      primaryCtaLabel: `Elegir ${fallback.nombre}`
    };
  });

  readonly pendingUrgency = computed((): { label: string; level: 'normal' | 'high' } => {
    this.clockTick();
    const e = this.empresa();
    const iso = e?.cambioPlanPendienteExpiraAt;
    if (!iso) {
      return { label: 'Pago pendiente', level: 'normal' };
    }
    const exp = new Date(iso).getTime();
    const now = Date.now();
    if (Number.isNaN(exp)) {
      return { label: 'Pago pendiente', level: 'normal' };
    }
    if (now >= exp) {
      return { label: 'Expirado o por actualizar', level: 'high' };
    }
    const ms = exp - now;
    const hours = Math.floor(ms / 3600000);
    if (hours < 24) {
      const m = Math.floor((ms % 3600000) / 60000);
      return { label: `Queda poco tiempo (${hours}h ${m}m)`, level: 'high' };
    }
    return { label: 'Pago pendiente', level: 'normal' };
  });

  readonly tiempoRestanteLinea = computed((): string | null => {
    this.clockTick();
    const e = this.empresa();
    const iso = e?.cambioPlanPendienteExpiraAt;
    if (!iso) return null;
    const exp = new Date(iso).getTime();
    const now = Date.now();
    if (Number.isNaN(exp) || now >= exp) {
      return 'La fecha límite de este cambio ya pasó o está por actualizarse. Si aún ves este aviso, recarga la página.';
    }
    const ms = exp - now;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const hasta = this.fmtDateTime(iso);
    if (days > 0) {
      return `Te quedan aproximadamente ${days} día(s) y ${hours} hora(s) para completar el pago (hasta ${hasta}).`;
    }
    if (hours > 0) {
      return `Te quedan aproximadamente ${hours} hora(s) y ${mins} minuto(s) para completar el pago (hasta ${hasta}).`;
    }
    return `Te quedan aproximadamente ${mins} minuto(s) para completar el pago (hasta ${hasta}).`;
  });

  ngOnInit(): void {
    // Lectura one-shot del contexto: queda fijado durante esta visita y se
    // limpia del singleton para no reaparecer al volver a /app/mi-empresa.
    const trigger = planUpgradeContext.consume();
    this.lastBlockCode.set(trigger?.blockCode ?? null);
    this.lastBlockModule.set(trigger?.blockModule ?? null);
    this.refreshEmpresa();
  }

  ngOnDestroy(): void {
    this.clearPendingClock();
    if (this.copyFlashTimer) {
      clearTimeout(this.copyFlashTimer);
    }
  }

  fmtDateTime(iso: string | null | undefined): string {
    if (!iso) return 'No disponible';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  private refreshEmpresa(): void {
    this.empresaApi.getMiEmpresa().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.error.set(null);
        this.empresa.set(res);
        this.alertasForm.patchValue({
          emailNotificacionesInventario: res.emailNotificacionesInventario ?? '',
          alertasPedidoProveedorActivas: res.alertasPedidoProveedorActivas !== false,
          pedidoProveedorCantidadMaxima:
            res.pedidoProveedorCantidadMaxima != null ? String(res.pedidoProveedorCantidadMaxima) : ''
        });
        this.syncPendingClock(res);
        this.loadCapacity(res);
        this.loadPublicPlanes();
      },
      error: (e) => {
        this.loading.set(false);
        this.syncPendingClock(null);
        this.empresa.set(null);
        this.capacity.set(null);
        this.error.set(
          `No se pudo cargar la información de tu empresa. ${resolvePlanBlockUx(e, false).message}`
        );
      }
    });
  }

  guardarAlertas(): void {
    const e = this.empresa();
    if (!e) return;
    const f = this.alertasForm.getRawValue();
    const maxStr = f.pedidoProveedorCantidadMaxima.trim();
    const maxNum = maxStr === '' ? 0 : Number(maxStr);
    if (maxStr !== '' && Number.isNaN(maxNum)) {
      this.alertasErr.set('La cantidad máxima no es un número válido.');
      return;
    }
    this.alertasGuardando.set(true);
    this.alertasErr.set(null);
    this.alertasMsg.set(null);
    this.empresaApi
      .actualizarMiEmpresa({
        nombre: e.nombre,
        emailContacto: e.emailContacto ?? '',
        telefono: e.telefono ?? '',
        emailNotificacionesInventario: f.emailNotificacionesInventario.trim(),
        alertasPedidoProveedorActivas: f.alertasPedidoProveedorActivas,
        pedidoProveedorCantidadMaxima: maxNum
      })
      .subscribe({
        next: (res) => {
          this.alertasGuardando.set(false);
          this.empresa.set(res);
          this.alertasForm.patchValue({
            emailNotificacionesInventario: res.emailNotificacionesInventario ?? '',
            alertasPedidoProveedorActivas: res.alertasPedidoProveedorActivas !== false,
            pedidoProveedorCantidadMaxima:
              res.pedidoProveedorCantidadMaxima != null ? String(res.pedidoProveedorCantidadMaxima) : ''
          });
          this.alertasMsg.set('Ajustes de alertas guardados.');
        },
        error: (err) => {
          this.alertasGuardando.set(false);
          this.alertasErr.set(resolvePlanBlockUx(err, false).message);
        }
      });
  }

  etiquetaModulo(codigo: string): string {
    return MODULO_LABELS[codigo] ?? codigo;
  }

  etiquetaPrecioPublico(p: PublicPlanDto): string {
    const base = formatPlanPrecioMensual(p);
    const suf = planMensualCadence(p);
    return suf ? `${base}${suf}` : base;
  }

  /**
   * Plan a destacar visualmente en el grid. Si la recomendación contextual
   * apunta a un plan concreto, se prioriza ese; si no, se usa el flag
   * `recomendado: true` del backend. Nunca resalta el plan actual.
   */
  isHighlightedPlan(p: PublicPlanDto, currentCode: string | null | undefined): boolean {
    if (!currentCode || p.codigo === currentCode) return false;
    const rec = this.contextualRecommendation();
    if (rec) return rec.plan.codigo === p.codigo;
    return p.recomendado;
  }

  iniciarCambioPlan(planCodigo: string): void {
    this.cambioPlanMsg.set(null);
    this.cambioPlanErr.set(null);
    this.planChangeBusy.set(true);
    this.empresaApi.solicitarCambioPlan(planCodigo).subscribe({
      next: (r) => {
        this.planChangeBusy.set(false);
        this.cambioPlanMsg.set(r.mensaje);
        this.refreshEmpresa();
      },
      error: (err) => {
        this.planChangeBusy.set(false);
        this.cambioPlanErr.set(resolvePlanBlockUx(err, false).message);
      }
    });
  }

  copiarReferenciaPago(id: number): void {
    const text = String(id);
    if (!globalThis.navigator?.clipboard?.writeText) {
      this.cambioPlanErr.set('Tu navegador no permite copiar al portapapeles automáticamente. Anota la referencia manualmente.');
      return;
    }
    void globalThis.navigator.clipboard.writeText(text).then(
      () => {
        this.cambioPlanErr.set(null);
        this.referenciaCopiadaFlashing.set(true);
        if (this.copyFlashTimer) clearTimeout(this.copyFlashTimer);
        this.copyFlashTimer = globalThis.setTimeout(() => this.referenciaCopiadaFlashing.set(false), 2200);
      },
      () => {
        this.cambioPlanErr.set('No se pudo copiar. Copia la referencia manualmente.');
      }
    );
  }

  scrollToCambioPlanCards(): void {
    globalThis.document.getElementById('planes-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelarCambioPendiente(): void {
    this.cambioPlanMsg.set(null);
    this.cambioPlanErr.set(null);
    this.cancelPlanBusy.set(true);
    this.empresaApi.cancelarCambioPlanPendiente().subscribe({
      next: (r) => {
        this.cancelPlanBusy.set(false);
        this.cambioPlanMsg.set(r.mensaje);
        this.refreshEmpresa();
      },
      error: (err) => {
        this.cancelPlanBusy.set(false);
        this.cambioPlanErr.set(resolvePlanBlockUx(err, false).message);
      }
    });
  }

  private syncPendingClock(e: EmpresaActualDto | null): void {
    this.clearPendingClock();
    if (e?.cambioPlanPendientePagoId && e.cambioPlanPendienteExpiraAt) {
      this.clockTick.set(Date.now());
      this.pendingClockId = globalThis.setInterval(() => this.clockTick.set(Date.now()), 60000);
    }
  }

  private clearPendingClock(): void {
    if (this.pendingClockId) {
      globalThis.clearInterval(this.pendingClockId);
      this.pendingClockId = undefined;
    }
  }

  private loadPublicPlanes(): void {
    this.publicPlanesLoading.set(true);
    this.publicPlanesErr.set(null);
    this.planesApi.listPublicPlanes().subscribe({
      next: (list) => {
        this.publicPlanesLoading.set(false);
        this.publicPlanes.set(list);
      },
      error: () => {
        this.publicPlanesLoading.set(false);
        this.publicPlanesErr.set('No se pudieron cargar los planes disponibles. Intenta más tarde.');
        this.publicPlanes.set([]);
      }
    });
  }

  private loadCapacity(empresa: EmpresaActualDto): void {
    this.capacityLoading.set(true);
    this.capacityError.set(null);
    this.capacidadApi
      .getSnapshot(empresa.planCodigo ?? null, {
        maxBodegas: empresa.maxBodegas ?? null,
        maxUsuarios: empresa.maxUsuarios ?? null,
        maxProductos: empresa.maxProductos ?? null
      })
      .subscribe({
      next: (snapshot) => {
        this.capacityLoading.set(false);
        this.capacity.set(snapshot);
        if (snapshot.errors.length) {
          this.capacityError.set(snapshot.errors.join(' '));
        }
      },
      error: (e) => {
        this.capacityLoading.set(false);
        this.capacity.set(null);
        this.capacityError.set(
          `No se pudo cargar capacidad y consumo del plan. ${resolvePlanBlockUx(e, false).message}`
        );
      }
    });
  }
}

function mapEmpresaStatus(raw: string | null | undefined): { title: string; description: string; kind: 'ok' | 'warn' } {
  switch (raw) {
    case 'ACTIVA':
      return {
        title: 'Cuenta activa',
        description: 'Tu empresa está operativa y con acceso habilitado.',
        kind: 'ok'
      };
    case 'EN_PRUEBA':
      return {
        title: 'Cuenta en periodo de prueba',
        description: 'Tu empresa está en prueba con acceso habilitado.',
        kind: 'ok'
      };
    case 'COMERCIAL_PENDIENTE':
      return {
        title: 'Pendiente de activación',
        description: 'Tu empresa aún no está habilitada comercialmente.',
        kind: 'warn'
      };
    case 'INACTIVA':
      return {
        title: 'Cuenta inactiva',
        description: 'La cuenta está inactiva. Contacta soporte para revisar activación.',
        kind: 'warn'
      };
    default:
      return {
        title: 'Estado no disponible',
        description: 'No se pudo determinar el estado comercial de la empresa.',
        kind: 'warn'
      };
  }
}

function mapSuscripcionStatus(raw: string | null | undefined): string {
  switch (raw) {
    case 'TRIAL':
      return 'Periodo de prueba';
    case 'ACTIVA':
      return 'Activa';
    case 'PENDIENTE_PAGO':
      return 'Pendiente de pago';
    case 'CANCELADA':
      return 'Cancelada';
    case 'EXPIRADA':
      return 'Expirada';
    default:
      return 'No disponible';
  }
}

// ---------- Recomendación contextual ----------

type ContextualReason =
  | 'modulo'
  | 'reportes'
  | 'limite-usuarios'
  | 'limite-bodegas'
  | 'limite-productos'
  | 'near-usuarios'
  | 'near-bodegas'
  | 'near-productos'
  | 'fallback';

interface ContextualRecommendation {
  reason: ContextualReason;
  plan: PublicPlanDto;
  title: string;
  body: string;
  benefits: string[];
  primaryCtaLabel: string;
}

type LimitKey = 'usuarios' | 'bodegas' | 'productos';

/**
 * Extrae el tope de un plan público para un recurso dado.
 * `maxProductos` es opcional en el DTO: sólo llega cuando el backend con
 * `PlanEntitlementsRegistry` proyectado está desplegado.
 */
function limitOf(plan: PublicPlanDto, key: LimitKey): number | null {
  if (key === 'usuarios') return plan.maxUsuarios ?? null;
  if (key === 'bodegas') return plan.maxBodegas ?? null;
  // maxProductos viene del registry; null = ilimitado; undefined = backend viejo
  if (plan.maxProductos === undefined) return null;
  return plan.maxProductos;
}

/**
 * Elige el plan más pequeño cuyo tope del recurso sea estrictamente mayor al tope actual.
 *
 * Reglas para ordenar/comparar considerando que `null` representa ilimitado:
 *  - si el plan actual es ilimitado, no hay mejora posible en ese recurso.
 *  - un plan con tope ilimitado supera a cualquier tope finito (lo elige si no
 *    hay otro finito mayor).
 *  - si nada aplica, cae al `recomendado: true` del backend.
 */
function pickPlanForLimit(
  planes: PublicPlanDto[],
  currentPlan: PublicPlanDto | null,
  currentCode: string,
  key: LimitKey
): PublicPlanDto | null {
  const currentLimit = currentPlan ? limitOf(currentPlan, key) : null;
  const candidates = planes
    .filter((p) => p.codigo.toUpperCase() !== currentCode)
    .map((p) => ({ p, l: limitOf(p, key) }))
    .filter((x) => {
      if (currentLimit == null) return false; // current ilimitado → nada mejor
      if (x.l == null) return true; // destino ilimitado > finito
      return x.l > currentLimit;
    })
    // Ordenar finitos ascendente; los ilimitados (l null) van al final.
    .sort((a, b) => {
      if (a.l == null && b.l == null) return 0;
      if (a.l == null) return 1;
      if (b.l == null) return -1;
      return a.l - b.l;
    })
    .map((x) => x.p);
  if (candidates.length) return candidates[0];
  return planes.find((p) => p.recomendado && p.codigo.toUpperCase() !== currentCode) ?? null;
}

/**
 * Elige el plan más pequeño cuyo conjunto de `modulos` es un superconjunto estricto
 * del plan actual. "Más pequeño" = el que agrega menos módulos extra respecto al actual.
 *
 * Requiere que el backend envíe `modulos`. Si no están (contrato viejo) o no hay
 * superconjunto real, cae al `recomendado: true` del backend.
 */
function pickPlanForModuleBlock(
  planes: PublicPlanDto[],
  currentModulos: Set<string>,
  currentCode: string
): { plan: PublicPlanDto; nuevos: string[] } | null {
  const withModulos = planes.filter(
    (p) => p.codigo.toUpperCase() !== currentCode && Array.isArray(p.modulos) && p.modulos.length > 0
  );
  if (!withModulos.length) return null;

  const candidates = withModulos
    .map((p) => {
      const set = new Set(p.modulos as string[]);
      const isSuperset = [...currentModulos].every((m) => set.has(m));
      const nuevos = (p.modulos as string[]).filter((m) => !currentModulos.has(m));
      return { plan: p, nuevos, isStrictSuperset: isSuperset && nuevos.length > 0 };
    })
    .filter((x) => x.isStrictSuperset)
    .sort((a, b) => a.nuevos.length - b.nuevos.length);

  if (!candidates.length) return null;
  return { plan: candidates[0].plan, nuevos: candidates[0].nuevos };
}

/**
 * Elige el plan más pequeño (menor total de módulos) que contenga un módulo
 * específico y que no sea el plan actual. Requiere que el backend envíe
 * `modulos` y que el usuario efectivamente no tenga el módulo ya.
 *
 * Devuelve `null` si no hay match estructurado (contrato viejo, módulo ya
 * presente, o ningún plan lo incluye): el llamante debe caer al fallback.
 */
function pickPlanForExactModule(
  planes: PublicPlanDto[],
  currentModulos: Set<string>,
  currentCode: string,
  targetModule: string
): PublicPlanDto | null {
  if (!targetModule) return null;
  if (currentModulos.has(targetModule)) return null;
  const candidates = planes
    .filter(
      (p) =>
        p.codigo.toUpperCase() !== currentCode &&
        Array.isArray(p.modulos) &&
        (p.modulos as string[]).includes(targetModule)
    )
    .sort((a, b) => (a.modulos as string[]).length - (b.modulos as string[]).length);
  return candidates[0] ?? null;
}

/** Códigos de módulo del registry que cuentan como "reportes". Alineados con backend. */
const REPORTING_MODULE_CODES: ReadonlySet<string> = new Set([
  'reportes_basicos',
  'reportes_avanzados',
  'historial_movimientos'
]);

/**
 * Elige el plan más pequeño cuyo conjunto de módulos agrega al menos un código
 * de reportes que el plan actual no tiene.
 */
function pickPlanForReportesBlock(
  planes: PublicPlanDto[],
  currentModulos: Set<string>,
  currentCode: string
): { plan: PublicPlanDto; nuevosReportes: string[] } | null {
  const withModulos = planes.filter(
    (p) => p.codigo.toUpperCase() !== currentCode && Array.isArray(p.modulos) && p.modulos.length > 0
  );
  if (!withModulos.length) return null;
  const candidates = withModulos
    .map((p) => {
      const nuevosReportes = (p.modulos as string[]).filter(
        (m) => REPORTING_MODULE_CODES.has(m) && !currentModulos.has(m)
      );
      return { plan: p, nuevosReportes };
    })
    .filter((x) => x.nuevosReportes.length > 0)
    .sort((a, b) => {
      // preferir al más chico en total de módulos; desempate por menor tope finito
      const aTotal = (a.plan.modulos as string[]).length;
      const bTotal = (b.plan.modulos as string[]).length;
      return aTotal - bTotal;
    });
  if (!candidates.length) return null;
  return { plan: candidates[0].plan, nuevosReportes: candidates[0].nuevosReportes };
}

function copyLimit(key: LimitKey, target: PublicPlanDto, targetLimit: number | null): string {
  switch (key) {
    case 'usuarios':
      return targetLimit != null
        ? `Tu plan actual ya no admite más usuarios. ${target.nombre} sube ese tope a ${targetLimit} usuarios, para que sigas agregando gente a tu equipo sin trabas.`
        : `Tu plan actual ya no admite más usuarios. ${target.nombre} te da más cupo para seguir agregando gente a tu equipo.`;
    case 'bodegas':
      return targetLimit != null
        ? `Tu plan actual ya no admite más bodegas. ${target.nombre} sube ese tope a ${targetLimit} bodegas, para que abras nuevas ubicaciones sin perder control.`
        : `Tu plan actual ya no admite más bodegas. ${target.nombre} te da más capacidad para abrir nuevas ubicaciones.`;
    case 'productos':
      return targetLimit != null
        ? `Tu plan actual llegó al límite de productos. ${target.nombre} sube ese tope a ${targetLimit} productos, para que sigas registrando catálogo sin preocuparte.`
        : `Tu plan actual llegó al límite de productos. ${target.nombre} te da capacidad ilimitada para seguir registrando catálogo sin restricciones.`;
  }
}

function copyNear(key: LimitKey, target: PublicPlanDto, targetLimit: number | null): string {
  switch (key) {
    case 'usuarios':
      return targetLimit != null
        ? `Tu equipo está cerca del límite de usuarios del plan actual. Con ${target.nombre} pasas a ${targetLimit} usuarios disponibles, así evitas quedarte sin cupo justo cuando lo necesites.`
        : `Tu equipo está cerca del límite de usuarios. ${target.nombre} te da más cupo para seguir creciendo.`;
    case 'bodegas':
      return targetLimit != null
        ? `Tus bodegas están cerca del límite del plan actual. ${target.nombre} te da hasta ${targetLimit} bodegas disponibles, para planear nuevas ubicaciones con calma.`
        : `Tus bodegas están cerca del límite. ${target.nombre} te da más capacidad para seguir creciendo.`;
    case 'productos':
      return targetLimit != null
        ? `Tu catálogo está cerca del límite de productos del plan actual. ${target.nombre} te lleva hasta ${targetLimit} productos, para que sigas registrando con holgura.`
        : `Tu catálogo está cerca del límite de productos. ${target.nombre} te da capacidad ilimitada para que sigas creciendo sin preocuparte.`;
  }
}

/** Etiqueta visible para un código técnico de módulo, siguiendo la misma tabla que la UI. */
function moduloLabelFor(code: string): string {
  return MODULO_LABELS[code] ?? code;
}

/** Lista corta y legible de módulos: "a, b y c" (máx 3 para no saturar el copy). */
function listarModulosHumano(codigos: string[]): string {
  const vistos = codigos.slice(0, 3).map((c) => moduloLabelFor(c).toLowerCase());
  if (vistos.length === 0) return '';
  if (vistos.length === 1) return vistos[0];
  if (vistos.length === 2) return `${vistos[0]} y ${vistos[1]}`;
  return `${vistos[0]}, ${vistos[1]} y ${vistos[2]}`;
}

/**
 * Copy para match EXACTO del módulo bloqueado. Usa el diccionario `MODULO_LABELS`
 * (fuente única en UI) para pasar de código técnico a nombre humano.
 */
function copyExactModule(target: PublicPlanDto, blockModule: string): string {
  const label = moduloLabelFor(blockModule).toLowerCase();
  return `${target.nombre} desbloquea ${label}, la función que intentaste usar y que tu plan actual no incluye.`;
}

/** Copy para match EXACTO en bloqueo de reportes. */
function copyExactReporte(target: PublicPlanDto, blockModule: string): string {
  const label = moduloLabelFor(blockModule).toLowerCase();
  return `${target.nombre} te da acceso a ${label}, reportes que no están incluidos en tu plan actual.`;
}

/**
 * Beneficios cuando hay match EXACTO: el primer ítem es el módulo solicitado,
 * luego hasta 2 módulos adicionales que también se ganan respecto al actual.
 * Nunca inventa: todo viene del DTO real del plan destino.
 */
function deriveBenefitsForExactModule(
  target: PublicPlanDto,
  _current: PublicPlanDto | null,
  blockModule: string,
  currentModulos: Set<string>
): string[] {
  const out: string[] = [moduloLabelFor(blockModule)];
  const extras = Array.isArray(target.modulos) ? (target.modulos as string[]) : [];
  for (const code of extras) {
    if (out.length >= 3) break;
    if (code === blockModule) continue;
    if (currentModulos.has(code)) continue;
    out.push(moduloLabelFor(code));
  }
  if (out.length < 3) {
    for (const f of target.features.slice(0, 2)) {
      const trimmed = (f ?? '').trim();
      if (trimmed && !out.includes(trimmed)) out.push(trimmed);
      if (out.length >= 3) break;
    }
  }
  return out.slice(0, 3);
}

/**
 * Copy para bloqueo de módulo: enuncia qué módulos reales desbloquea el plan destino
 * frente al plan actual. Si no hay delta nombrable (contrato viejo), usa texto genérico.
 */
function copyModuleDelta(target: PublicPlanDto, nuevos: string[]): string {
  const lista = listarModulosHumano(nuevos);
  if (lista) {
    return `${target.nombre} desbloquea ${lista}${nuevos.length > 3 ? ' y más funciones' : ''} que no están incluidas en tu plan actual.`;
  }
  return `Con ${target.nombre} amplías los módulos disponibles para tu operación.`;
}

/**
 * Copy para bloqueo de reportes: nombra los códigos del grupo reportes recién
 * agregados. Si no hay lista (contrato viejo), usa texto genérico.
 */
function copyReportesDelta(target: PublicPlanDto, nuevosReportes: string[]): string {
  const lista = listarModulosHumano(nuevosReportes);
  if (lista) {
    return `${target.nombre} te da acceso a ${lista}, reportes que no están incluidos en tu plan actual.`;
  }
  return `Con ${target.nombre} accedes a los reportes que tu plan actual no incluye.`;
}

/**
 * Deriva beneficios usando sólo datos del DTO real:
 *  - Para foco `modulo`/`reportes`: primero los módulos desbloqueados reales.
 *  - Para foco numérico (usuarios/bodegas/productos): métrica destino.
 *  - Luego hasta 2 `features` de marketing del backend.
 * Evita duplicados y limita a 3 ítems.
 */
function deriveBenefits(
  target: PublicPlanDto,
  current: PublicPlanDto | null,
  focus: LimitKey | 'generic' | 'modulo' | 'reportes',
  modulosNuevos: string[] = []
): string[] {
  const benefits: string[] = [];
  if ((focus === 'modulo' || focus === 'reportes') && modulosNuevos.length > 0) {
    for (const code of modulosNuevos.slice(0, 3)) {
      benefits.push(moduloLabelFor(code));
      if (benefits.length >= 3) break;
    }
  } else if (focus === 'usuarios' && target.maxUsuarios > 0) {
    benefits.push(`Hasta ${target.maxUsuarios} usuarios en tu equipo`);
  } else if (focus === 'bodegas' && target.maxBodegas > 0) {
    benefits.push(`Hasta ${target.maxBodegas} bodegas administrables`);
  } else if (focus === 'productos') {
    if (target.maxProductos == null) {
      benefits.push('Capacidad de productos ilimitada');
    } else if (target.maxProductos > 0) {
      benefits.push(`Hasta ${target.maxProductos} productos`);
    }
  } else {
    if (current && target.maxUsuarios > current.maxUsuarios) {
      benefits.push(`Más usuarios (${current.maxUsuarios} → ${target.maxUsuarios})`);
    } else if (target.maxUsuarios > 0) {
      benefits.push(`Hasta ${target.maxUsuarios} usuarios`);
    }
    if (current && target.maxBodegas > current.maxBodegas) {
      benefits.push(`Más bodegas (${current.maxBodegas} → ${target.maxBodegas})`);
    } else if (target.maxBodegas > 0 && !benefits.some((b) => b.toLowerCase().includes('bodega'))) {
      benefits.push(`Hasta ${target.maxBodegas} bodegas`);
    }
  }
  for (const f of target.features.slice(0, 2)) {
    const trimmed = (f ?? '').trim();
    if (trimmed && !benefits.includes(trimmed)) benefits.push(trimmed);
    if (benefits.length >= 3) break;
  }
  return benefits.slice(0, 3);
}
