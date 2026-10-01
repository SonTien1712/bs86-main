package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.AuditAction;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, Long> {



    Page<AuditLogEntity> findByEntityNameAndEntityId(
            String entityName,
            Long entityId,
            Pageable pageable
    );

    Page<AuditLogEntity> findByChangedBy(
            Long userId,
            Pageable pageable
    );

    Page<AuditLogEntity> findByChangedAtBetween(
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    Page<AuditLogEntity> findByEntityNameAndChangedAtBetween(
            String entityName,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );

    List<AuditLogEntity> findByChangedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );



    long countByChangedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );



    @Query("""
    SELECT a FROM AuditLogEntity a
    LEFT JOIN UserEntity u ON u.id = a.changedBy
    LEFT JOIN FieldEntity f ON f.id = a.entityId

    WHERE (:keyword IS NULL OR
           LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
           LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
           LOWER(f.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    AND (:type IS NULL OR a.entityName = :type)
    AND (:start IS NULL OR a.changedAt >= :start)
    AND (:end IS NULL OR a.changedAt <= :end)
""")
    Page<AuditLogEntity> searchLogs(
            @Param("keyword") String keyword,
            @Param("type") String type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable
    );



    Page<AuditLogEntity> findByAction(
            AuditAction action,
            Pageable pageable
    );



    @Query(value = """
        SELECT * FROM audit_log a
        WHERE (:event IS NULL OR a.new_value->>'event' = :event)
        AND (:result IS NULL OR a.new_value->>'result' = :result)
    """, nativeQuery = true)
    Page<AuditLogEntity> searchByEventAndResult(
            @Param("event") String event,
            @Param("result") String result,
            Pageable pageable
    );

    Page<AuditLogEntity> findByChangedByAndChangedAtBetween(
            Long userId,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    Optional<AuditLogEntity> findFirstByEntityNameAndEntityIdAndActionOrderByChangedAtDesc(
            String entityName,
            Long entityId,
            AuditAction action
    );



}
