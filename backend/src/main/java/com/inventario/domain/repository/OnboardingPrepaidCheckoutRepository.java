package com.inventario.domain.repository;

import com.inventario.domain.entity.OnboardingPrepaidCheckout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OnboardingPrepaidCheckoutRepository extends JpaRepository<OnboardingPrepaidCheckout, Long> {

    Optional<OnboardingPrepaidCheckout> findByStripeSessionId(String stripeSessionId);

    Optional<OnboardingPrepaidCheckout> findByStripeSessionIdAndConsumedAtIsNull(String stripeSessionId);
}
