package com.example.backend.core.service.ticket;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.CheckInResult;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.PassConversationStatus;
import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.core.enums.TicketStatus;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PassTicketPostEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.CheckInLogEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TicketEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CheckInLogJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PassConversationJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PassTicketPostJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.TicketJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.response.owner.OwnerCheckInResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnerCheckInService {

    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String QR_PREFIX = "BS86:TICKET:";
    private static final long ALLOWED_EARLY_CHECKIN_MINUTES = 60;

    private final TicketJpaRepository ticketJpaRepository;
    private final CheckInLogJpaRepository checkInLogJpaRepository;
    private final PassTicketPostJpaRepository passTicketPostJpaRepository;
    private final PassConversationJpaRepository passConversationJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final CurrentUserService currentUserService;
    private final TicketService ticketService;

    @Transactional
    public OwnerCheckInResponse checkInByQrToken(String rawQrToken) {
        User owner = currentUserService.getCurrentUser();
        LocalDateTime now = now();
        String qrToken = normalizeQrToken(rawQrToken);

        if (qrToken.isBlank()) {
            return saveFailure(null, owner, rawQrToken, now, "INVALID_TOKEN");
        }

        TicketEntity ticket = ticketJpaRepository.findByQrTokenForUpdate(qrToken).orElse(null);
        if (ticket == null) {
            return saveFailure(null, owner, qrToken, now, "INVALID_TOKEN");
        }

        ticketService.refreshTicketState(ticket);

        if (!isOwnerOfTicket(owner, ticket)) {
            return saveFailure(ticket, owner, qrToken, now, "FORBIDDEN");
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED || now.isAfter(ticket.getValidUntil())) {
            ticket.setStatus(TicketStatus.EXPIRED);
            closeRelatedPassFlows(ticket, PassPostStatus.CANCELLED, now);
            return saveFailure(ticket, owner, qrToken, now, "EXPIRED");
        }

        if ((ticket.getStatus() != TicketStatus.ISSUED && ticket.getStatus() != TicketStatus.CHECKED_IN)
                || ticket.getBooking() == null
                || ticket.getBooking().getBookingStatus() != OrderStatus.CONFIRMED
                || ticket.getBooking().getPaymentStatus() != PaymentStatus.PAID) {
            return saveFailure(ticket, owner, qrToken, now, "INVALID");
        }

        if (ticket.getBooking().getBookingDate() != null && ticket.getBooking().getStartTime() != null) {
            LocalDateTime bookingStartDateTime = LocalDateTime.of(ticket.getBooking().getBookingDate(), ticket.getBooking().getStartTime());
            if (now.isBefore(bookingStartDateTime.minusMinutes(ALLOWED_EARLY_CHECKIN_MINUTES))) {
                return saveFailure(ticket, owner, qrToken, now, "TOO_EARLY");
            }
        }

        ticket.setStatus(TicketStatus.CHECKED_IN);
        ticket.setCheckedInAt(now);
        closeRelatedPassFlows(ticket, PassPostStatus.CLOSED, now);

        return saveSuccess(ticket, owner, qrToken, now);
    }

    @Transactional
    public List<OwnerCheckInResponse> getMyCheckInHistory() {
        User owner = currentUserService.getCurrentUser();
        return checkInLogJpaRepository.findTop100ByOwner_IdOrderByCheckInTimeDesc(owner.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    private OwnerCheckInResponse saveSuccess(TicketEntity ticket, User owner, String qrToken, LocalDateTime now) {
        CheckInLogEntity log = buildLog(ticket, owner, qrToken, now, CheckInResult.SUCCESS, null);
        checkInLogJpaRepository.save(log);
        return toResponse(log);
    }

    private OwnerCheckInResponse saveFailure(
            TicketEntity ticket,
            User owner,
            String qrToken,
            LocalDateTime now,
            String reason
    ) {
        CheckInLogEntity log = buildLog(ticket, owner, qrToken, now, CheckInResult.FAILED, reason);
        checkInLogJpaRepository.save(log);
        return toResponse(log);
    }

    private CheckInLogEntity buildLog(
            TicketEntity ticket,
            User owner,
            String qrToken,
            LocalDateTime now,
            CheckInResult result,
            String reason
    ) {
        CheckInLogEntity log = new CheckInLogEntity();
        log.setTicket(ticket);
        log.setTicketIdSnapshot(ticket != null ? ticket.getId() : null);
        log.setTicketCodeSnapshot(ticket != null ? ticket.getTicketCode() : null);
        log.setFieldNameSnapshot(getFieldName(ticket));
        log.setCourtNameSnapshot(getCourtName(ticket));
        log.setSlotDateSnapshot(ticket != null && ticket.getBooking() != null ? ticket.getBooking().getBookingDate() : null);
        log.setStartTimeSnapshot(ticket != null && ticket.getBooking() != null ? ticket.getBooking().getStartTime() : null);
        log.setEndTimeSnapshot(ticket != null && ticket.getBooking() != null ? ticket.getBooking().getEndTime() : null);
        log.setQrToken(qrToken);
        log.setOwner(mapOwner(owner));
        log.setCheckInTime(now);
        log.setResult(result);
        log.setReason(reason);
        return log;
    }

    private OwnerCheckInResponse toResponse(CheckInLogEntity log) {
        return OwnerCheckInResponse.builder()
                .logId(log.getId())
                .ticketId(log.getTicketIdSnapshot())
                .ticketCode(log.getTicketCodeSnapshot())
                .qrToken(log.getQrToken())
                .fieldName(log.getFieldNameSnapshot())
                .courtName(log.getCourtNameSnapshot())
                .slotDate(log.getSlotDateSnapshot())
                .startTime(log.getStartTimeSnapshot())
                .endTime(log.getEndTimeSnapshot())
                .ticketStatus(log.getTicket() != null ? log.getTicket().getStatus() : null)
                .result(log.getResult())
                .reason(log.getReason())
                .checkInTime(log.getCheckInTime())
                .build();
    }

    private boolean isOwnerOfTicket(User owner, TicketEntity ticket) {
        if (owner == null || ticket == null || ticket.getBooking() == null || ticket.getBooking().getCourt() == null) {
            return false;
        }

        return ticket.getBooking().getCourt().getField() != null
                && ticket.getBooking().getCourt().getField().getOwner() != null
                && ticket.getBooking().getCourt().getField().getOwner().getUser() != null
                && owner.getId().equals(ticket.getBooking().getCourt().getField().getOwner().getUser().getId());
    }

    private void closeRelatedPassFlows(TicketEntity ticket, PassPostStatus targetPostStatus, LocalDateTime now) {
        if (ticket == null || ticket.getId() == null) {
            return;
        }

        for (PassTicketPostEntity post : passTicketPostJpaRepository.findByTicket_Id(ticket.getId())) {
            if (post.getStatus() == PassPostStatus.ACTIVE) {
                post.setStatus(targetPostStatus);
                post.setClosedAt(now);
            }

            for (PassConversationEntity conversation : passConversationJpaRepository.findAllByPassPostId(post.getId())) {
                if (conversation.getStatus() == PassConversationStatus.OPEN) {
                    conversation.setStatus(PassConversationStatus.CLOSED);
                    conversation.setClosedAt(now);
                }
            }
        }
    }

    private String getFieldName(TicketEntity ticket) {
        if (ticket == null
                || ticket.getBooking() == null
                || ticket.getBooking().getCourt() == null
                || ticket.getBooking().getCourt().getField() == null) {
            return null;
        }

        return ticket.getBooking().getCourt().getField().getName();
    }

    private String getCourtName(TicketEntity ticket) {
        if (ticket == null || ticket.getBooking() == null || ticket.getBooking().getCourt() == null) {
            return null;
        }

        Integer courtNumber = ticket.getBooking().getCourt().getCourtNumber();
        return courtNumber == null ? null : "Court " + courtNumber;
    }

    private com.example.backend.infrastructure.persistence.jpa.entity.UserEntity mapOwner(User owner) {
        return userJpaRepository.getReferenceById(owner.getId());
    }

    private String normalizeQrToken(String rawQrToken) {
        String normalized = rawQrToken == null ? "" : rawQrToken.trim();
        if (normalized.startsWith(QR_PREFIX)) {
            return normalized.substring(QR_PREFIX.length()).trim();
        }
        return normalized;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(BUSINESS_ZONE);
    }
}
