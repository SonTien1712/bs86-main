package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, Long> {

    Page<NotificationEntity> findByUser_IdAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<NotificationEntity> findByUser_IdAndIsReadFalseAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<NotificationEntity> findByIdAndUser_IdAndDeletedFalse(Long id, Long userId);

    long countByUser_IdAndIsReadFalseAndDeletedFalse(Long userId);

    boolean existsByDedupKey(String dedupKey);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update NotificationEntity n
        set n.isRead = true, n.readAt = :readAt
        where n.user.id = :userId
          and n.deleted = false
          and n.isRead = false
    """)
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
}
