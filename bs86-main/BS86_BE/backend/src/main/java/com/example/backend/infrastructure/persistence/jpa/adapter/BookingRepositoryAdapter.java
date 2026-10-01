package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.BookingJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.BookingMapper;
import com.example.backend.infrastructure.persistence.mapper.CourtMapper;
import com.example.backend.infrastructure.persistence.mapper.FieldMapper;
import com.example.backend.infrastructure.persistence.mapper.OwnerProfileMapper;
import com.example.backend.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookingRepositoryAdapter implements BookingRepository {
    private final BookingMapper mapper;
    private final UserMapper userMapper;
    private final CourtMapper courtMapper;
    private final FieldMapper fieldMapper;
    private final OwnerProfileMapper ownerMapper;
    private final BookingJpaRepository jpaRepository;


    @Override
    @Transactional
    public Booking save(Booking booking) {
        BookingEntity saved = jpaRepository.save(toEntitySafe(booking));
        return toDomainSafe(saved);
    }

    @Override
    public Optional<Booking> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomainSafe);
    }

    @Override
    public List<Booking> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomainSafe).collect(Collectors.toList());
    }

    @Override
    public List<Booking> findByOwnerProfile_IdAndBookingDateAndPaymentStatus(
            Long ownerProfileId, LocalDate bookingDate, PaymentStatus paymentStatus) {
        return jpaRepository.findByOwnerProfile_IdAndBookingDateAndPaymentStatus(
                ownerProfileId, bookingDate, paymentStatus)
                .stream().map(this::toDomainSafe).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Booking> findByCustomerId(Long customerId) {
        return jpaRepository.findByCustomerId(customerId).stream()
                .map(this::toDomainSafe)
                .collect(Collectors.toList());
    }

    @Override
    public Page<Booking> findByCustomerId(Long customerId, Pageable pageable) {
        return jpaRepository.findByCustomer_Id(customerId, pageable)
                .map(this::toDomainSafe);
    }

    @Override
    public List<Booking> findByCustomerIdAndBookingStatus(Long customerId, OrderStatus bookingStatus) {
        return jpaRepository.findByCustomer_IdAndBookingStatus(customerId, bookingStatus).stream()
                .map(this::toDomainSafe)
                .collect(Collectors.toList());
    }

    @Override
    public Page<Booking> findByCustomerIdAndBookingStatusIn(
            Long customerId,
            List<OrderStatus> bookingStatuses,
            Pageable pageable
    ) {
        return jpaRepository.findByCustomer_IdAndBookingStatusIn(customerId, bookingStatuses, pageable)
                .map(this::toDomainSafe);
    }

    @Override
    public List<Booking> findExpiredPendingBookings(LocalDateTime now) {
        return jpaRepository.findByBookingStatusAndExpiresAtBefore(OrderStatus.PENDING_PAYMENT, now).stream()
                .map(this::toDomainSafe)
                .collect(Collectors.toList());
    }

    @Override
    public List<Booking> findUpcomingConfirmedBookings(LocalDate fromDate, LocalDate toDate) {
        return jpaRepository.findUpcomingConfirmedBookings(fromDate, toDate).stream()
                .map(this::toDomainSafe)
                .collect(Collectors.toList());
    }

    private BookingEntity toEntitySafe(Booking domain) {
        if (domain == null)
            return null;
        BookingEntity entity = mapper.toEntity(domain);
        if (domain.getCustomer() != null) {
            entity.setCustomer(userMapper.toEntity(domain.getCustomer()));
        } else if (domain.getCustomerId() != null) {
            UserEntity customerRef = new UserEntity();
            customerRef.setId(domain.getCustomerId());
            entity.setCustomer(customerRef);
        }
        if (domain.getCourt() != null) {
            entity.setCourt(courtMapper.toEntity(domain.getCourt()));
        }
        if (entity.getCourt() == null && domain.getCourt() != null && domain.getCourt().getId() != null) {
            CourtEntity courtRef = new CourtEntity();
            courtRef.setId(domain.getCourt().getId());
            entity.setCourt(courtRef);
        }
        if (domain.getOwnerProfile() != null) {
            entity.setOwnerProfile(ownerMapper.toEntity(domain.getOwnerProfile()));
        }
        if (entity.getOwnerProfile() == null && domain.getOwnerProfile() != null && domain.getOwnerProfile().getId() != null) {
            OwnerProfileEntity ownerRef = new OwnerProfileEntity();
            ownerRef.setId(domain.getOwnerProfile().getId());
            entity.setOwnerProfile(ownerRef);
        }
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setCreatedBy(domain.getCreatedBy());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setUpdatedBy(domain.getUpdatedBy());
        entity.setDeleted(domain.isDeleted());
        entity.setDeletedAt(domain.getDeletedAt());
        entity.setDeletedBy(domain.getDeletedBy());
        return entity;
    }

    private Booking toDomainSafe(BookingEntity entity) {
        if (entity == null)
            return null;
        Booking domain = mapper.toDomain(entity);
        if (entity.getCustomer() != null) {
            domain.setCustomer(userMapper.toDomain(entity.getCustomer()));
            domain.setCustomerId(entity.getCustomer().getId());
        }
        if (entity.getCourt() != null) {
            domain.setCourt(courtMapper.toDomain(entity.getCourt()));
            if (entity.getCourt().getField() != null && domain.getCourt() != null) {
                domain.getCourt().setField(fieldMapper.toDomain(entity.getCourt().getField()));
            }
        }
        if (entity.getOwnerProfile() != null) {
            domain.setOwnerProfile(ownerMapper.toDomain(entity.getOwnerProfile()));
            domain.setMerchantId(entity.getOwnerProfile().getId());
        }
        domain.setCreatedAt(entity.getCreatedAt());
        domain.setCreatedBy(entity.getCreatedBy());
        domain.setUpdatedAt(entity.getUpdatedAt());
        domain.setUpdatedBy(entity.getUpdatedBy());
        domain.setDeleted(Boolean.TRUE.equals(entity.getDeleted()));
        domain.setDeletedAt(entity.getDeletedAt());
        domain.setDeletedBy(entity.getDeletedBy());
        return domain;
    }
    @Override
    public long countBooking() {
        return jpaRepository.count();
    }

    @Override
    public BigDecimal getTotalRevenue() {
        return jpaRepository.getTotalRevenue();
    }
}
