package com.inventario.domain.repository;

import com.inventario.domain.entity.BillingEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingEventRepository extends JpaRepository<BillingEvent, Long> {}
