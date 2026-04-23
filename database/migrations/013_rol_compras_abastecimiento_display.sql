-- Rol COMPRAS: nombre visible alineado a «Responsable de abastecimiento» (clave interna COMPRAS sin cambios).
UPDATE rol
SET
    nombre = 'Responsable de abastecimiento',
    descripcion = 'Consulta de stock, panel de reposición y registro de entradas de abastecimiento'
WHERE codigo = 'COMPRAS';
