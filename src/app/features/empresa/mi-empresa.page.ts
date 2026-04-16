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
import { formatPlanPrecioMensual, planMensualCadence } from '../../core/util/format-plan-price';

const MODULO_LABELS: Record<string, string> = {
  inventario_basico: 'Inventario básico y productos',
  categorias: 'Categorías',
  movimientos_basicos: 'Entradas y salidas',
  consulta_stock: 'Consulta de existencias y alertas de stock',
  multi_bodega: 'Varias bodegas',
  transferencias: 'Transferencias entre bodegas',
  ajustes_inventario: 'Ajustes de inventario',
  proveedores: 'Proveedores',
  usuarios: 'Gestión de usuarios del equipo',
  configuracion_empresa: 'Datos y configuración de la empresa',
  reportes_basicos: 'Reportes básicos (kardex y exportación)',
  historial_movimientos: 'Historial y detalle de movimientos',
  reportes_avanzados: 'Reportes avanzados',
  roles_avanzados: 'Roles avanzados',
  auditoria: 'Auditoría',
  multi_sede: 'Multi-sede',
  integraciones: 'Integraciones',
  soporte_prioritario: 'Soporte prioritario'
};

@Component({
  selector: 'app-mi-empresa',
  imports: [ReactiveFormsModule],
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
          <div class="row" style="justify-content: space-between; align-items: center;">
            <h2 style="margin: 0">{{ e.nombre }}</h2>
            <span class="badge" [class.badge-ok]="statusInfo().kind === 'ok'" [class.badge-off]="statusInfo().kind !== 'ok'">
              {{ statusInfo().title }}
            </span>
          </div>
          <p class="muted" style="margin-top: 0.25rem">{{ statusInfo().description }}</p>
          <p class="page-lead" style="margin-top: 0.5rem">
            <strong>Acceso:</strong> {{ accessInfo() }}
          </p>
        </section>

        <section class="card stack">
          <h2>Suscripción</h2>
          <div class="row">
            <div class="field" style="flex: 1">
              <label>Tu plan actual</label>
              <p>{{ e.planNombre || 'No disponible' }}</p>
            </div>
            <div class="field" style="flex: 1">
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
              id="cambio-pendiente"
              class="stack"
              role="status"
              style="
                margin: 0 0 1rem;
                padding: 1rem 1rem 1rem 0.85rem;
                border: 1px solid rgba(13, 148, 136, 0.35);
                border-radius: 6px;
                background: rgba(13, 148, 136, 0.06);
                border-left: 4px solid var(--accent, #0d9488);
              "
            >
              <div class="row" style="justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem">
                <div>
                  <h3 style="margin: 0; font-size: 1.1rem">Tienes un cambio de plan pendiente de pago</h3>
                  <p class="muted" style="margin: 0.35rem 0 0">
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
              <div class="row" style="margin-top: 1rem; align-items: stretch">
                <div class="field" style="flex: 1; min-width: 200px">
                  <label>Plan actual</label>
                  <p style="margin: 0"><strong>{{ e.planNombre || e.planCodigo || '—' }}</strong></p>
                </div>
                <div class="field" style="flex: 1; min-width: 200px">
                  <label>Plan que solicitaste</label>
                  <p style="margin: 0">
                    <strong>{{ e.cambioPlanPendientePlanNombre || e.cambioPlanPendientePlanCodigo || '—' }}</strong>
                  </p>
                </div>
              </div>
              @if (planDestinoPublico(); as pub) {
                <p class="page-lead" style="margin: 0.75rem 0 0">{{ pub.descripcionCorta }}</p>
                @if (pub.features.length) {
                  <p class="muted" style="margin: 0.5rem 0 0"><strong>En este plan destacan:</strong></p>
                  <ul style="margin: 0.35rem 0 0; padding-left: 1.25rem">
                    @for (f of pub.features.slice(0, 4); track f) {
                      <li>{{ f }}</li>
                    }
                  </ul>
                }
              } @else {
                <p class="page-lead" style="margin: 0.75rem 0 0">
                  Cuando el pago quede confirmado, tu suscripción adoptará los límites y funciones del plan que elegiste.
                </p>
              }
              @if (tiempoRestanteLinea(); as tl) {
                <p class="page-lead" style="margin: 0.75rem 0 0">{{ tl }}</p>
              }
              <p class="muted" style="margin: 0.5rem 0 0">
                Si no completas el proceso antes de la fecha límite, este cambio se cancelará automáticamente y podrás
                iniciar uno nuevo. Puedes cancelarlo tú mismo si ya no lo necesitas.
              </p>
              <p class="muted" style="margin: 0.35rem 0 0">
                <strong>Referencia para soporte o seguimiento:</strong> {{ e.cambioPlanPendientePagoId }}
                <span class="muted"> (también puedes indicar <strong>PAGO-{{ e.cambioPlanPendientePagoId }}</strong>)</span>
              </p>
              @if (e.cambioPlanPendienteCreadoAt) {
                <p class="muted" style="margin: 0.25rem 0 0">Solicitado: {{ fmtDateTime(e.cambioPlanPendienteCreadoAt) }}</p>
              }
              @if (e.cambioPlanPendienteExpiraAt) {
                <p class="muted" style="margin: 0.25rem 0 0">
                  Fecha límite: {{ fmtDateTime(e.cambioPlanPendienteExpiraAt) }}
                </p>
              }
              <p class="muted" style="margin: 0.5rem 0 0">
                El cobro y la confirmación los gestiona el proceso de facturación de la plataforma; aquí ves el estado de
                tu solicitud.
              </p>
              <div class="row" style="margin-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem">
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
          @if (!e.cambioPlanPendientePagoId) {
            <p class="muted">
              Compara opciones y solicita un cambio cuando lo necesites. Si el cambio implica un upgrade, puede requerir
              pago: cuando se confirme, tu nuevo plan quedará activo y seguirás usando el actual hasta entonces.
            </p>
          }
          @if (publicPlanesLoading()) {
            <p><span class="spinner"></span></p>
          } @else if (publicPlanesErr()) {
            <p class="muted">{{ publicPlanesErr() }}</p>
          } @else {
            <div id="planes-disponibles" class="row" style="flex-wrap: wrap; gap: 1rem">
              @for (p of publicPlanes(); track p.codigo) {
                <div
                  class="card"
                  style="flex: 1; min-width: 220px; padding: 1rem; box-sizing: border-box; border: 1px solid rgba(0, 0, 0, 0.08)"
                >
                  <p style="margin: 0"><strong>{{ p.nombre }}</strong></p>
                  @if (p.codigo === e.planCodigo) {
                    <p class="muted" style="margin: 0.35rem 0 0">Tu plan actual</p>
                  } @else {
                    <p class="muted" style="margin: 0.35rem 0">{{ etiquetaPrecioPublico(p) }}</p>
                    <button
                      type="button"
                      class="btn btn-primary"
                      style="margin-top: 0.5rem"
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
            <ul style="margin: 0.5rem 0 0; padding-left: 1.25rem">
              @for (m of modulosOrdenados(); track m) {
                <li>{{ etiquetaModulo(m) }}</li>
              }
            </ul>
          }
          <p class="muted" style="margin-top: 0.75rem">
            Si algo aparece aquí y no ves la opción en el menú, puede estar en preparación: no es un fallo técnico.
          </p>
        </section>

        <section class="card stack">
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
                  <div class="field" style="flex: 1; min-width: 220px">
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
                      <span class="badge">Cerca del límite</span>
                    } @else if (r.status === 'full') {
                      <span class="badge badge-off">Límite alcanzado</span>
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
            <div class="field" style="flex: 1">
              <label>Identificación</label>
              <p>{{ e.identificacion || 'No registrada' }}</p>
            </div>
            <div class="field" style="flex: 1">
              <label>Email de contacto</label>
              <p>{{ e.emailContacto || 'No registrado' }}</p>
            </div>
            <div class="field" style="flex: 1">
              <label>Teléfono</label>
              <p>{{ e.telefono || 'No registrado' }}</p>
            </div>
          </div>
        </section>

        @if (canConfigurarAlertas()) {
          <section class="card stack">
            <h2>Alertas de inventario (pedidos a proveedor)</h2>
            <p class="muted" style="margin-top: 0">
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
                <p class="muted" style="margin: 0.25rem 0 0">
                  Si lo deja vacío, se usa el email de contacto de la empresa. Debe ser un correo de la empresa, no del
                  usuario que inicia sesión.
                </p>
              </div>
              <div class="field">
                <label class="row" style="align-items: center; gap: 0.5rem">
                  <input type="checkbox" formControlName="alertasPedidoProveedorActivas" />
                  Enviar alertas automáticas al proveedor cuando el stock esté en o bajo el mínimo
                </label>
              </div>
              <div class="field" style="max-width: 280px">
                <label>Cantidad máxima por pedido sugerido (opcional)</label>
                <input type="number" step="any" min="0" formControlName="pedidoProveedorCantidadMaxima" placeholder="Sin tope" />
                <p class="muted" style="margin: 0.25rem 0 0">
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
