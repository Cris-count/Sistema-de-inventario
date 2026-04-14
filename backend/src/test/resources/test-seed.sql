-- Esquema creado por Hibernate; datos mínimos antes de DataInitializer (empresa + roles).
INSERT INTO empresa (nombre, identificacion, email_contacto, estado, created_at)
VALUES ('Empresa test', 'TEST-001', NULL, 'ACTIVA', CURRENT_TIMESTAMP);

INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('SUPER_ADMIN', 'Super administrador', 'Test', CURRENT_TIMESTAMP);

INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('ADMIN', 'Administrador', 'Test', CURRENT_TIMESTAMP);

INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('AUX_BODEGA', 'Auxiliar de bodega', 'Test', CURRENT_TIMESTAMP);

INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('COMPRAS', 'Compras', 'Test', CURRENT_TIMESTAMP);

INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('GERENCIA', 'Gerencia', 'Test', CURRENT_TIMESTAMP);
