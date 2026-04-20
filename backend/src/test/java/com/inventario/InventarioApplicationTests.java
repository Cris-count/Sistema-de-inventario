package com.inventario;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@ActiveProfiles("test")
class InventarioApplicationTests {

    @Test
    void contextLoads() {
        // Arranque completo del contexto Spring (seguridad, JPA, DataInitializer) contra H2 en memoria.
    }
}
