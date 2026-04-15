-- Actualiza precios COP y textos públicos (idempotente) para instalaciones ya pobladas.
-- La app también sincroniza desde SaasPlanPublicCatalog al arrancar.

UPDATE saas_plan
SET nombre              = 'Starter',
    descripcion         = 'Control profesional de inventario desde el primer día.',
    precio_mensual      = 19900.00,
    moneda              = 'COP',
    features            = 'Productos y categorías|Movimientos de entrada y salida|Consulta de existencias y alertas|Soporte por correo'
WHERE UPPER(codigo) = 'STARTER';

UPDATE saas_plan
SET nombre              = 'Pro',
    descripcion         = 'Diseñado para crecer con tu empresa: más bodegas, equipo ampliado y reportes.',
    precio_mensual      = 69900.00,
    moneda              = 'COP',
    features            = 'Más bodegas y usuarios|Transferencias y ajustes|Proveedores y roles ampliados|Reportes kardex y exportación CSV'
WHERE UPPER(codigo) = 'PROFESIONAL';

UPDATE saas_plan
SET nombre              = 'Empresarial',
    descripcion         = 'Escala sin límites para operaciones que exigen el máximo control.',
    precio_mensual      = 149900.00,
    moneda              = 'COP',
    features            = 'Límites ampliados en bodegas y usuarios|Módulos avanzados del plan|Prioridad en soporte|Hoja de ruta multi-sede e integraciones'
WHERE UPPER(codigo) = 'EMPRESA';
