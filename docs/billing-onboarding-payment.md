# Facturación: confirmación de pago tras onboarding

## Contexto

Cuando `app.onboarding.activation-default` es `PENDING_PAYMENT`, el onboarding crea:

- Empresa en `COMERCIAL_PENDIENTE`
- Suscripción en `PENDIENTE_PAGO`
- Super admin **inactivo**
- `saas_compra` (PENDIENTE_PAGO) y `saas_pago` (PENDIENTE)
- Opcional: `onboarding_pin` como referencia (no es autenticación)

## Configuración

| Propiedad | Descripción |
|-----------|-------------|
| `app.billing.api-secret` | Secreto compartido (comparación vía SHA-256 en servidor). Cabecera: `X-Billing-Secret`. |
| `app.billing.post-payment-empresa-estado` | `ACTIVA` o `EN_PRUEBA` tras aprobar pago. |

## Endpoints

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/v1/billing/pagos/{pagoId}/confirmar-onboarding` | Operación interna / backoffice tras validar pago. |
| `POST` | `/api/v1/billing/webhook` | Cuerpo JSON: `{ "pagoId": <long>, "event": "payment.completed" }` (event opcional: `paid` o omitido). |

Ambos exigen `X-Billing-Secret`. Las rutas son públicas a nivel JWT; la autorización es el secreto (preparado para sustituir por firma de pasarela).

## Transiciones

1. **Pago**: `PENDIENTE` → `APROBADO` (idempotente si ya estaba aprobado).
2. **Compra**: `PENDIENTE_PAGO` → `COMPLETADA`.
3. **Suscripción**: `PENDIENTE_PAGO` → `ACTIVA` (se limpia `fecha_fin` de prueba).
4. **Empresa**: `COMERCIAL_PENDIENTE` → valor de `post-payment-empresa-estado`.
5. **Usuarios**: se activan los `SUPER_ADMIN` inactivos de esa empresa.

Auditoría: fila en `billing_event` con tipo `PAYMENT_CONFIRMED`.

## Pasarela real (pendiente)

- Sustituir validación de secreto por verificación de firma HMAC del proveedor.
- Mapear `id_externo` y payload crudo en `saas_pago.payload_audit`.
- Reintentos idempotentes: el servicio devuelve `alreadyConfirmed: true` si el pago ya estaba aprobado.

## Migración SQL

Ejecutar `database/migrations/005_billing_compra_pago.sql` en PostgreSQL si la base ya existía antes de este cambio.
