package com.inventario.domain.repository;

import com.inventario.domain.entity.OnboardingEmailChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OnboardingEmailChallengeRepository extends JpaRepository<OnboardingEmailChallenge, Long> {

    Optional<OnboardingEmailChallenge> findTopByEmailIgnoreCaseAndPlanCodigoIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String email, String planCodigo, String status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            "update OnboardingEmailChallenge e set e.status = 'CANCELLED' "
                    + "where lower(e.email) = lower(:email) and lower(e.planCodigo) = lower(:plan) and e.status = 'PENDING'")
    int cancelPendingForEmailAndPlan(@Param("email") String email, @Param("plan") String plan);

    Optional<OnboardingEmailChallenge> findFirstBySessionTokenAndStatusAndConsumedAtIsNull(
            UUID sessionToken, String status);
}
