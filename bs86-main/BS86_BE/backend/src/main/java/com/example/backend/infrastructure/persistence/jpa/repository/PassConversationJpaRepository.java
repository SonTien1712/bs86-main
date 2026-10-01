package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassConversationJpaRepository extends JpaRepository<PassConversationEntity, Long> {

    @Query("""
            select c
            from PassConversationEntity c
            join fetch c.passPost p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court ct
            join fetch ct.field f
            join fetch c.ownerUser ou
            join fetch c.interestedUser iu
            where p.id = :postId
              and iu.id = :interestedUserId
            """)
    Optional<PassConversationEntity> findByPostIdAndInterestedUserId(
            @Param("postId") Long postId,
            @Param("interestedUserId") Long interestedUserId
    );

    @Query("""
            select c
            from PassConversationEntity c
            join fetch c.passPost p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court ct
            join fetch ct.field f
            join fetch c.ownerUser ou
            join fetch c.interestedUser iu
            where ou.id = :userId or iu.id = :userId
            order by c.updatedAt desc
            """)
    List<PassConversationEntity> findMyConversations(@Param("userId") Long userId);

    @Query("""
            select c
            from PassConversationEntity c
            join fetch c.passPost p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court ct
            join fetch ct.field f
            join fetch c.ownerUser ou
            join fetch c.interestedUser iu
            where c.id = :conversationId
            """)
    Optional<PassConversationEntity> findWithDetailsById(@Param("conversationId") Long conversationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c
            from PassConversationEntity c
            join fetch c.passPost p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court ct
            join fetch ct.field f
            join fetch c.ownerUser ou
            join fetch c.interestedUser iu
            where c.id = :conversationId
            """)
    Optional<PassConversationEntity> findByIdForUpdate(@Param("conversationId") Long conversationId);

    @Query("""
            select c
            from PassConversationEntity c
            join fetch c.ownerUser ou
            join fetch c.interestedUser iu
            where c.passPost.id = :postId
            """)
    List<PassConversationEntity> findAllByPassPostId(@Param("postId") Long postId);
}
