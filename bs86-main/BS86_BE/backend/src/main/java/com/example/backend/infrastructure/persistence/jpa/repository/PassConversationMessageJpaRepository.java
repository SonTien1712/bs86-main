package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassConversationMessageJpaRepository extends JpaRepository<PassConversationMessageEntity, Long> {

    List<PassConversationMessageEntity> findByConversation_IdOrderByCreatedAtAsc(Long conversationId);

    Optional<PassConversationMessageEntity> findTopByConversation_IdOrderByCreatedAtDesc(Long conversationId);
}
