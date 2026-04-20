package com.inventario.service.saas;

/**
 * Códigos de módulos/servicios del catálogo SaaS (matriz de planes).
 * Valores alineados con contrato de producto; no exponer como enum JPA.
 */
public final class PlanEntitlementCodes {

    private PlanEntitlementCodes() {}

    public static final String INVENTARIO_BASICO = "inventario_basico";
    public static final String CATEGORIAS = "categorias";
    public static final String MOVIMIENTOS_BASICOS = "movimientos_basicos";
    public static final String CONSULTA_STOCK = "consulta_stock";
    public static final String MULTI_BODEGA = "multi_bodega";
    public static final String TRANSFERENCIAS = "transferencias";
    public static final String AJUSTES_INVENTARIO = "ajustes_inventario";
    public static final String PROVEEDORES = "proveedores";
    public static final String USUARIOS = "usuarios";
    public static final String CONFIGURACION_EMPRESA = "configuracion_empresa";
    public static final String REPORTES_BASICOS = "reportes_basicos";
    public static final String HISTORIAL_MOVIMIENTOS = "historial_movimientos";
    public static final String ROLES_AVANZADOS = "roles_avanzados";
    public static final String REPORTES_AVANZADOS = "reportes_avanzados";
    public static final String AUDITORIA = "auditoria";
    public static final String MULTI_SEDE = "multi_sede";
    public static final String INTEGRACIONES = "integraciones";
    public static final String SOPORTE_PRIORITARIO = "soporte_prioritario";
}
