package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface CourtSlotJpaRepository extends JpaRepository<CourtSlotEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from CourtSlotEntity s where s.id in :ids")
    List<CourtSlotEntity> findAllByIdForUpdate(@Param("ids") List<Long> ids);

    boolean existsByCourtIdAndSlotDateAndStartTimeAndStatusNot(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            SlotStatus excludedStatus
    );

    Optional<CourtSlot> findByCourtIdAndSlotDateAndStartTime(
            Long courtId,
            LocalDate slotDate,
            LocalTime startTime
    );

    List<CourtSlotEntity> findByCourt_IdAndSlotDate(
            Long courtId,
            LocalDate date
    );

    List<CourtSlotEntity> findByCourt_Field_IdAndStatusOrderBySlotDateAscStartTimeAsc(
            Long fieldId,
            SlotStatus status
    );

    @Query("""
    select count(s) > 0
    from CourtSlotEntity s
    where s.court.id = :courtId
      and s.slotDate = :date
      and s.status in ('BOOKED', 'LOCKED')
      and (s.startTime < :endTime and :startTime < s.endTime)
""")
    boolean existsOverlappingSlot(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT s FROM CourtSlotEntity s WHERE s.status = 'LOCKED' AND s.updatedAt < :timeThreshold")
    List<CourtSlotEntity> findExpiredLockedSlots(@Param("timeThreshold") Long timeThreshold);

    @Query("""
    select s
    from CourtSlotEntity s
    where s.court.id = :courtId
      and s.slotDate = :date
      and s.startTime >= :startTime
      and s.endTime <= :endTime
    order by s.startTime asc
""")
    List<CourtSlotEntity> findByCourtIdAndSlotDateAndTimeRange(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select s
    from CourtSlotEntity s
    where s.court.id = :courtId
      and s.slotDate = :date
      and s.startTime >= :startTime
      and s.endTime <= :endTime
    order by s.startTime asc
""")
    List<CourtSlotEntity> findByCourtIdAndSlotDateAndTimeRangeForUpdate(
            @Param("courtId") Long courtId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    List<CourtSlotEntity> findBySlotDateBefore(LocalDate date);
}
