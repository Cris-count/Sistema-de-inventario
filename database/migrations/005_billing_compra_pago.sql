-- Compra y pago SaaS (onboarding pendiente de pago) + auditoría de confirmación.

BEGIN;

CREATE TABLE IF NOT EXISTS saas_compra (
    id              BIGSERIAL PRIMARY KEY,
    empresa_id      BIGINT         NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    suscripcion_id  BIGINT         NOT NULL UNIQUE REFERENCES suscripcion (id) ON DELETE RESTRICT,
    estado          VARCHAR(24)    NOT NULL
        CHECK (estado IN ('PENDIENTE_PAGO', 'COMPLETADA', 'CANCELADA')),
    monto           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda          VARCHAR(8)     NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_compra_empresa ON saas_compra (empresa_id);

CREATE TABLE IF NOT EXISTS saas_pago (
    id BIGSERIAL PRIMARY KEY,
    compra_id             BIGINT NOT NULL REFERENCES saas_compra (id) ON DELETE RESTRICT,
    estado                VARCHAR(20)    NOT NULL
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    proveedor             VARCHAR(40)    NOT NULL DEFAULT 'ONBOARDING',
    id_externo            VARCHAR(128),
    payload_audit         TEXT,
    confirmation_channel  VARCHAR(32),
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    confirmed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saas_pago_compra ON saas_pago (compra_id);
CREATE INDEX IF NOT EXISTS idx_saas_pago_estado ON saas_pago (estado);

CREATE TABLE IF NOT EXISTS billing_event (
    id         BIGSERIAL PRIMARY KEY,
    pago_id    BIGINT      NOT NULL REFERENCES saas_pago (id) ON DELETE CASCADE,
    tipo       VARCHAR(48) NOT NULL,
    detalle    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_event_pago ON billing_event (pago_id);

COMMIT;
