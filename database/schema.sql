-- ============================================================
-- Sistema de inventario - PostgreSQL (multi-empresa)
-- Ejecutar contra una base vacía o usar sección DROP en desarrollo.
-- ============================================================

SET client_encoding = 'UTF8';

-- Desarrollo: descomentar para recrear desde cero
-- DROP TABLE IF EXISTS movimiento_detalle CASCADE;
-- DROP TABLE IF EXISTS movimiento CASCADE;
-- DROP TABLE IF EXISTS inventario CASCADE;
-- DROP TABLE IF EXISTS producto CASCADE;
-- DROP TABLE IF EXISTS categoria CASCADE;
-- DROP TABLE IF EXISTS bodega CASCADE;
-- DROP TABLE IF EXISTS proveedor CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS empresa CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;

CREATE TABLE IF NOT EXISTS rol (
    id          BIGSERIAL PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empresa (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    identificacion VARCHAR(32)  NOT NULL UNIQUE,
    email_contacto                     VARCHAR(255),
    email_notificaciones_inventario    VARCHAR(255),
    alertas_pedido_proveedor_activas   BOOLEAN       NOT NULL DEFAULT TRUE,
    pedido_proveedor_cantidad_maxima   NUMERIC(14, 4),
    telefono       VARCHAR(40),
    sector         VARCHAR(100),
    pais           VARCHAR(80),
    ciudad         VARCHAR(120),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'INACTIVA', 'EN_PRUEBA', 'COMERCIAL_PENDIENTE')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS usuario (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100),
    empresa_id     BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    rol_id         BIGINT       NOT NULL REFERENCES rol (id) ON DELETE RESTRICT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    mfa_enabled    BOOLEAN      NOT NULL DEFAULT FALSE,
    mfa_secret     VARCHAR(255),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuario_empresa ON usuario (empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuario (activo) WHERE activo = TRUE;

ALTER TABLE empresa ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES usuario (id) ON DELETE SET NULL;
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS pais VARCHAR(80);
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS ciudad VARCHAR(120);

CREATE TABLE IF NOT EXISTS saas_plan (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(40)  NOT NULL UNIQUE,
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    precio_mensual  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda          VARCHAR(8)   NOT NULL DEFAULT 'USD',
    max_bodegas     INTEGER      NOT NULL DEFAULT 2,
    max_usuarios    INTEGER      NOT NULL DEFAULT 5,
    features        TEXT,
    orden           INTEGER      NOT NULL DEFAULT 0,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suscripcion (
    id           BIGSERIAL PRIMARY KEY,
    empresa_id   BIGINT       NOT NULL UNIQUE REFERENCES empresa (id) ON DELETE RESTRICT,
    plan_id      BIGINT       NOT NULL REFERENCES saas_plan (id) ON DELETE RESTRICT,
    estado       VARCHAR(24)  NOT NULL
        CHECK (estado IN ('TRIAL', 'ACTIVA', 'PENDIENTE_PAGO', 'CANCELADA', 'EXPIRADA')),
    fecha_inicio TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_fin    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripcion_plan ON suscripcion (plan_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_estado ON suscripcion (estado);

CREATE TABLE IF NOT EXISTS onboarding_pin (
    id             BIGSERIAL PRIMARY KEY,
    pin            VARCHAR(16)  UNIQUE,
    empresa_id     BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE CASCADE,
    suscripcion_id BIGINT       NOT NULL REFERENCES suscripcion (id) ON DELETE CASCADE,
    totp_secret    VARCHAR(64),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_pin_empresa ON onboarding_pin (empresa_id);

CREATE TABLE IF NOT EXISTS onboarding_email_challenge (
    id                 BIGSERIAL PRIMARY KEY,
    email              VARCHAR(255) NOT NULL,
    plan_codigo        VARCHAR(40)  NOT NULL,
    code_hash          VARCHAR(64),
    totp_secret        VARCHAR(64),
    expires_at         TIMESTAMPTZ  NOT NULL,
    status             VARCHAR(16)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'VERIFIED', 'CANCELLED')),
    session_token      UUID,
    session_expires_at TIMESTAMPTZ,
    consumed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_email_challenge_lookup
    ON onboarding_email_challenge (email, plan_codigo, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_email_challenge_session_token
    ON onboarding_email_challenge (session_token)
    WHERE session_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS onboarding_prepaid_checkout (
    id                  BIGSERIAL PRIMARY KEY,
    stripe_session_id   VARCHAR(255)   NOT NULL UNIQUE,
    plan_codigo         VARCHAR(64)    NOT NULL,
    paid_at             TIMESTAMPTZ    NOT NULL,
    consumed_at         TIMESTAMPTZ    NULL,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_prepaid_unconsumed
    ON onboarding_prepaid_checkout (plan_codigo)
    WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS saas_compra (
    id              BIGSERIAL PRIMARY KEY,
    empresa_id      BIGINT         NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    suscripcion_id  BIGINT         NOT NULL REFERENCES suscripcion (id) ON DELETE RESTRICT,
    tipo            VARCHAR(32)    NOT NULL DEFAULT 'ONBOARDING'
        CHECK (tipo IN ('ONBOARDING', 'CAMBIO_PLAN')),
    plan_destino_id BIGINT         NULL REFERENCES saas_plan (id) ON DELETE RESTRICT,
    estado          VARCHAR(24)    NOT NULL
        CHECK (estado IN ('PENDIENTE_PAGO', 'COMPLETADA', 'CANCELADA')),
    monto           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda          VARCHAR(8)     NOT NULL DEFAULT 'USD',
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_compra_empresa ON saas_compra (empresa_id);
CREATE INDEX IF NOT EXISTS idx_saas_compra_suscripcion ON saas_compra (suscripcion_id);

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

CREATE TABLE IF NOT EXISTS categoria (
    id          BIGSERIAL PRIMARY KEY,
    empresa_id  BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    created_by  BIGINT       REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT uk_categoria_empresa_nombre UNIQUE (empresa_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_categoria_empresa ON categoria (empresa_id);

CREATE TABLE IF NOT EXISTS proveedor (
    id            BIGSERIAL PRIMARY KEY,
    empresa_id    BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    documento     VARCHAR(32)  NOT NULL,
    razon_social  VARCHAR(255) NOT NULL,
    contacto      VARCHAR(150),
    telefono      VARCHAR(40),
    email         VARCHAR(255),
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ,
    created_by    BIGINT       REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT uk_proveedor_empresa_documento UNIQUE (empresa_id, documento)
);

CREATE INDEX IF NOT EXISTS idx_proveedor_empresa ON proveedor (empresa_id);

CREATE TABLE IF NOT EXISTS producto (
    id             BIGSERIAL PRIMARY KEY,
    empresa_id     BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    codigo         VARCHAR(64)  NOT NULL,
    nombre         VARCHAR(255) NOT NULL,
    descripcion    TEXT,
    categoria_id   BIGINT       NOT NULL REFERENCES categoria (id) ON DELETE RESTRICT,
    unidad_medida  VARCHAR(20)  NOT NULL DEFAULT 'UND',
    stock_minimo          NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    purchase_cost         NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (purchase_cost >= 0),
    sale_price            NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
    proveedor_preferido_id BIGINT       REFERENCES proveedor (id) ON DELETE SET NULL,
    activo                BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    created_by     BIGINT       REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT uk_producto_empresa_codigo UNIQUE (empresa_id, codigo),
    CONSTRAINT chk_producto_stock_min CHECK (stock_minimo >= 0),
    CONSTRAINT chk_producto_purchase_cost CHECK (purchase_cost >= 0),
    CONSTRAINT chk_producto_sale_price CHECK (sale_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_producto_empresa ON producto (empresa_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto (categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON producto (activo);
CREATE INDEX IF NOT EXISTS idx_producto_proveedor_pref ON producto (proveedor_preferido_id);

CREATE TABLE IF NOT EXISTS bodega (
    id          BIGSERIAL PRIMARY KEY,
    empresa_id  BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    codigo      VARCHAR(32)  NOT NULL,
    nombre      VARCHAR(150) NOT NULL,
    direccion   VARCHAR(255),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ,
    created_by  BIGINT       REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT uk_bodega_empresa_codigo UNIQUE (empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_bodega_empresa ON bodega (empresa_id);

CREATE TABLE IF NOT EXISTS inventario (
    producto_id  BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    bodega_id    BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    cantidad                   NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    ultima_alerta_proveedor_at TIMESTAMPTZ,
    PRIMARY KEY (producto_id, bodega_id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON inventario (bodega_id);

CREATE TABLE IF NOT EXISTS pedido_proveedor_mensaje (
    id                         BIGSERIAL PRIMARY KEY,
    empresa_id                 BIGINT        NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    producto_id                BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    bodega_id                  BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    proveedor_id               BIGINT        NOT NULL REFERENCES proveedor (id) ON DELETE RESTRICT,
    origen                     VARCHAR(32)   NOT NULL
        CHECK (origen IN ('ALERTA_AUTOMATICA', 'SIMULACION_INVENTARIO')),
    estado                     VARCHAR(20)   NOT NULL
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    cantidad_sugerida          NUMERIC(14, 4) NOT NULL,
    cantidad_para_proveedor    NUMERIC(14, 4) NOT NULL,
    existencia_snapshot        NUMERIC(14, 4) NOT NULL,
    stock_minimo_snapshot      NUMERIC(14, 4) NOT NULL,
    unidad_medida              VARCHAR(20)   NOT NULL,
    creado_en                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    resuelto_en                TIMESTAMPTZ,
    resuelto_por_usuario_id    BIGINT        REFERENCES usuario (id) ON DELETE SET NULL,
    notas_admin                TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_pedido_mensaje_pendiente_linea
    ON pedido_proveedor_mensaje (empresa_id, producto_id, bodega_id)
    WHERE estado = 'PENDIENTE';

CREATE INDEX IF NOT EXISTS idx_pedido_mensaje_empresa_estado_creado
    ON pedido_proveedor_mensaje (empresa_id, estado, creado_en DESC);

COMMENT ON TABLE pedido_proveedor_mensaje IS 'Bandeja admin: pedido sugerido al proveedor; el correo SMTP solo tras APROBADO.';

CREATE TABLE IF NOT EXISTS movimiento (
    id                    BIGSERIAL PRIMARY KEY,
    empresa_id            BIGINT      NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    tipo_movimiento       VARCHAR(30) NOT NULL
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE', 'SALIDA_POR_VENTA')),
    motivo                VARCHAR(80),
    fecha_movimiento      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id            BIGINT      NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
    proveedor_id          BIGINT      REFERENCES proveedor (id) ON DELETE RESTRICT,
    referencia_documento  VARCHAR(64),
    observacion           TEXT,
    estado                VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO'
        CHECK (estado IN ('COMPLETADO', 'ANULADO', 'BORRADOR')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimiento_empresa ON movimiento (empresa_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento (fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimiento_usuario ON movimiento (usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_tipo ON movimiento (tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimiento_proveedor ON movimiento (proveedor_id) WHERE proveedor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS movimiento_detalle (
    id                  BIGSERIAL PRIMARY KEY,
    movimiento_id       BIGINT        NOT NULL REFERENCES movimiento (id) ON DELETE RESTRICT,
    producto_id         BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    cantidad            NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    bodega_origen_id    BIGINT        REFERENCES bodega (id) ON DELETE RESTRICT,
    bodega_destino_id   BIGINT        REFERENCES bodega (id) ON DELETE RESTRICT,
    motivo_linea        VARCHAR(50),
    CONSTRAINT chk_detalle_bodegas_transfer
        CHECK (
            NOT (bodega_origen_id IS NOT NULL AND bodega_destino_id IS NOT NULL)
            OR (bodega_origen_id <> bodega_destino_id)
        )
);

CREATE INDEX IF NOT EXISTS idx_movdet_mov ON movimiento_detalle (movimiento_id);
CREATE INDEX IF NOT EXISTS idx_movdet_producto ON movimiento_detalle (producto_id);
CREATE INDEX IF NOT EXISTS idx_movdet_origen ON movimiento_detalle (bodega_origen_id);
CREATE INDEX IF NOT EXISTS idx_movdet_destino ON movimiento_detalle (bodega_destino_id);

COMMENT ON TABLE movimiento IS 'Cabecera de documento de inventario; trazabilidad por usuario y fecha.';
COMMENT ON TABLE movimiento_detalle IS 'Líneas: validar origen/destino según movimiento.tipo_movimiento en aplicación.';
COMMENT ON TABLE inventario IS 'Saldo actual por producto y bodega; actualizar en servicio transaccional junto al detalle.';

CREATE TABLE IF NOT EXISTS cliente (
    id          BIGSERIAL PRIMARY KEY,
    empresa_id  BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    nombre      VARCHAR(200) NOT NULL,
    documento   VARCHAR(32),
    telefono    VARCHAR(40),
    email       VARCHAR(255),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_empresa ON cliente (empresa_id);
CREATE INDEX IF NOT EXISTS idx_cliente_empresa_nombre ON cliente (empresa_id, nombre);

CREATE TABLE IF NOT EXISTS venta_consecutivo (
    empresa_id BIGINT PRIMARY KEY REFERENCES empresa (id) ON DELETE RESTRICT,
    ultimo     BIGINT NOT NULL DEFAULT 0 CHECK (ultimo >= 0)
);

CREATE TABLE IF NOT EXISTS venta (
    id               BIGSERIAL PRIMARY KEY,
    empresa_id       BIGINT        NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    bodega_id        BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    usuario_id       BIGINT        NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
    cliente_id       BIGINT        REFERENCES cliente (id) ON DELETE RESTRICT,
    movimiento_id    BIGINT        UNIQUE REFERENCES movimiento (id) ON DELETE RESTRICT,
    codigo_publico   VARCHAR(32)   NOT NULL,
    fecha_venta      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    total            NUMERIC(14, 2) NOT NULL CHECK (total >= 0),
    estado           VARCHAR(24)   NOT NULL DEFAULT 'CONFIRMADA'
        CHECK (estado IN ('CONFIRMADA', 'ANULACION_SOLICITADA', 'ANULADA', 'PENDIENTE_PAGO', 'CANCELADA_SIN_PAGO')),
    observacion      TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    pago_estado      VARCHAR(24),
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id   VARCHAR(255),
    paid_at          TIMESTAMPTZ,
    CONSTRAINT uk_venta_empresa_codigo_publico UNIQUE (empresa_id, codigo_publico)
);

CREATE INDEX IF NOT EXISTS idx_venta_empresa_fecha ON venta (empresa_id, fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_venta_usuario ON venta (usuario_id);
CREATE INDEX IF NOT EXISTS idx_venta_cliente ON venta (cliente_id) WHERE cliente_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_venta_stripe_session ON venta (stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS venta_detalle (
    id                BIGSERIAL PRIMARY KEY,
    venta_id          BIGINT         NOT NULL REFERENCES venta (id) ON DELETE RESTRICT,
    producto_id       BIGINT         NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    cantidad          NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio_unitario   NUMERIC(14, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal          NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_producto ON venta_detalle (producto_id);

-- Empresa semilla (opcional en BD vacía; DataInitializer puede crear otra vía API en el futuro)
INSERT INTO empresa (nombre, identificacion, email_contacto, estado, created_at)
SELECT v.nombre, v.identificacion, v.email_contacto, v.estado, NOW()
FROM (
    VALUES
        ('Empresa desarrollo (default)', 'DEV-DEFAULT-001', 'contacto@empresa-default.local', 'ACTIVA')
) AS v(nombre, identificacion, email_contacto, estado)
WHERE NOT EXISTS (SELECT 1 FROM empresa e WHERE e.identificacion = v.identificacion);

-- Roles base (idempotente)
INSERT INTO rol (codigo, nombre, descripcion)
SELECT v.codigo, v.nombre, v.descripcion
FROM (
    VALUES
        ('SUPER_ADMIN', 'Super administrador', 'Administrador principal de la empresa (multi-tenant)'),
        ('ADMIN',       'Administrador',      'Acceso total a la información y configuración'),
        ('AUX_BODEGA',  'Auxiliar de bodega', 'Operaciones de inventario y consultas operativas'),
        ('COMPRAS',     'Responsable de abastecimiento', 'Consulta de stock, panel de reposición y registro de entradas de abastecimiento'),
        ('VENTAS',      'RESPONSABLE DE VENTAS', 'Registro de ventas, consulta de stock y salidas por venta'),
        ('GERENCIA',    'Gerencia',           'Consulta de reportes e inventario')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM rol r WHERE r.codigo = v.codigo);

INSERT INTO saas_plan (codigo, nombre, descripcion, precio_mensual, moneda, max_bodegas, max_usuarios, features, orden, activo)
SELECT v.codigo, v.nombre, v.descripcion, v.precio, v.moneda, v.max_bodegas, v.max_usuarios, v.features, v.orden, TRUE
FROM (
    VALUES
        ('STARTER',
         'Starter',
         'Control profesional de inventario desde el primer día.',
         19900.00,
         'COP',
         2,
         3,
         'Productos y categorías|Movimientos de entrada y salida|Consulta de existencias y alertas|Soporte por correo',
         1),
        ('PROFESIONAL',
         'Pro',
         'Diseñado para crecer con tu empresa: más bodegas, equipo ampliado y reportes.',
         69900.00,
         'COP',
         5,
         10,
         'Más bodegas y usuarios|Transferencias y ajustes|Proveedores y roles ampliados|Reportes kardex y exportación CSV',
         2),
        ('EMPRESA',
         'Empresarial',
         'Escala sin límites para operaciones que exigen el máximo control.',
         149900.00,
         'COP',
         10,
         25,
         'Límites ampliados en bodegas y usuarios|Módulos avanzados del plan|Prioridad en soporte|Hoja de ruta multi-sede e integraciones',
         3)
) AS v(codigo, nombre, descripcion, precio, moneda, max_bodegas, max_usuarios, features, orden)
WHERE NOT EXISTS (SELECT 1 FROM saas_plan p WHERE p.codigo = v.codigo);

-- MFA: estado de challenge (multi-instancia) y códigos de respaldo
CREATE TABLE IF NOT EXISTS mfa_challenge_state (
    jti           VARCHAR(64) PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    failure_count INT          NOT NULL DEFAULT 0,
    consumed      BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenge_state_expires ON mfa_challenge_state (expires_at);

CREATE TABLE IF NOT EXISTS usuario_mfa_backup_code (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuario_mfa_backup_usuario ON usuario_mfa_backup_code (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_mfa_backup_unused ON usuario_mfa_backup_code (usuario_id) WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS refresh_token (
    id                     BIGSERIAL PRIMARY KEY,
    usuario_id             BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash             VARCHAR(64)  NOT NULL UNIQUE,
    family_id              VARCHAR(36)  NOT NULL,
    issued_at              TIMESTAMPTZ  NOT NULL,
    expires_at             TIMESTAMPTZ  NOT NULL,
    family_expires_at      TIMESTAMPTZ  NOT NULL,
    revoked_at             TIMESTAMPTZ,
    replaced_by_token_id   BIGINT       REFERENCES refresh_token (id) ON DELETE SET NULL,
    last_used_at           TIMESTAMPTZ,
    created_from_ip        VARCHAR(64),
    user_agent             VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_family ON refresh_token (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario ON refresh_token (usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario_active
    ON refresh_token (usuario_id) WHERE revoked_at IS NULL;
