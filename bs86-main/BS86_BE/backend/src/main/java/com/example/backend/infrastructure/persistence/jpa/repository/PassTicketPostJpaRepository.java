package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.PassTicketPostEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PassTicketPostJpaRepository extends JpaRepository<PassTicketPostEntity, Long> {

    @EntityGraph(attributePaths = {
            "ticket",
            "ticket.booking",
            "ticket.booking.court",
            "ticket.booking.court.field",
            "ownerUser",
            "field"
    })
    @Query("select p from PassTicketPostEntity p where p.id = :postId")
    Optional<PassTicketPostEntity> findWithDetailsById(@Param("postId") Long postId);

    Optional<PassTicketPostEntity> findByTicket_IdAndStatus(Long ticketId, PassPostStatus status);

    @Query("""
            select p
            from PassTicketPostEntity p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch p.ownerUser ou
            where p.status = :status
            order by p.createdAt desc
            """)
    List<PassTicketPostEntity> findAllActiveWithDetails(@Param("status") PassPostStatus status);

    @Query("""
            select p
            from PassTicketPostEntity p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch p.ownerUser ou
            where p.ticket.id = :ticketId
              and p.status = :status
            """)
    Optional<PassTicketPostEntity> findActiveByTicketIdWithDetails(
            @Param("ticketId") Long ticketId,
            @Param("status") PassPostStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from PassTicketPostEntity p
            join fetch p.ticket t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch p.ownerUser ou
            join fetch p.field pf
            where p.id = :postId
            """)
    Optional<PassTicketPostEntity> findByIdForUpdate(@Param("postId") Long postId);

    List<PassTicketPostEntity> findByTicket_Id(Long ticketId);
}
