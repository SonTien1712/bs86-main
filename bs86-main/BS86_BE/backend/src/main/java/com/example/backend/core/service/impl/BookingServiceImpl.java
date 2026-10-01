package com.example.backend.core.service.impl;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.enums.AuditAction;
import com.example.backend.core.enums.EntityType;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.service.AuditService;
import com.example.backend.core.service.BookingService;
import com.example.backend.core.service.FinanceManagementService;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.LedgerService;
import com.example.backend.core.service.NotificationService;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.Role;
import com.example.backend.presentation.exception.BusinessException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BookingServiceImpl implements BookingService {

    private static final long HOLD_TIMEOUT_MINUTES = 10L;

    private final BookingRepository bookingRepository;
    private final AuditService auditService;
    private final LedgerService ledgerService;
    private final FinanceManagementService financeManagementService;
    private final CourtRepository courtRepository;
    private final CourtSlotRepository courtSlotRepository;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;
    private final OwnerProfileRepository ownerProfileRepository;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            AuditService auditService,
            LedgerService ledgerService,
            FinanceManagementService financeManagementService,
            CourtRepository courtRepository,
            CourtSlotRepository courtSlotRepository,
            NotificationService notificationService,
            CurrentUserService currentUserService,
            OwnerProfileRepository ownerProfileRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.auditService = auditService;
        this.ledgerService = ledgerService;
        this.financeManagementService = financeManagementService;
        this.courtRepository = courtRepository;
        this.courtSlotRepository = courtSlotRepository;
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
        this.ownerProfileRepository = ownerProfileRepository;
    }

    @Transactional
    public void confirmPayment(Long bookingId, String paymentReference) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException(
                    "Cannot confirm payment. Current status: " + booking.getPaymentStatus());
        }

        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setBookingStatus(OrderStatus.CONFIRMED);
        booking.setPaymentReference(paymentReference);
        booking.setExpiresAt(null);

        Booking savedBooking = bookingRepository.save(booking);

        auditService.logChange(
                EntityType.BOOKING,
                bookingId,
                AuditAction.STATUS_CHANGE,
                booking,
                savedBooking,
                "Payment confirmed. Transaction reference: " + paymentReference
        );
        ledgerService.recordBookingPayment(savedBooking);
        notificationService.notifyPaymentSuccess(savedBooking);
    }

    @Transactional
    public void cancelBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getBookingStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel completed booking");
        }

        releaseReservedSlots(booking);
        booking.setBookingStatus(OrderStatus.CANCELLED);
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.CANCELLED);
        }
        booking.setExpiresAt(null);
        Booking savedBooking = bookingRepository.save(booking);

        auditService.logChange(
                EntityType.BOOKING,
                bookingId,
                AuditAction.STATUS_CHANGE,
                booking,
                savedBooking,
                "Booking cancelled. Reason: " + reason
        );
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            ledgerService.recordRefund(booking);
        }

        notificationService.notifyBookingCancelled(savedBooking, reason, false);
    }

    @Override
    @Transactional
    public Booking createBooking(Long customerId, Long courtId, LocalDate bookingDate, List<LocalTime> startTimes) {
        ResolvedBookingSelection selection = resolveBookingSelection(courtId, bookingDate, startTimes);
        Double totalAmount = calculateTotalPrice(selection.slots());

        Booking booking = buildBookingSkeleton(
                customerId,
                selection.court(),
                selection.slots(),
                OrderStatus.PENDING_PAYMENT,
                PaymentStatus.PENDING,
                totalAmount
        );
        booking.setCreatedBy(String.valueOf(customerId));
        booking.setExpiresAt(LocalDateTime.now().plusMinutes(HOLD_TIMEOUT_MINUTES));
        booking.setVersion(0L);

        long holdExpiredAt = System.currentTimeMillis() + HOLD_TIMEOUT_MINUTES * 60 * 1000;
        for (CourtSlot slot : selection.slots()) {
            slot.setStatus(SlotStatus.LOCKED);
            slot.setHoldExpiredAt(holdExpiredAt);
            courtSlotRepository.save(slot);
        }

        log.info(
                "Created pending booking: customerId={}, courtId={}, bookingDate={}, startTime={}, endTime={}, slots={}",
                customerId,
                courtId,
                bookingDate,
                booking.getStartTime(),
                booking.getEndTime(),
                selection.slots().stream()
                        .map(slot -> "%s-%s(id=%s)".formatted(slot.getStartTime(), slot.getEndTime(), slot.getId()))
                        .toList()
        );

        Booking savedBooking = bookingRepository.save(booking);
        auditService.logChange(
                EntityType.BOOKING,
                savedBooking.getId(),
                AuditAction.CREATE,
                null,
                savedBooking,
                "Booking created"
        );
        notificationService.notifyBookingCreated(savedBooking);
        return savedBooking;
    }

    @Override
    @Transactional
    public Booking createOwnerBooking(User owner, Long courtId, LocalDate bookingDate, List<LocalTime> startTimes) {
        if (owner == null || owner.getId() == null) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Owner account is required");
        }

        ResolvedBookingSelection selection = resolveBookingSelection(courtId, bookingDate, startTimes);
        Court court = selection.court();

        Long courtOwnerId = court.getField() != null
                && court.getField().getOwner() != null
                && court.getField().getOwner().getUser() != null
                ? court.getField().getOwner().getUser().getId()
                : null;

        if (courtOwnerId == null || !courtOwnerId.equals(owner.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Owners can only book their own courts");
        }

        for (CourtSlot slot : selection.slots()) {
            slot.setStatus(SlotStatus.BOOKED);
            slot.setHoldExpiredAt(null);
        }
        courtSlotRepository.saveAll(selection.slots());

        Booking booking = buildBookingSkeleton(
                owner.getId(),
                court,
                selection.slots(),
                OrderStatus.CONFIRMED,
                PaymentStatus.PAID,
                0d
        );
        booking.setCustomer(owner);
        booking.setCustomerId(owner.getId());
        booking.setPlatformCommission(0d);
        booking.setMerchantRevenue(0d);
        booking.setPaymentReference("OWNER_SELF_BOOK");
        booking.setCreatedBy(String.valueOf(owner.getId()));
        booking.setExpiresAt(null);
        booking.setVersion(0L);

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingCreated(savedBooking);
        return savedBooking;
    }

    @Override
    public Booking getBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        assertCanAccessBooking(booking);
        return booking;
    }

    @Override
    @Transactional
    public Booking updateBookingStatus(Long id, String newStatus) {

        Booking booking = getBooking(id);
        OrderStatus previousStatus = booking.getBookingStatus();

        OrderStatus targetStatus = OrderStatus.valueOf(newStatus);

        assertCanManageBookingStatus(booking);

        booking.setBookingStatus(targetStatus);

        if (targetStatus == OrderStatus.CANCELLED || targetStatus == OrderStatus.EXPIRED) {
            releaseReservedSlots(booking);

            if (booking.getPaymentStatus() != PaymentStatus.PAID) {
                booking.setPaymentStatus(
                        targetStatus == OrderStatus.EXPIRED
                                ? PaymentStatus.EXPIRED
                                : PaymentStatus.CANCELLED
                );
            }

            booking.setExpiresAt(null);
        }

        booking.setUpdatedAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        // 🔥 AUDIT FIX
        auditService.logChange(
                EntityType.BOOKING,
                savedBooking.getId(),
                AuditAction.STATUS_CHANGE,
                previousStatus,          // OLD
                targetStatus,            // NEW
                "Update booking status: " + previousStatus + " -> " + targetStatus
        );

        notificationService.notifyBookingStatusChanged(
                savedBooking,
                previousStatus,
                savedBooking.getBookingStatus()
        );

        return savedBooking;
    }

    @Override
    public void cancelBooking(Long id) {
        Booking booking = getBooking(id);
        User currentUser = currentUserService.getCurrentUser();
        releaseReservedSlots(booking);
        booking.setBookingStatus(OrderStatus.CANCELLED);
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.CANCELLED);
        }
        booking.setExpiresAt(null);
        booking.setUpdatedAt(LocalDateTime.now());
        Booking savedBooking = bookingRepository.save(booking);

        boolean cancelledByCustomer = !hasRole(currentUser, Role.ADMIN)
                && !isOwnerOfBooking(savedBooking, currentUser.getId());
        notificationService.notifyBookingCancelled(savedBooking, "Cancelled by user", cancelledByCustomer);
    }

    @Override
    public Double calculateTotalPrice(List<CourtSlot> slots) {
        return slots.stream()
                .mapToDouble(slot -> slot.getPrice().doubleValue())
                .sum();
    }

    @Override
    public boolean checkSlotAvailability(Long courtId, LocalDate date, List<LocalTime> startTimes) {
        for (LocalTime start : startTimes) {
            if (courtSlotRepository.existsByCourtIdAndSlotDateAndStartTimeAndStatusNot(
                    courtId,
                    date,
                    start,
                    "AVAILABLE"
            )) {
                return false;
            }
        }
        return true;
    }

    private void validateResolvedSlots(LocalDate bookingDate, List<CourtSlot> slots) {
        if (slots.isEmpty()) {
            throw new RuntimeException("No slots are available for booking");
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime previousEnd = null;

        for (CourtSlot slot : slots) {
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new RuntimeException("Some slots are not available");
            }
            if (bookingDate.isBefore(today)) {
                throw new RuntimeException("Cannot book a past date");
            }
            if (bookingDate.isEqual(today) && !slot.getStartTime().isAfter(now)) {
                throw new RuntimeException("Cannot book a slot that already started");
            }
            if (previousEnd != null && !previousEnd.equals(slot.getStartTime())) {
                throw new RuntimeException("Selected slots must form one continuous booking range");
            }
            previousEnd = slot.getEndTime();
        }
    }

    private ResolvedBookingSelection resolveBookingSelection(Long courtId, LocalDate bookingDate, List<LocalTime> startTimes) {
        if (startTimes == null || startTimes.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "No start times selected");
        }

        if (bookingDate == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "bookingDate is required");
        }

        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Court not found"));

        if (!CourtStatus.ACTIVE.name().equalsIgnoreCase(court.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Court is currently locked");
        }

        List<LocalTime> normalizedStartTimes = new ArrayList<>(new LinkedHashSet<>(startTimes));
        List<CourtSlot> availableSlotsForCourt = courtSlotRepository.findByCourtIdAndSlotDate(courtId, bookingDate);
        Map<LocalTime, CourtSlot> slotsByStartTime = availableSlotsForCourt.stream()
                .collect(Collectors.toMap(
                        CourtSlot::getStartTime,
                        Function.identity(),
                        (left, right) -> left
                ));

        List<CourtSlot> slots = new ArrayList<>();
        for (LocalTime start : normalizedStartTimes) {
            CourtSlot slot = slotsByStartTime.get(start);
            if (slot == null) {
                throw new BusinessException(HttpStatus.NOT_FOUND, "Slot not found for time: " + start);
            }
            slots.add(slot);
        }
        slots.sort(Comparator.comparing(CourtSlot::getStartTime));
        validateResolvedSlots(bookingDate, slots);

        return new ResolvedBookingSelection(court, slots);
    }

    private Booking buildBookingSkeleton(
            Long customerId,
            Court court,
            List<CourtSlot> slots,
            OrderStatus bookingStatus,
            PaymentStatus paymentStatus,
            Double totalAmount
    ) {
        Booking booking = new Booking();
        booking.setCustomerId(customerId);
        booking.setCourt(court);
        booking.setBookingDate(slots.getFirst().getSlotDate());
        booking.setStartTime(slots.getFirst().getStartTime());
        booking.setEndTime(slots.getLast().getEndTime());
        booking.setBookingStatus(bookingStatus);
        booking.setPaymentStatus(paymentStatus);
        booking.setTotalAmount(totalAmount);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        if (court.getField() != null) {
            booking.setOwnerProfile(court.getField().getOwner());
            booking.setMerchantId(court.getField().getOwner() != null ? court.getField().getOwner().getId() : null);
        }
        if (totalAmount != null && totalAmount > 0) {
            double commissionRate = financeManagementService.getPlatformCommissionRate().doubleValue();
            double platformCommission = totalAmount * commissionRate;
            booking.setPlatformCommission(platformCommission);
            booking.setMerchantRevenue(totalAmount - platformCommission);
        } else {
            booking.setPlatformCommission(0d);
            booking.setMerchantRevenue(0d);
        }
        return booking;
    }

    private record ResolvedBookingSelection(Court court, List<CourtSlot> slots) {
    }

    private void releaseReservedSlots(Booking booking) {
        if (booking.getCourt() == null
                || booking.getCourt().getId() == null
                || booking.getBookingDate() == null
                || booking.getStartTime() == null
                || booking.getEndTime() == null
                || !booking.getStartTime().isBefore(booking.getEndTime())) {
            return;
        }

        List<CourtSlot> bookingSlots = courtSlotRepository.findByCourtIdAndSlotDateAndTimeRange(
                booking.getCourt().getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );

        for (CourtSlot slot : bookingSlots) {
            if (slot.canBeReleased()) {
                slot.release();
            }
            slot.setHoldExpiredAt(null);
        }

        if (!bookingSlots.isEmpty()) {
            courtSlotRepository.saveAll(bookingSlots);
        }
    }

    private void assertCanAccessBooking(Booking booking) {
        User currentUser = currentUserService.getCurrentUser();
        if (hasRole(currentUser, Role.ADMIN)) {
            return;
        }
        if (booking.getCustomerId() != null && booking.getCustomerId().equals(currentUser.getId())) {
            return;
        }
        if (isOwnerOfBooking(booking, currentUser.getId())) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot access this booking");
    }

    private void assertCanManageBookingStatus(Booking booking) {
        User currentUser = currentUserService.getCurrentUser();
        if (hasRole(currentUser, Role.ADMIN) || isOwnerOfBooking(booking, currentUser.getId())) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot update this booking status");
    }

    private boolean isOwnerOfBooking(Booking booking, Long userId) {
        if (userId == null || booking.getMerchantId() == null) {
            return false;
        }
        return ownerProfileRepository.findByUserId(userId)
                .map(owner -> booking.getMerchantId().equals(owner.getId()))
                .orElse(false);
    }

    private boolean hasRole(User user, Role role) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(userRole -> userRole.getRole() == role);
    }
}
