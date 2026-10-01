package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.entity.Transaction;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentMethod;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.core.enums.TransactionType;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.core.repository.TransactionRepository;
import com.example.backend.core.service.ticket.TicketService;
import com.example.backend.infrastructure.external.VnpayGateway;
import com.example.backend.infrastructure.external.VnpayGateway.VnpayCallbackResult;
import com.example.backend.infrastructure.external.VnpayGateway.VnpayPaymentRequest;
import com.example.backend.presentation.dto.request.CreatePaymentSessionRequest;
import com.example.backend.presentation.dto.response.PaymentResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentApplicationService {

    private final BookingRepository bookingRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerService ledgerService;
    private final VnpayGateway vnpayGateway;
    private final CourtSlotRepository courtSlotRepository;
    private final CourtRepository courtRepository;
    private final CurrentUserService currentUserService;
    private final OwnerProfileRepository ownerProfileRepository;
    private final PaymentFailureCleanupService paymentFailureCleanupService;
    private final TicketService ticketService;
    private final FinanceManagementService financeManagementService;
    private final NotificationService notificationService;

    @Value("${payment.hold-timeout-minutes:10}")
    private int holdTimeoutMinutes;

    @Transactional
    public PaymentResponse createPaymentSession(CreatePaymentSessionRequest request, String clientIp) {
        PaymentMethod paymentMethod = resolvePaymentMethod(request.getPaymentMethod());
        if (paymentMethod != PaymentMethod.VNPAY) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Only VNPay is supported right now");
        }

        User currentUser = currentUserService.getCurrentUser();
        List<Long> slotIds = normalizeSlotIds(request.getSlotIds());
        List<CourtSlot> slots = courtSlotRepository.findAllByIdForUpdate(slotIds);
        validateRequestedSlots(slotIds, slots);
        validateSlotsForPendingPayment(slots);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(holdTimeoutMinutes);
        long holdExpiredAt = toEpochMillis(expiresAt);
        slots.forEach(slot -> {
            slot.lock();
            slot.setHoldExpiredAt(holdExpiredAt);
        });
        courtSlotRepository.saveAll(slots);

        Court court = courtRepository.findById(slots.getFirst().getCourtId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Court not found"));
        ensureCourtBookable(court, currentUser);

        Booking booking = buildPendingBooking(currentUser, court, slots, expiresAt);
        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyBookingCreated(savedBooking);

        Transaction savedTransaction = createPendingTransaction(savedBooking, currentUser, court, slots, paymentMethod, clientIp);
        return toPaymentResponse(savedTransaction, savedBooking, savedTransaction.getPaymentUrl());
    }

    @Transactional
    public PaymentResponse createVnpayPayment(Long bookingId, String clientIp) {
        User currentUser = currentUserService.getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Booking not found"));

        assertCanAccessBooking(booking, currentUser);

        log.info(
                "VNPay create requested: bookingId={}, userId={}, courtId={}, bookingDate={}, startTime={}, endTime={}, status={}, paymentStatus={}",
                booking.getId(),
                booking.getCustomerId(),
                booking.getCourt() != null ? booking.getCourt().getId() : null,
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getBookingStatus(),
                booking.getPaymentStatus()
        );

        validateBookingDataForPayment(booking);

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessException(HttpStatus.CONFLICT, "Booking already paid");
        }
        if (booking.getBookingStatus() == OrderStatus.CANCELLED || booking.getBookingStatus() == OrderStatus.EXPIRED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Booking is no longer payable");
        }

        try {
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(holdTimeoutMinutes);
            List<CourtSlot> bookingSlots = loadBookingSlotsForUpdate(booking);
            if (bookingSlots.isEmpty()) {
                throw new BusinessException(HttpStatus.CONFLICT, "Selected booking has no payable slots");
            }

            log.info(
                    "Booking slot lookup result: bookingId={}, loadedSlots={}, queryCourtId={}, queryDate={}, queryStart={}, queryEnd={}",
                    booking.getId(),
                    bookingSlots.size(),
                    booking.getCourt().getId(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );

            for (CourtSlot slot : bookingSlots) {
                if (slot.getStatus() == SlotStatus.AVAILABLE) {
                    slot.lock();
                } else if (slot.getStatus() != SlotStatus.LOCKED) {
                    throw new BusinessException(HttpStatus.CONFLICT, "Booking contains slots that cannot enter payment");
                }
                slot.setHoldExpiredAt(toEpochMillis(expiresAt));
            }
            courtSlotRepository.saveAll(bookingSlots);

            booking.setBookingStatus(OrderStatus.PENDING_PAYMENT);
            booking.setPaymentStatus(PaymentStatus.PENDING);
            booking.setExpiresAt(expiresAt);
            Booking savedBooking = bookingRepository.save(booking);

            Transaction latestTransaction = transactionRepository.findLatestByBookingId(savedBooking.getId()).orElse(null);
            if (latestTransaction != null && latestTransaction.getStatus() == TransactionStatus.PENDING) {
                latestTransaction.setStatus(TransactionStatus.EXPIRED);
                latestTransaction.setResponseMessage("VNPay session replaced by a new payment attempt");
                latestTransaction.setFailReason("VNPay session replaced by a new payment attempt");
                transactionRepository.save(latestTransaction);
            }

            Court court = savedBooking.getCourt() != null && savedBooking.getCourt().getId() != null
                    ? courtRepository.findById(savedBooking.getCourt().getId()).orElseThrow(() ->
                            new BusinessException(HttpStatus.NOT_FOUND, "Court not found"))
                    : courtRepository.findById(bookingSlots.getFirst().getCourtId()).orElseThrow(() ->
                            new BusinessException(HttpStatus.NOT_FOUND, "Court not found"));
            ensureCourtBookable(court, currentUser);

            Transaction transaction = createPendingTransaction(savedBooking, currentUser, court, bookingSlots, PaymentMethod.VNPAY, clientIp);
            return toPaymentResponse(transaction, savedBooking, transaction.getPaymentUrl());
        } catch (BusinessException ex) {
            cleanupBookingAfterPaymentCreateFailure(booking, ex.getMessage());
            throw ex;
        } catch (PessimisticLockingFailureException ex) {
            cleanupBookingAfterPaymentCreateFailure(booking, "Selected slot is being processed, please try again");
            throw new BusinessException(HttpStatus.CONFLICT, "Selected slot is being processed, please try again");
        } catch (RuntimeException ex) {
            cleanupBookingAfterPaymentCreateFailure(booking, "Unable to create VNPay payment session");
            throw ex;
        }
    }

    @Transactional
    public PaymentResponse handlePaymentCallback(Map<String, String> params) {
        VnpayCallbackResult callback = vnpayGateway.parseCallback(params);
        if (!callback.validSignature()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid VNPay signature");
        }

        Transaction transaction = transactionRepository.findByTransactionCode(callback.transactionCode())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Transaction not found"));

        Booking booking = transaction.getBooking() == null
                ? null
                : bookingRepository.findById(transaction.getBooking().getId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            return toPaymentResponse(transaction, booking, callback.redirectUrl());
        }

        transaction.setBankCode(callback.bankCode());
        transaction.setGatewayTransactionId(callback.gatewayTransactionId());
        transaction.setGatewayReference(callback.gatewayReference());
        transaction.setResponseCode(callback.responseCode());
        transaction.setResponseMessage(callback.responseMessage());

        if (booking != null
                && (booking.getBookingStatus() == OrderStatus.EXPIRED || booking.getPaymentStatus() == PaymentStatus.EXPIRED)) {
            transaction.setStatus(TransactionStatus.EXPIRED);
            transaction.setFailReason("Payment callback received after booking expired");
            Transaction savedTransaction = transactionRepository.save(transaction);
            return toPaymentResponse(savedTransaction, booking, callback.redirectUrl());
        }

        List<CourtSlot> bookingSlots = booking == null ? List.of() : loadBookingSlotsForUpdate(booking);

        if (callback.success()) {
            for (CourtSlot slot : bookingSlots) {
                if (slot.getStatus() == SlotStatus.LOCKED) {
                    slot.confirmBooking();
                } else if (slot.getStatus() != SlotStatus.BOOKED) {
                    throw new BusinessException(HttpStatus.CONFLICT, "Slot is no longer in a payable state");
                }
                slot.setHoldExpiredAt(null);
            }
            if (!bookingSlots.isEmpty()) {
                courtSlotRepository.saveAll(bookingSlots);
            }

            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setFailReason(null);
            transaction.setPaidAt(LocalDateTime.now());

            if (booking != null) {
                booking.setPaymentStatus(PaymentStatus.PAID);
                booking.setBookingStatus(OrderStatus.CONFIRMED);
                booking.setPaymentReference(callback.gatewayTransactionId() != null
                        ? callback.gatewayTransactionId()
                        : callback.transactionCode());
                booking.setExpiresAt(null);
                booking = bookingRepository.save(booking);
                ledgerService.recordBookingPayment(booking);
                ticketService.issueTicketForSuccessfulPayment(booking, transaction);
                notificationService.notifyPaymentSuccess(booking);
            }
        } else {
            TransactionStatus failedStatus = "24".equals(callback.responseCode())
                    ? TransactionStatus.CANCELLED
                    : TransactionStatus.FAILED;
            PaymentStatus bookingPaymentStatus = failedStatus == TransactionStatus.CANCELLED
                    ? PaymentStatus.CANCELLED
                    : PaymentStatus.FAILED;

            transaction.setStatus(failedStatus);
            transaction.setFailReason(callback.responseMessage());

            for (CourtSlot slot : bookingSlots) {
                if (slot.getStatus() == SlotStatus.LOCKED) {
                    slot.release();
                }
                slot.setHoldExpiredAt(null);
            }
            if (!bookingSlots.isEmpty()) {
                courtSlotRepository.saveAll(bookingSlots);
            }

            if (booking != null) {
                booking.setPaymentStatus(bookingPaymentStatus);
                booking.setBookingStatus(OrderStatus.CANCELLED);
                booking.setExpiresAt(null);
                booking = bookingRepository.save(booking);
                notificationService.notifyPaymentFailure(booking, callback.responseMessage());
            }
        }

        Transaction savedTransaction = transactionRepository.save(transaction);
        return toPaymentResponse(savedTransaction, booking, callback.redirectUrl());
    }

    @Transactional
    public void cancelPendingPayment(Long bookingId) {
        User currentUser = currentUserService.getCurrentUser();
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Booking not found"));

        assertCanAccessBooking(booking, currentUser);

        if (booking.getPaymentStatus() == PaymentStatus.PAID
                || booking.getBookingStatus() == OrderStatus.CONFIRMED
                || booking.getBookingStatus() == OrderStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Booking is already paid");
        }

        List<CourtSlot> bookingSlots = loadBookingSlotsForUpdate(booking);
        for (CourtSlot slot : bookingSlots) {
            if (slot.canBeReleased()) {
                slot.release();
            }
            slot.setHoldExpiredAt(null);
        }
        if (!bookingSlots.isEmpty()) {
            courtSlotRepository.saveAll(bookingSlots);
        }

        booking.setBookingStatus(OrderStatus.CANCELLED);
        booking.setPaymentStatus(PaymentStatus.CANCELLED);
        booking.setExpiresAt(null);
        bookingRepository.save(booking);

        for (Transaction transaction : transactionRepository.findByBookingId(bookingId)) {
            if (transaction.getStatus() == TransactionStatus.PENDING) {
                transaction.setStatus(TransactionStatus.CANCELLED);
                transaction.setResponseMessage("Payment cancelled by user");
                transaction.setFailReason("Payment cancelled by user");
                transactionRepository.save(transaction);
            }
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentStatus(Long transactionId) {
        User currentUser = currentUserService.getCurrentUser();
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Transaction not found"));

        assertCanAccessTransaction(transaction, currentUser);

        Booking booking = transaction.getBooking() == null
                ? null
                : bookingRepository.findById(transaction.getBooking().getId()).orElse(null);
        return toPaymentResponse(transaction, booking, transaction.getPaymentUrl());
    }

    @Transactional
    public int expirePendingPayments() {
        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(LocalDateTime.now());
        int affected = 0;

        for (Booking booking : expiredBookings) {
            if (booking.getBookingStatus() != OrderStatus.PENDING_PAYMENT) {
                continue;
            }

            List<CourtSlot> bookingSlots = loadBookingSlotsForUpdate(booking);
            for (CourtSlot slot : bookingSlots) {
                if (slot.getStatus() == SlotStatus.LOCKED) {
                    slot.release();
                }
                slot.setHoldExpiredAt(null);
            }
            if (!bookingSlots.isEmpty()) {
                courtSlotRepository.saveAll(bookingSlots);
            }

            booking.setBookingStatus(OrderStatus.EXPIRED);
            booking.setPaymentStatus(PaymentStatus.EXPIRED);
            booking.setExpiresAt(null);
            booking = bookingRepository.save(booking);

            for (Transaction transaction : transactionRepository.findByBookingId(booking.getId())) {
                if (transaction.getStatus() == TransactionStatus.PENDING) {
                    transaction.setStatus(TransactionStatus.EXPIRED);
                    transaction.setResponseMessage("Payment session expired");
                    transaction.setFailReason("Payment session expired");
                    transactionRepository.save(transaction);
                }
            }

            notificationService.notifyPaymentExpired(booking);
            affected++;
        }

        return affected;
    }

    private PaymentMethod resolvePaymentMethod(String rawMethod) {
        try {
            return PaymentMethod.valueOf(rawMethod.trim().toUpperCase());
        } catch (Exception e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported payment method: " + rawMethod);
        }
    }

    private List<Long> normalizeSlotIds(List<Long> slotIds) {
        if (slotIds == null || slotIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "slotIds must not be empty");
        }
        return new ArrayList<>(new LinkedHashSet<>(slotIds));
    }

    private void validateRequestedSlots(List<Long> requestedIds, List<CourtSlot> slots) {
        if (slots.size() != requestedIds.size()) {
            throw new BusinessException(HttpStatus.CONFLICT, "One or more slots are no longer available");
        }
    }

    private void validateSlotsForPendingPayment(List<CourtSlot> slots) {
        List<CourtSlot> sortedSlots = slots.stream()
                .sorted(Comparator.comparing(CourtSlot::getSlotDate).thenComparing(CourtSlot::getStartTime))
                .toList();

        CourtSlot first = sortedSlots.getFirst();
        Long courtId = first.getCourtId();
        LocalDate slotDate = first.getSlotDate();
        LocalTime previousEnd = null;

        for (CourtSlot slot : sortedSlots) {
            if (!slot.canBeLocked()) {
                throw new BusinessException(HttpStatus.CONFLICT, "Selected slot is not available");
            }
            if (!courtId.equals(slot.getCourtId()) || !slotDate.equals(slot.getSlotDate())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "All selected slots must belong to the same court and date");
            }
            if (slot.getSlotDate().isBefore(LocalDate.now())
                    || (slot.getSlotDate().isEqual(LocalDate.now()) && !slot.getStartTime().isAfter(LocalTime.now()))) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot pay for a slot in the past");
            }
            if (previousEnd != null && !previousEnd.equals(slot.getStartTime())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Selected slots must form one continuous booking range");
            }
            previousEnd = slot.getEndTime();
        }
    }

    private void ensureCourtBookable(Court court, User currentUser) {
        if (court == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Court not found");
        }
        if (!CourtStatus.ACTIVE.name().equalsIgnoreCase(court.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Court is currently locked");
        }
        if (hasRole(currentUser, Role.OWNER)) {
            Long ownerUserId = court.getField() != null
                    && court.getField().getOwner() != null
                    && court.getField().getOwner().getUser() != null
                    ? court.getField().getOwner().getUser().getId()
                    : null;
            if (ownerUserId == null || !ownerUserId.equals(currentUser.getId())) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "Owners can only book their own courts");
            }
        }
    }

    private Booking buildPendingBooking(User user, Court court, List<CourtSlot> slots, LocalDateTime expiresAt) {
        List<CourtSlot> sortedSlots = slots.stream()
                .sorted(Comparator.comparing(CourtSlot::getStartTime))
                .toList();
        BigDecimal totalAmount = sortedSlots.stream()
                .map(CourtSlot::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = new Booking();
        booking.setCustomer(user);
        booking.setCustomerId(user.getId());
        booking.setCourt(court);
        booking.setBookingDate(sortedSlots.getFirst().getSlotDate());
        booking.setStartTime(sortedSlots.getFirst().getStartTime());
        booking.setEndTime(sortedSlots.getLast().getEndTime());
        booking.setBookingStatus(OrderStatus.PENDING_PAYMENT);
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setTotalAmount(totalAmount.doubleValue());
        BigDecimal commissionRate = financeManagementService.getPlatformCommissionRate();
        BigDecimal commissionAmount = totalAmount.multiply(commissionRate);
        booking.setPlatformCommission(commissionAmount.doubleValue());
        booking.setMerchantRevenue(totalAmount.subtract(commissionAmount).doubleValue());
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setExpiresAt(expiresAt);
        booking.setOwnerProfile(court.getField() != null ? court.getField().getOwner() : null);
        booking.setMerchantId(booking.getOwnerProfile() != null ? booking.getOwnerProfile().getId() : null);
        return booking;
    }

    private Transaction createPendingTransaction(
            Booking booking,
            User user,
            Court court,
            List<CourtSlot> slots,
            PaymentMethod paymentMethod,
            String clientIp
    ) {
        String transactionCode = "BOOKING-" + booking.getId() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Transaction transaction = new Transaction();
        transaction.setBooking(booking);
        transaction.setUserId(user.getId());
        transaction.setOwnerProfileId(booking.getOwnerProfile() != null ? booking.getOwnerProfile().getId() : null);
        transaction.setFieldId(court.getField() != null ? court.getField().getId() : null);
        transaction.setCourtId(court.getId());
        transaction.setSlotDate(booking.getBookingDate());
        transaction.setStartTime(booking.getStartTime());
        transaction.setEndTime(booking.getEndTime());
        transaction.setTransactionCode(transactionCode);
        transaction.setGatewayOrderCode(transactionCode);
        transaction.setTransactionType(TransactionType.BOOKING);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setAmount(BigDecimal.valueOf(booking.getTotalAmount()));
        transaction.setDescription("VNPay payment for booking #" + booking.getId());

        String paymentUrl = vnpayGateway.createPaymentUrl(
                new VnpayPaymentRequest(
                        transactionCode,
                        BigDecimal.valueOf(booking.getTotalAmount()).longValue(),
                        clientIp,
                        "Thanh toan dat san #" + booking.getId()
                )
        );

        transaction.setPaymentUrl(paymentUrl);
        transaction.setResponseMessage("Awaiting payment");
        return transactionRepository.save(transaction);
    }

    private List<CourtSlot> loadBookingSlotsForUpdate(Booking booking) {
        if (booking.getCourt() == null || booking.getCourt().getId() == null) {
            return List.of();
        }
        return courtSlotRepository.findByCourtIdAndSlotDateAndTimeRangeForUpdate(
                booking.getCourt().getId(),
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime()
        );
    }

    private void validateBookingDataForPayment(Booking booking) {
        if (booking.getCourt() == null || booking.getCourt().getId() == null
                || booking.getBookingDate() == null
                || booking.getStartTime() == null
                || booking.getEndTime() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking data is incomplete for payment");
        }
        if (booking.getStartTime().isAfter(booking.getEndTime()) || booking.getStartTime().equals(booking.getEndTime())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking time range is invalid for payment");
        }
    }

    private void cleanupBookingAfterPaymentCreateFailure(Booking booking, String reason) {
        if (booking == null || booking.getId() == null) {
            return;
        }

        if (booking.getPaymentStatus() == PaymentStatus.PAID
                || booking.getBookingStatus() == OrderStatus.CONFIRMED
                || booking.getBookingStatus() == OrderStatus.COMPLETED) {
            return;
        }

        paymentFailureCleanupService.cleanupFailedPaymentCreation(booking.getId(), reason);
    }

    private PaymentResponse toPaymentResponse(Transaction transaction, Booking booking, String redirectUrl) {
        PaymentResponse response = new PaymentResponse();
        response.setId(transaction.getId());
        response.setBookingId(booking != null ? booking.getId() : null);
        response.setUserId(transaction.getUserId());
        response.setCourtId(transaction.getCourtId());
        response.setFieldId(transaction.getFieldId());
        response.setAmount(transaction.getAmount() != null ? transaction.getAmount().doubleValue() : null);
        response.setStatus(transaction.getStatus().name());
        response.setPaymentStatus(booking != null && booking.getPaymentStatus() != null ? booking.getPaymentStatus().name() : null);
        response.setBookingStatus(booking != null && booking.getBookingStatus() != null ? booking.getBookingStatus().name() : null);
        response.setPaymentMethod(transaction.getPaymentMethod() != null ? transaction.getPaymentMethod().name() : null);
        response.setTransactionId(transaction.getGatewayTransactionId() != null
                ? transaction.getGatewayTransactionId()
                : transaction.getTransactionCode());
        response.setOrderCode(transaction.getGatewayOrderCode() != null
                ? transaction.getGatewayOrderCode()
                : transaction.getTransactionCode());
        response.setPaymentUrl(transaction.getPaymentUrl());
        response.setRedirectUrl(redirectUrl);
        response.setResponseCode(transaction.getResponseCode());
        response.setResponseMessage(transaction.getResponseMessage());
        response.setFailReason(transaction.getFailReason());
        response.setExpiresAt(booking != null ? booking.getExpiresAt() : null);
        response.setPaid(booking != null && booking.getPaymentStatus() == PaymentStatus.PAID);
        return response;
    }

    private long toEpochMillis(LocalDateTime time) {
        return time.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private void assertCanAccessBooking(Booking booking, User currentUser) {
        if (hasRole(currentUser, Role.ADMIN)) {
            return;
        }
        if (booking.getCustomerId() == null || !booking.getCustomerId().equals(currentUser.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot access this booking payment");
        }
    }

    private void assertCanAccessTransaction(Transaction transaction, User currentUser) {
        if (hasRole(currentUser, Role.ADMIN)) {
            return;
        }
        if (hasRole(currentUser, Role.OWNER)) {
            Long ownerProfileId = ownerProfileRepository.findByUserId(currentUser.getId())
                    .map(owner -> owner.getId())
                    .orElse(null);
            if (ownerProfileId != null && ownerProfileId.equals(transaction.getOwnerProfileId())) {
                return;
            }
        }
        if (transaction.getUserId() == null || !transaction.getUserId().equals(currentUser.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You cannot access this transaction");
        }
    }

    private boolean hasRole(User user, Role role) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(userRole -> userRole.getRole() == role);
    }
}
