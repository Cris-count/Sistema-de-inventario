package com.inventario.domain.repository;

import com.inventario.domain.entity.OnboardingPin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingPinRepository extends JpaRepository<OnboardingPin, Long> {

    boolean existsByPin(String pin);
}
