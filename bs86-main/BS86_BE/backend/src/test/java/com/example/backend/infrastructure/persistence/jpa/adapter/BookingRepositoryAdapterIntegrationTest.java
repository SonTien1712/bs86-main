package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.BookingJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
@ActiveProfiles("test")
class BookingRepositoryAdapterIntegrationTest {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingJpaRepository bookingJpaRepository;

    @Autowired
    private UserJpaRepository userJpaRepository;

    @Autowired
    private OwnerProfileJpaRepository ownerProfileJpaRepository;

    @Autowired
    private FieldJpaRepository fieldJpaRepository;

    @Autowired
    private CourtJpaRepository courtJpaRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    void findUpcomingConfirmedBookings_mapsLazyRelationsOutsideRepositoryQueryTransaction() {
        long suffix = System.nanoTime();
        LocalDate bookingDate = LocalDate.now().plusDays(1);

        UserEntity customer = new UserEntity();
        customer.setEmail("booking-customer-" + suffix + "@example.com");
        customer.setStatus(UserStatus.ACTIVE);
        customer.setFullName("Booking Customer");
        customer = userJpaRepository.save(customer);

        UserEntity ownerUser = new UserEntity();
        ownerUser.setEmail("booking-owner-" + suffix + "@example.com");
        ownerUser.setStatus(UserStatus.ACTIVE);
        ownerUser.setFullName("Booking Owner");
        ownerUser = userJpaRepository.save(ownerUser);

        OwnerProfileEntity ownerProfile = new OwnerProfileEntity();
        ownerProfile.setUser(ownerUser);
        ownerProfile.setPayoutEnabled(false);
        ownerProfile = ownerProfileJpaRepository.save(ownerProfile);

        FieldEntity field = new FieldEntity();
        field.setOwner(ownerProfile);
        field.setName("Booking Test Field " + suffix);
        field.setSlug("booking-test-field-" + suffix);
        field.setAddress("123 Test Street");
        field.setSportType("FOOTBALL");
        field.setStatus(FieldStatus.ACTIVE);
        field.setLatitude(10.0);
        field.setLongitude(106.0);
        field = fieldJpaRepository.save(field);

        CourtEntity court = new CourtEntity();
        court.setField(field);
        court.setCourtNumber(1);
        court.setStatus(CourtStatus.ACTIVE);
        court = courtJpaRepository.save(court);

        BookingEntity booking = new BookingEntity();
        booking.setCustomer(customer);
        booking.setCourt(court);
        booking.setOwnerProfile(ownerProfile);
        booking.setBookingDate(bookingDate);
        booking.setStartTime(LocalTime.of(9, 0));
        booking.setEndTime(LocalTime.of(10, 0));
        booking.setBookingStatus(OrderStatus.CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setTotalAmount(new BigDecimal("250000"));
        booking.setPlatformCommission(new BigDecimal("25000"));
        booking.setMerchantRevenue(new BigDecimal("225000"));
        booking.setPaymentReference("PAY-" + suffix);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setCreatedBy("test");
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setUpdatedBy("test");
        booking.setDeleted(false);
        Long bookingId = bookingJpaRepository.saveAndFlush(booking).getId();

        entityManager.clear();

        List<Booking> bookings = bookingRepository.findUpcomingConfirmedBookings(bookingDate, bookingDate);
        Booking mapped = bookings.stream()
                .filter(candidate -> candidate.getId().equals(bookingId))
                .findFirst()
                .orElseThrow();

        assertNotNull(mapped.getCustomer());
        assertEquals(customer.getEmail(), mapped.getCustomer().getEmail());
        assertNotNull(mapped.getCourt());
        assertNotNull(mapped.getCourt().getField());
        assertEquals(field.getName(), mapped.getCourt().getField().getName());
        assertNotNull(mapped.getOwnerProfile());
        assertNotNull(mapped.getOwnerProfile().getUser());
        assertEquals(ownerUser.getEmail(), mapped.getOwnerProfile().getUser().getEmail());
    }
}
