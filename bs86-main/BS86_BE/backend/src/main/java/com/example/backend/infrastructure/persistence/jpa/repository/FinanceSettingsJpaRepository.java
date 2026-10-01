package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.FinanceSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinanceSettingsJpaRepository extends JpaRepository<FinanceSettingsEntity, Long> {
}
