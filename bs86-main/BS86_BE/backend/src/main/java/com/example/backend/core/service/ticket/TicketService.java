package com.example.backend.core.service.ticket;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.Transaction;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PassConversationStatus;
import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.Role;
import com.example.backend.core.enums.TicketStatus;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PassTicketPostEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TicketEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.UserEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.BookingJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PassConversationJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PassTicketPostJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.TicketJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.response.ticket.TicketDetailResponse;
import com.example.backend.presentation.dto.response.ticket.TicketOwnerResponse;
import com.example.backend.presentation.dto.response.ticket.TicketSummaryResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final String DEFAULT_DISPLAY_NOTE =
            "Show this QR at check-in. The latest QR token is the only valid one after any transfer.";
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TicketJpaRepository ticketJpaRepository;
    private final BookingJpaRepository bookingJpaRepository;
    private final TransactionJpaRepository transactionJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final PassTicketPostJpaRepository passTicketPostJpaRepository;
    private final PassConversationJpaRepository passConversationJpaRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public void issueTicketForSuccessfulPayment(Booking booking, Transaction transaction) {
        if (booking == null || booking.getId() == null || transaction == null || transaction.getId() == null) {
            return;
        }

        if (booking.getBookingStatus() != OrderStatus.CONFIRMED || booking.getPaymentStatus() != PaymentStatus.PAID) {
            return;
        }

        if (ticketJpaRepository.findByBooking_Id(booking.getId()).isPresent()) {
            return;
        }

        TicketEntity ticket = new TicketEntity();
        ticket.setBooking(bookingJpaRepository.getReferenceById(booking.getId()));
        ticket.setTransaction(transactionJpaRepository.getReferenceById(transaction.getId()));
        ticket.setCurrentHolder(userJpaRepository.getReferenceById(booking.getCustomerId()));
        ticket.setTicketCode(generateUniqueTicketCode());
        ticket.setQrToken(generateUniqueQrToken());
        ticket.setStatus(TicketStatus.ISSUED);
        ticket.setValidFrom(LocalDateTime.of(booking.getBookingDate(), booking.getStartTime()));
        ticket.setValidUntil(LocalDateTime.of(booking.getBookingDate(), booking.getEndTime()));
        ticket.setIssuedAt(now());
        ticket.setDisplayNote(DEFAULT_DISPLAY_NOTE);
        ticketJpaRepository.save(ticket);
    }

    @Transactional
    public List<TicketSummaryResponse> getMyTickets() {
        User currentUser = currentUserService.getCurrentUser();
        List<TicketEntity> tickets = ticketJpaRepository.findAllOwnedByUser(currentUser.getId());
        tickets.forEach(this::refreshTicketState);
        return tickets.stream().map(this::toSummaryResponse).toList();
    }

    @Transactional
    public TicketDetailResponse getTicketDetail(Long ticketId) {
        User currentUser = currentUserService.getCurrentUser();
        TicketEntity ticket = ticketJpaRepository.findWithDetailsById(ticketId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Ticket not found"));

        refreshTicketState(ticket);
        assertCanViewTicket(ticket, currentUser);
        return toDetailResponse(ticket);
    }

    @Transactional
    public TicketDetailResponse checkInByQrToken(String qrToken) {
        TicketEntity ticket = ticketJpaRepository.findByQrTokenForUpdate(qrToken)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Ticket not found"));

        refreshTicketState(ticket);

        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket has expired");
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket is no longer valid");
        }
        if (ticket.getStatus() != TicketStatus.ISSUED && ticket.getStatus() != TicketStatus.CHECKED_IN) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket is not eligible for check-in");
        }

        LocalDateTime currentTime = now();
        if (currentTime.isBefore(ticket.getValidFrom())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Ticket is not valid yet");
        }
        if (currentTime.isAfter(ticket.getValidUntil())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket has expired");
        }

        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setCheckedInAt(currentTime);
        closeRelatedPassFlows(ticket, PassPostStatus.CLOSED);
        return toDetailResponse(ticket);
    }

    @Transactional
    public int expireIssuedTickets() {
        List<TicketEntity> expirableTickets = ticketJpaRepository.findByStatusAndValidUntilBefore(
                TicketStatus.ISSUED,
                now()
        );
        List<TicketEntity> expirableCheckedInTickets = ticketJpaRepository.findByStatusAndValidUntilBefore(
                TicketStatus.CHECKED_IN,
                now()
        );

        int affected = 0;
        for (TicketEntity ticket : expirableTickets) {
            ticket.setStatus(TicketStatus.EXPIRED);
            closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
            affected++;
        }
        for (TicketEntity ticket : expirableCheckedInTickets) {
            ticket.setStatus(TicketStatus.EXPIRED);
            closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
            affected++;
        }
        return affected;
    }

    @Transactional
    public TicketEntity getTransferableTicketForUpdate(Long ticketId, Long ownerUserId) {
        TicketEntity ticket = ticketJpaRepository.findByIdForUpdate(ticketId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Ticket not found"));

        refreshTicketState(ticket);

        if (!ticket.getCurrentHolder().getId().equals(ownerUserId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only the current ticket holder can perform this action");
        }
        if (!isTransferable(ticket)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket is not transferable");
        }
        return ticket;
    }

    @Transactional
    public void transferTicket(TicketEntity ticket, UserEntity newHolder) {
        refreshTicketState(ticket);
        if (!isTransferable(ticket)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket is not transferable");
        }

        ticket.setCurrentHolder(newHolder);
        ticket.setQrToken(generateUniqueQrToken());
        ticket.setTransferredAt(LocalDateTime.now());
    }

    @Transactional
    public TicketEntity refreshTicketState(TicketEntity ticket) {
        if (ticket == null) {
            return null;
        }

        if (ticket.getStatus() == TicketStatus.CHECKED_IN) {
            if (now().isAfter(ticket.getValidUntil())) {
                ticket.setStatus(TicketStatus.EXPIRED);
                closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
            }
            return ticket;
        }

        boolean bookingInvalid = ticket.getBooking() == null
                || ticket.getBooking().getBookingStatus() != OrderStatus.CONFIRMED
                || ticket.getBooking().getPaymentStatus() != PaymentStatus.PAID;

        if (bookingInvalid) {
            if (ticket.getStatus() != TicketStatus.CANCELLED) {
                ticket.setStatus(TicketStatus.CANCELLED);
                closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
            }
            return ticket;
        }

        if (ticket.getStatus() == TicketStatus.ISSUED && now().isAfter(ticket.getValidUntil())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED);
        }

        return ticket;
    }

    public boolean isTransferable(TicketEntity ticket) {
        return ticket != null
                && ticket.getStatus() == TicketStatus.ISSUED
                && ticket.getCheckedInAt() == null
                && !now().isAfter(ticket.getValidUntil());
    }

    public TicketDetailResponse toDetailResponse(TicketEntity ticket) {
        return TicketDetailResponse.builder()
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .qrToken(ticket.getQrToken())
                .qrContent("BS86:TICKET:" + ticket.getQrToken())
                .ticketStatus(ticket.getStatus())
                .bookingId(ticket.getBooking() != null ? ticket.getBooking().getId() : null)
                .transactionId(ticket.getTransaction() != null ? ticket.getTransaction().getId() : null)
                .orderCode(ticket.getTransaction() != null
                        ? defaultString(ticket.getTransaction().getGatewayOrderCode(), ticket.getTransaction().getTransactionCode())
                        : null)
                .fieldId(ticket.getBooking() != null
                        && ticket.getBooking().getCourt() != null
                        && ticket.getBooking().getCourt().getField() != null
                        ? ticket.getBooking().getCourt().getField().getId()
                        : null)
                .fieldName(ticket.getBooking() != null
                        && ticket.getBooking().getCourt() != null
                        && ticket.getBooking().getCourt().getField() != null
                        ? ticket.getBooking().getCourt().getField().getName()
                        : null)
                .fieldAddress(ticket.getBooking() != null
                        && ticket.getBooking().getCourt() != null
                        && ticket.getBooking().getCourt().getField() != null
                        ? ticket.getBooking().getCourt().getField().getAddress()
                        : null)
                .courtId(ticket.getBooking() != null && ticket.getBooking().getCourt() != null
                        ? ticket.getBooking().getCourt().getId()
                        : null)
                .courtName(ticket.getBooking() != null && ticket.getBooking().getCourt() != null
                        ? buildCourtName(ticket.getBooking().getCourt().getCourtNumber())
                        : null)
                .courtNumber(ticket.getBooking() != null && ticket.getBooking().getCourt() != null
                        ? ticket.getBooking().getCourt().getCourtNumber()
                        : null)
                .slotDate(ticket.getBooking() != null ? ticket.getBooking().getBookingDate() : null)
                .startTime(ticket.getBooking() != null ? ticket.getBooking().getStartTime() : null)
                .endTime(ticket.getBooking() != null ? ticket.getBooking().getEndTime() : null)
                .validFrom(ticket.getValidFrom())
                .validUntil(ticket.getValidUntil())
                .issuedAt(ticket.getIssuedAt())
                .checkedInAt(ticket.getCheckedInAt())
                .owner(TicketOwnerResponse.builder()
                        .userId(ticket.getCurrentHolder() != null ? ticket.getCurrentHolder().getId() : null)
                        .fullName(ticket.getCurrentHolder() != null ? ticket.getCurrentHolder().getFullName() : null)
                        .phoneNumber(ticket.getCurrentHolder() != null ? ticket.getCurrentHolder().getPhoneNumber() : null)
                        .email(ticket.getCurrentHolder() != null ? ticket.getCurrentHolder().getEmail() : null)
                        .build())
                .displayNote(defaultString(ticket.getDisplayNote(), DEFAULT_DISPLAY_NOTE))
                .build();
    }

    private TicketSummaryResponse toSummaryResponse(TicketEntity ticket) {
        return TicketSummaryResponse.builder()
                .ticketId(ticket.getId())
                .ticketCode(ticket.getTicketCode())
                .ticketStatus(ticket.getStatus())
                .fieldId(ticket.getBooking() != null
                        && ticket.getBooking().getCourt() != null
                        && ticket.getBooking().getCourt().getField() != null
                        ? ticket.getBooking().getCourt().getField().getId()
                        : null)
                .fieldName(ticket.getBooking() != null
                        && ticket.getBooking().getCourt() != null
                        && ticket.getBooking().getCourt().getField() != null
                        ? ticket.getBooking().getCourt().getField().getName()
                        : null)
                .courtId(ticket.getBooking() != null && ticket.getBooking().getCourt() != null
                        ? ticket.getBooking().getCourt().getId()
                        : null)
                .courtName(ticket.getBooking() != null && ticket.getBooking().getCourt() != null
                        ? buildCourtName(ticket.getBooking().getCourt().getCourtNumber())
                        : null)
                .slotDate(ticket.getBooking() != null ? ticket.getBooking().getBookingDate() : null)
                .startTime(ticket.getBooking() != null ? ticket.getBooking().getStartTime() : null)
                .endTime(ticket.getBooking() != null ? ticket.getBooking().getEndTime() : null)
                .validFrom(ticket.getValidFrom())
                .validUntil(ticket.getValidUntil())
                .build();
    }

    private void assertCanViewTicket(TicketEntity ticket, User currentUser) {
        if (ticket.getCurrentHolder() != null && ticket.getCurrentHolder().getId().equals(currentUser.getId())) {
            return;
        }
        if (hasRole(currentUser, Role.ADMIN)) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "You do not have access to this ticket");
    }

    private void closeRelatedPassFlows(TicketEntity ticket, PassPostStatus targetPostStatus) {
        if (ticket.getId() == null) {
            return;
        }

        LocalDateTime currentTime = now();
        for (PassTicketPostEntity post : passTicketPostJpaRepository.findByTicket_Id(ticket.getId())) {
            if (post.getStatus() == PassPostStatus.ACTIVE) {
                post.setStatus(targetPostStatus);
                post.setClosedAt(currentTime);
            }

            for (PassConversationEntity conversation : passConversationJpaRepository.findAllByPassPostId(post.getId())) {
                if (conversation.getStatus() == PassConversationStatus.OPEN) {
                    conversation.setStatus(PassConversationStatus.CLOSED);
                    conversation.setClosedAt(currentTime);
                }
            }
        }
    }

    private LocalDateTime now() {
        return LocalDateTime.now(BUSINESS_ZONE);
    }

    private String generateUniqueTicketCode() {
        String code;
        do {
            code = "TICKET-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        } while (ticketJpaRepository.existsByTicketCode(code));
        return code;
    }

    private String generateUniqueQrToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        } while (ticketJpaRepository.existsByQrToken(token));
        return token;
    }

    private String buildCourtName(Integer courtNumber) {
        return courtNumber == null ? null : "Court " + courtNumber;
    }

    private boolean hasRole(User user, Role role) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(userRole -> userRole.getRole() == role);
    }

    private String defaultString(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }
}
