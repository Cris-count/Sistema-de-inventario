package com.inventario.service.onboarding;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Envío de correos de onboarding. En desarrollo se registra en log; en producción se puede sustituir por SMTP (JavaMail).
 */
@Slf4j
@Service
public class OnboardingMailNotificationService {

    public void sendEmailVerificationCode(String to, String code, String planNombre) {
        String subject = "Inventario Pro — verifica tu correo";
        String body = "Tu código de verificación para continuar el registro es: "
                + code
                + "\n\nPlan seleccionado: "
                + planNombre
                + "\n\nSi no solicitaste este registro, ignora este mensaje.\n— Inventario Pro";
        log.info("[onboarding-mail] to={}\nSubject: {}\n{}", to, subject, body);
    }
}
