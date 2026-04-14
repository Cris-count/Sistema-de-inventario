package com.inventario.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
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

    private record PendingGraph(long pagoId, long empresaId, String adminEmail) {}
}
