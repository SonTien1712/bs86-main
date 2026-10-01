package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.TicketStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.TicketEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketJpaRepository extends JpaRepository<TicketEntity, Long> {

    boolean existsByTicketCode(String ticketCode);

    boolean existsByQrToken(String qrToken);

    Optional<TicketEntity> findByBooking_Id(Long bookingId);

    @EntityGraph(attributePaths = {
            "booking",
            "booking.court",
            "booking.court.field",
            "transaction",
            "currentHolder"
    })
    @Query("select t from TicketEntity t where t.id = :ticketId")
    Optional<TicketEntity> findWithDetailsById(@Param("ticketId") Long ticketId);

    @EntityGraph(attributePaths = {
            "booking",
            "booking.court",
            "booking.court.field",
            "transaction",
            "currentHolder"
    })
    @Query("select t from TicketEntity t where t.qrToken = :qrToken")
    Optional<TicketEntity> findWithDetailsByQrToken(@Param("qrToken") String qrToken);

    @Query("""
            select t
            from TicketEntity t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch t.transaction tr
            join fetch t.currentHolder h
            where h.id = :holderId
            order by t.validFrom desc
            """)
    List<TicketEntity> findAllOwnedByUser(@Param("holderId") Long holderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select t
            from TicketEntity t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch t.transaction tr
            join fetch t.currentHolder h
            where t.id = :ticketId
            """)
    Optional<TicketEntity> findByIdForUpdate(@Param("ticketId") Long ticketId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select t
            from TicketEntity t
            join fetch t.booking b
            join fetch b.court c
            join fetch c.field f
            join fetch t.transaction tr
            join fetch t.currentHolder h
            where t.qrToken = :qrToken
            """)
    Optional<TicketEntity> findByQrTokenForUpdate(@Param("qrToken") String qrToken);

    List<TicketEntity> findByStatusAndValidUntilBefore(TicketStatus status, LocalDateTime validUntil);
}
