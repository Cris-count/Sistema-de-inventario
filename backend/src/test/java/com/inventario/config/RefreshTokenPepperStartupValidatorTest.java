package com.inventario.config;

import com.inventario.audit.AuthAuditLogger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RefreshTokenPepperStartupValidatorTest {

    @Mock
    private AuthAuditLogger authAuditLogger;

    @Test
    void run_whenPepperRequiredAndBlank_throwsIllegalState() {
        RefreshTokenProperties p = new RefreshTokenProperties();
        p.setPepperRequired(true);
        p.setHashPepper("  ");
        var v = new RefreshTokenPepperStartupValidator(p, authAuditLogger);
        assertThrows(IllegalStateException.class, () -> v.run(new DefaultApplicationArguments()));
        verify(authAuditLogger).refreshPepperMissingOnStartup();
    }

    @Test
    void run_whenPepperRequiredAndSet_doesNotThrow() throws Exception {
        RefreshTokenProperties p = new RefreshTokenProperties();
        p.setPepperRequired(true);
        p.setHashPepper("valid-pepper-for-tests");
        var v = new RefreshTokenPepperStartupValidator(p, authAuditLogger);
        v.run(new DefaultApplicationArguments());
    }

    @Test
    void run_whenPepperNotRequired_skips() throws Exception {
        RefreshTokenProperties p = new RefreshTokenProperties();
        p.setPepperRequired(false);
        p.setHashPepper("");
        var v = new RefreshTokenPepperStartupValidator(p, authAuditLogger);
        v.run(new DefaultApplicationArguments());
    }
}
