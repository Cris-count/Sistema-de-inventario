-- Rol mínimo para que DataInitializer pueda crear el usuario admin en tests de arranque.
INSERT INTO rol (codigo, nombre, descripcion, created_at)
VALUES ('ADMIN', 'Administrador', 'Test', CURRENT_TIMESTAMP);
