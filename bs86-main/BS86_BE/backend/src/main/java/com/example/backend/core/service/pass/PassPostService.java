package com.example.backend.core.service.pass;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.core.enums.PostCategory;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.ticket.TicketService;
import com.example.backend.infrastructure.persistence.jpa.entity.PassTicketPostEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TicketEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.PassTicketPostJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.request.pass.CreatePassPostRequest;
import com.example.backend.presentation.dto.response.pass.PassPostResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PassPostService {

    private final PassTicketPostJpaRepository passTicketPostJpaRepository;
    private final TicketService ticketService;
    private final CurrentUserService currentUserService;
    private final UserJpaRepository userJpaRepository;

    @Transactional
    public PassPostResponse createPassPost(CreatePassPostRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        TicketEntity ticket = ticketService.getTransferableTicketForUpdate(request.getTicketId(), currentUser.getId());

        if (passTicketPostJpaRepository.findByTicket_IdAndStatus(ticket.getId(), PassPostStatus.ACTIVE).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "This ticket already has an active pass post");
        }
        if (request.getAskingPrice() != null && request.getAskingPrice().signum() < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "askingPrice must not be negative");
        }

        PassTicketPostEntity post = new PassTicketPostEntity();
        post.setTicket(ticket);
        post.setOwnerUser(userJpaRepository.getReferenceById(currentUser.getId()));
        post.setField(ticket.getBooking().getCourt().getField());
        post.setCategory(PostCategory.PASS_SAN);
        post.setStatus(PassPostStatus.ACTIVE);
        post.setContent(buildPostContent(request, ticket));
        post.setAskingPrice(request.getAskingPrice());

        return toResponse(passTicketPostJpaRepository.save(post));
    }

    @Transactional
    public List<PassPostResponse> listActivePassPosts() {
        List<PassTicketPostEntity> posts = passTicketPostJpaRepository.findAllActiveWithDetails(PassPostStatus.ACTIVE);
        return posts.stream()
                .filter(post -> {
                    ticketService.refreshTicketState(post.getTicket());
                    if (!ticketService.isTransferable(post.getTicket())) {
                        post.setStatus(PassPostStatus.CANCELLED);
                        post.setClosedAt(LocalDateTime.now());
                        return false;
                    }
                    return post.getOwnerUser() != null
                            && post.getTicket().getCurrentHolder() != null
                            && post.getOwnerUser().getId().equals(post.getTicket().getCurrentHolder().getId());
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PassTicketPostEntity getActivePostForUpdate(Long postId) {
        PassTicketPostEntity post = passTicketPostJpaRepository.findByIdForUpdate(postId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pass post not found"));

        ticketService.refreshTicketState(post.getTicket());
        if (post.getStatus() != PassPostStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Pass post is no longer active");
        }
        if (!ticketService.isTransferable(post.getTicket())) {
            post.setStatus(PassPostStatus.CANCELLED);
            post.setClosedAt(LocalDateTime.now());
            throw new BusinessException(HttpStatus.CONFLICT, "Ticket is no longer transferable");
        }
        if (!post.getOwnerUser().getId().equals(post.getTicket().getCurrentHolder().getId())) {
            post.setStatus(PassPostStatus.CLOSED);
            post.setClosedAt(LocalDateTime.now());
            throw new BusinessException(HttpStatus.CONFLICT, "Pass post owner no longer owns this ticket");
        }
        return post;
    }

    public PassPostResponse toResponse(PassTicketPostEntity post) {
        return PassPostResponse.builder()
                .id(post.getId())
                .ticketId(post.getTicket() != null ? post.getTicket().getId() : null)
                .ownerUserId(post.getOwnerUser() != null ? post.getOwnerUser().getId() : null)
                .ownerFullName(post.getOwnerUser() != null ? post.getOwnerUser().getFullName() : null)
                .category(post.getCategory())
                .status(post.getStatus())
                .ticketStatus(post.getTicket() != null ? post.getTicket().getStatus() : null)
                .content(post.getContent())
                .askingPrice(post.getAskingPrice())
                .fieldId(post.getField() != null ? post.getField().getId() : null)
                .fieldName(post.getField() != null ? post.getField().getName() : null)
                .fieldAddress(post.getField() != null ? post.getField().getAddress() : null)
                .courtId(post.getTicket() != null && post.getTicket().getBooking() != null && post.getTicket().getBooking().getCourt() != null
                        ? post.getTicket().getBooking().getCourt().getId()
                        : null)
                .courtName(post.getTicket() != null && post.getTicket().getBooking() != null && post.getTicket().getBooking().getCourt() != null
                        ? "Court " + post.getTicket().getBooking().getCourt().getCourtNumber()
                        : null)
                .slotDate(post.getTicket() != null && post.getTicket().getBooking() != null
                        ? post.getTicket().getBooking().getBookingDate()
                        : null)
                .startTime(post.getTicket() != null && post.getTicket().getBooking() != null
                        ? post.getTicket().getBooking().getStartTime()
                        : null)
                .endTime(post.getTicket() != null && post.getTicket().getBooking() != null
                        ? post.getTicket().getBooking().getEndTime()
                        : null)
                .createdAt(post.getCreatedAt())
                .build();
    }

    private String buildPostContent(CreatePassPostRequest request, TicketEntity ticket) {
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (!content.isBlank()) {
            return content;
        }
        return "Passing ticket for "
                + ticket.getBooking().getCourt().getField().getName()
                + " - Court "
                + ticket.getBooking().getCourt().getCourtNumber()
                + " on "
                + ticket.getBooking().getBookingDate()
                + " from "
                + ticket.getBooking().getStartTime()
                + " to "
                + ticket.getBooking().getEndTime();
    }
}
