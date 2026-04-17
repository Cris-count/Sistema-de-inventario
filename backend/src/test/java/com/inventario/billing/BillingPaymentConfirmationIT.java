package com.inventario.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.service.saas.PlanChangePendingCloseReason;
import com.inventario.web.dto.billing.BillingDtos.BillingWebhookRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BillingPaymentConfirmationIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private SaasPlanRepository saasPlanRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private SaasCompraRepository saasCompraRepository;

    @Autowired
    private SaasPagoRepository saasPagoRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.billing.api-secret}")
    private String billingSecret;

    @Test
    void confirmValidPayment_activatesCompanyAndSuperAdmin() throws Exception {
        PendingGraph g = seedPendingPaymentGraph();
        assertThat(usuarioRepository.findByEmailIgnoreCase(g.adminEmail()).orElseThrow().getActivo()).isFalse();

        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alreadyConfirmed").value(false))
                .andExpect(jsonPath("$.userCanLogin").value(true));

        Empresa e = empresaRepository.findById(g.empresaId()).orElseThrow();
        assertThat(e.getEstado()).isEqualTo(EstadoEmpresa.ACTIVA);
        assertThat(usuarioRepository.findByEmailIgnoreCase(g.adminEmail()).orElseThrow().getActivo()).isTrue();
        assertThat(saasPagoRepository.findById(g.pagoId()).orElseThrow().getEstado()).isEqualTo(EstadoPago.APROBADO);

        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyConfirmed").value(true));
    }

    @Test
    void webhook_confirmsPayment() throws Exception {
        PendingGraph g = seedPendingPaymentGraph();
        BillingWebhookRequest body = new BillingWebhookRequest(g.pagoId(), "payment.completed");
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("X-Billing-Secret", billingSecret)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void badSecret_returns401() throws Exception {
        PendingGraph g = seedPendingPaymentGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", "wrong-key"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownPago_returns404() throws Exception {
        mockMvc.perform(post("/api/v1/billing/pagos/999999999/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isNotFound());
    }

    @Test
    void webhook_unsupportedEvent_returns400() throws Exception {
        PendingGraph g = seedPendingPaymentGraph();
        BillingWebhookRequest body = new BillingWebhookRequest(g.pagoId(), "charge.failed");
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("X-Billing-Secret", billingSecret)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void planChange_timelyConfirm_appliesDestinationPlan() throws Exception {
        PlanChangeGraph g = seedPlanChangePendingGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alreadyConfirmed").value(false))
                .andExpect(jsonPath("$.planCodigo").value(g.destinoCodigo()));

        Suscripcion s = suscripcionRepository.findById(g.suscripcionId()).orElseThrow();
        assertThat(s.getPlan().getCodigo()).isEqualToIgnoringCase(g.destinoCodigo());
        assertThat(saasCompraRepository.findById(g.compraId()).orElseThrow().getEstado()).isEqualTo(EstadoCompra.COMPLETADA);
        assertThat(saasPagoRepository.findById(g.pagoId()).orElseThrow().getEstado()).isEqualTo(EstadoPago.APROBADO);
    }

    @Test
    void planChange_lateConfirm_afterSystemExpire_appliesDestinationPlan() throws Exception {
        PlanChangeGraph g = seedPlanChangeExpiredBySystemGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Pago recibido con demora: tu plan solicitado queda activo."));

        Suscripcion s = suscripcionRepository.findById(g.suscripcionId()).orElseThrow();
        assertThat(s.getPlan().getCodigo()).isEqualToIgnoringCase(g.destinoCodigo());
    }

    @Test
    void planChange_lateConfirm_idempotentSecondCall() throws Exception {
        PlanChangeGraph g = seedPlanChangeExpiredBySystemGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyConfirmed").value(true));
    }

    @Test
    void planChange_lateConfirm_afterUserCancel_returns409() throws Exception {
        PlanChangeGraph g = seedPlanChangeExpiredGraph(PlanChangePendingCloseReason.CANCELADO_USUARIO);
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isConflict());
    }

    @Test
    void planChange_lateConfirm_whenAnotherPendingExists_returns409() throws Exception {
        PlanChangeGraph g = seedPlanChangeExpiredWithNewerPendingGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isConflict());
    }

    @Test
    void planChange_lateConfirm_whenBeyondGraceWindow_returns409() throws Exception {
        PlanChangeGraph g = seedPlanChangeExpiredBySystemGraphWithAnchor(
                Instant.now().minus(800, ChronoUnit.HOURS));
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isConflict());
    }

    @Test
    void planChange_lateConfirm_whenSystemExpiryMarkerButCompraNotCancelled_returns409() throws Exception {
        PlanChangeGraph g = seedPlanChangeSystemExpiryMarkerButCompraPendingGraph();
        mockMvc.perform(post("/api/v1/billing/pagos/" + g.pagoId() + "/confirmar-onboarding")
                        .header("X-Billing-Secret", billingSecret))
                .andExpect(status().isConflict());
    }

    private PendingGraph seedPendingPaymentGraph() {
        Instant now = Instant.now();
        String suffix = String.valueOf(System.nanoTime());
        SaasPlan plan = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("STARTER")
                .orElseThrow(() -> new IllegalStateException("Plan STARTER no sembrado en test"));

        Empresa e = empresaRepository.save(Empresa.builder()
                .nombre("Empresa pendiente " + suffix)
                .identificacion("PEND-" + suffix)
                .emailContacto("c" + suffix + "@test.local")
                .estado(EstadoEmpresa.COMERCIAL_PENDIENTE)
                .createdAt(now)
                .build());

        Suscripcion s = suscripcionRepository.save(Suscripcion.builder()
                .empresa(e)
                .plan(plan)
                .estado(EstadoSuscripcion.PENDIENTE_PAGO)
                .fechaInicio(now)
                .createdAt(now)
                .build());

        SaasCompra c = saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.ONBOARDING)
                .planDestino(null)
                .estado(EstadoCompra.PENDIENTE_PAGO)
                .monto(plan.getPrecioMensual() != null ? plan.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(plan.getMoneda() != null ? plan.getMoneda() : "USD")
                .createdAt(now)
                .build());

        SaasPago p = saasPagoRepository.save(SaasPago.builder()
                .compra(c)
                .estado(EstadoPago.PENDIENTE)
                .proveedor("TEST")
                .createdAt(now)
                .build());

        Rol superRol = rolRepository.findByCodigo("SUPER_ADMIN").orElseThrow();
        String email = "super+" + suffix + "@test.local";
        Usuario u = new Usuario();
        u.setEmpresa(e);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("TestPassword123!"));
        u.setNombre("Super");
        u.setApellido("Test");
        u.setRol(superRol);
        u.setActivo(false);
        u.setCreatedAt(now);
        usuarioRepository.save(u);

        return new PendingGraph(p.getId(), e.getId(), email);
    }

    private PlanChangeGraph seedPlanChangePendingGraph() {
        Instant now = Instant.now();
        String suffix = String.valueOf(System.nanoTime());
        SaasPlan starter = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("STARTER")
                .orElseThrow(() -> new IllegalStateException("Plan STARTER no sembrado en test"));
        SaasPlan destino = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("PROFESIONAL")
                .orElseThrow(() -> new IllegalStateException("Plan PROFESIONAL no sembrado en test"));

        Empresa e = empresaRepository.save(Empresa.builder()
                .nombre("Empresa plan change " + suffix)
                .identificacion("PC-PEND-" + suffix)
                .emailContacto("pc-pend-" + suffix + "@test.local")
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(now)
                .build());

        Suscripcion s = suscripcionRepository.save(Suscripcion.builder()
                .empresa(e)
                .plan(starter)
                .estado(EstadoSuscripcion.ACTIVA)
                .fechaInicio(now)
                .createdAt(now)
                .build());

        SaasCompra c = saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(destino)
                .estado(EstadoCompra.PENDIENTE_PAGO)
                .monto(destino.getPrecioMensual() != null ? destino.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(destino.getMoneda() != null ? destino.getMoneda() : "COP")
                .createdAt(now)
                .build());

        SaasPago p = saasPagoRepository.save(SaasPago.builder()
                .compra(c)
                .estado(EstadoPago.PENDIENTE)
                .proveedor(PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN)
                .createdAt(now)
                .build());

        return new PlanChangeGraph(p.getId(), c.getId(), s.getId(), destino.getCodigo());
    }

    private PlanChangeGraph seedPlanChangeExpiredBySystemGraph() {
        return seedPlanChangeExpiredGraph(PlanChangePendingCloseReason.EXPIRADO_SISTEMA, Instant.now());
    }

    private PlanChangeGraph seedPlanChangeExpiredBySystemGraphWithAnchor(Instant pagoCreatedAt) {
        return seedPlanChangeExpiredGraph(PlanChangePendingCloseReason.EXPIRADO_SISTEMA, pagoCreatedAt);
    }

    private PlanChangeGraph seedPlanChangeExpiredGraph(String closeReason) {
        return seedPlanChangeExpiredGraph(closeReason, Instant.now());
    }

    private PlanChangeGraph seedPlanChangeExpiredGraph(String closeReason, Instant pagoCreatedAt) {
        Instant now = Instant.now();
        String suffix = String.valueOf(System.nanoTime());
        SaasPlan starter = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("STARTER")
                .orElseThrow(() -> new IllegalStateException("Plan STARTER no sembrado en test"));
        SaasPlan destino = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("PROFESIONAL")
                .orElseThrow(() -> new IllegalStateException("Plan PROFESIONAL no sembrado en test"));

        Empresa e = empresaRepository.save(Empresa.builder()
                .nombre("Empresa plan exp " + suffix)
                .identificacion("PC-EXP-" + suffix)
                .emailContacto("pc-exp-" + suffix + "@test.local")
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(now)
                .build());

        Suscripcion s = suscripcionRepository.save(Suscripcion.builder()
                .empresa(e)
                .plan(starter)
                .estado(EstadoSuscripcion.ACTIVA)
                .fechaInicio(now)
                .createdAt(now)
                .build());

        SaasCompra c = saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(destino)
                .estado(EstadoCompra.CANCELADA)
                .monto(destino.getPrecioMensual() != null ? destino.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(destino.getMoneda() != null ? destino.getMoneda() : "COP")
                .createdAt(now)
                .build());

        SaasPago p = saasPagoRepository.save(SaasPago.builder()
                .compra(c)
                .estado(EstadoPago.RECHAZADO)
                .proveedor(PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN)
                .confirmationChannel(closeReason)
                .createdAt(pagoCreatedAt)
                .build());

        return new PlanChangeGraph(p.getId(), c.getId(), s.getId(), destino.getCodigo());
    }

    /**
     * Compra antigua expirada + otra compra CAMBIO_PLAN aún pendiente de pago (bloquea confirmación tardía del pago viejo).
     */
    private PlanChangeGraph seedPlanChangeExpiredWithNewerPendingGraph() {
        Instant now = Instant.now();
        String suffix = String.valueOf(System.nanoTime());
        SaasPlan starter = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("STARTER")
                .orElseThrow();
        SaasPlan destinoViejo = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("PROFESIONAL")
                .orElseThrow();
        SaasPlan destinoNuevo = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("EMPRESA")
                .orElseThrow();

        Empresa e = empresaRepository.save(Empresa.builder()
                .nombre("Empresa plan race " + suffix)
                .identificacion("PC-RACE-" + suffix)
                .emailContacto("pc-race-" + suffix + "@test.local")
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(now)
                .build());

        Suscripcion s = suscripcionRepository.save(Suscripcion.builder()
                .empresa(e)
                .plan(starter)
                .estado(EstadoSuscripcion.ACTIVA)
                .fechaInicio(now)
                .createdAt(now)
                .build());

        SaasCompra compraVieja = saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(destinoViejo)
                .estado(EstadoCompra.CANCELADA)
                .monto(destinoViejo.getPrecioMensual() != null ? destinoViejo.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(destinoViejo.getMoneda() != null ? destinoViejo.getMoneda() : "COP")
                .createdAt(now)
                .build());

        SaasPago pagoViejo = saasPagoRepository.save(SaasPago.builder()
                .compra(compraVieja)
                .estado(EstadoPago.RECHAZADO)
                .proveedor(PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN)
                .confirmationChannel(PlanChangePendingCloseReason.EXPIRADO_SISTEMA)
                .createdAt(now)
                .build());

        saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(destinoNuevo)
                .estado(EstadoCompra.PENDIENTE_PAGO)
                .monto(destinoNuevo.getPrecioMensual() != null ? destinoNuevo.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(destinoNuevo.getMoneda() != null ? destinoNuevo.getMoneda() : "COP")
                .createdAt(now)
                .build());

        return new PlanChangeGraph(pagoViejo.getId(), compraVieja.getId(), s.getId(), destinoViejo.getCodigo());
    }

    /** Datos incoherentes: canal EXPIRADO_SISTEMA pero compra aún pendiente (no debería ocurrir con flujo normal). */
    private PlanChangeGraph seedPlanChangeSystemExpiryMarkerButCompraPendingGraph() {
        Instant now = Instant.now();
        String suffix = String.valueOf(System.nanoTime());
        SaasPlan starter = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("STARTER")
                .orElseThrow();
        SaasPlan destino = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue("PROFESIONAL")
                .orElseThrow();

        Empresa e = empresaRepository.save(Empresa.builder()
                .nombre("Empresa incoherente " + suffix)
                .identificacion("PC-BAD-" + suffix)
                .emailContacto("pc-bad-" + suffix + "@test.local")
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(now)
                .build());

        Suscripcion s = suscripcionRepository.save(Suscripcion.builder()
                .empresa(e)
                .plan(starter)
                .estado(EstadoSuscripcion.ACTIVA)
                .fechaInicio(now)
                .createdAt(now)
                .build());

        SaasCompra c = saasCompraRepository.save(SaasCompra.builder()
                .empresa(e)
                .suscripcion(s)
                .tipo(SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(destino)
                .estado(EstadoCompra.PENDIENTE_PAGO)
                .monto(destino.getPrecioMensual() != null ? destino.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(destino.getMoneda() != null ? destino.getMoneda() : "COP")
                .createdAt(now)
                .build());

        SaasPago p = saasPagoRepository.save(SaasPago.builder()
                .compra(c)
                .estado(EstadoPago.RECHAZADO)
                .proveedor(PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN)
                .confirmationChannel(PlanChangePendingCloseReason.EXPIRADO_SISTEMA)
                .createdAt(now)
                .build());

        return new PlanChangeGraph(p.getId(), c.getId(), s.getId(), destino.getCodigo());
    }

    private record PendingGraph(long pagoId, long empresaId, String adminEmail) {}

    private record PlanChangeGraph(long pagoId, long compraId, long suscripcionId, String destinoCodigo) {}
}
