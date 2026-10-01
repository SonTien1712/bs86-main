package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourtJpaRepository extends JpaRepository<CourtEntity, Long> {

    boolean existsByFieldIdAndCourtNumber(Long fieldId, Integer courtNumber);

    List<CourtEntity> findByFieldId(Long fieldId);
    @Query("SELECT DISTINCT c FROM CourtEntity c JOIN c.field f WHERE c.status = 'ACTIVE'")
    List<CourtEntity> findAllActive();
}
