package com.example.backend.core.service.pass;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.PassConversationStatus;
import com.example.backend.core.enums.PassPostStatus;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.ticket.TicketService;
import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationMessageEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.PassTicketPostEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.TicketEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.PassConversationJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.PassConversationMessageJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.UserJpaRepository;
import com.example.backend.presentation.dto.request.pass.ContactPassPostRequest;
import com.example.backend.presentation.dto.request.pass.SendPassConversationMessageRequest;
import com.example.backend.presentation.dto.response.pass.PassConversationDetailResponse;
import com.example.backend.presentation.dto.response.pass.PassConversationMessageResponse;
import com.example.backend.presentation.dto.response.pass.PassConversationSummaryResponse;
import com.example.backend.presentation.dto.response.ticket.TicketDetailResponse;
import com.example.backend.presentation.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PassConversationService {

    private final PassPostService passPostService;
    private final PassConversationJpaRepository passConversationJpaRepository;
    private final PassConversationMessageJpaRepository passConversationMessageJpaRepository;
    private final UserJpaRepository userJpaRepository;
    private final CurrentUserService currentUserService;
    private final TicketService ticketService;

    @Transactional
    public PassConversationDetailResponse contactPassPost(Long passPostId, ContactPassPostRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        PassTicketPostEntity post = passPostService.getActivePostForUpdate(passPostId);

        if (post.getOwnerUser().getId().equals(currentUser.getId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "You cannot contact your own pass post");
        }

        PassConversationEntity conversation = passConversationJpaRepository.findByPostIdAndInterestedUserId(
                passPostId,
                currentUser.getId()
        ).orElse(null);

        if (conversation == null) {
            conversation = new PassConversationEntity();
            conversation.setPassPost(post);
            conversation.setOwnerUser(post.getOwnerUser());
            conversation.setInterestedUser(userJpaRepository.getReferenceById(currentUser.getId()));
            conversation.setStatus(PassConversationStatus.OPEN);
            conversation = passConversationJpaRepository.save(conversation);
        } else if (conversation.getStatus() == PassConversationStatus.COMPLETED) {
            throw new BusinessException(HttpStatus.CONFLICT, "This conversation is already completed");
        } else if (conversation.getStatus() == PassConversationStatus.CLOSED) {
            conversation.setStatus(PassConversationStatus.OPEN);
            conversation.setClosedAt(null);
        }

        String initialMessage = normalizeMessage(request != null ? request.getInitialMessage() : null);
        if (initialMessage != null) {
            appendMessage(conversation, currentUser.getId(), initialMessage);
        }

        return toDetailResponse(conversation, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<PassConversationSummaryResponse> getMyConversations() {
        User currentUser = currentUserService.getCurrentUser();
        return passConversationJpaRepository.findMyConversations(currentUser.getId()).stream()
                .map(conversation -> toSummaryResponse(conversation, currentUser.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public PassConversationDetailResponse getConversation(Long conversationId) {
        User currentUser = currentUserService.getCurrentUser();
        PassConversationEntity conversation = passConversationJpaRepository.findWithDetailsById(conversationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Conversation not found"));

        assertParticipant(conversation, currentUser.getId());
        return toDetailResponse(conversation, currentUser.getId());
    }

    @Transactional
    public PassConversationMessageResponse sendMessage(Long conversationId, SendPassConversationMessageRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        PassConversationEntity conversation = passConversationJpaRepository.findByIdForUpdate(conversationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Conversation not found"));

        assertParticipant(conversation, currentUser.getId());
        if (conversation.getStatus() != PassConversationStatus.OPEN) {
            throw new BusinessException(HttpStatus.CONFLICT, "Conversation is not open");
        }

        String content = normalizeRequiredMessage(request.getContent());
        return toMessageResponse(appendMessage(conversation, currentUser.getId(), content));
    }

    @Transactional
    public PassConversationDetailResponse closeConversation(Long conversationId) {
        User currentUser = currentUserService.getCurrentUser();
        PassConversationEntity conversation = passConversationJpaRepository.findByIdForUpdate(conversationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Conversation not found"));

        assertParticipant(conversation, currentUser.getId());
        if (conversation.getStatus() == PassConversationStatus.COMPLETED) {
            return toDetailResponse(conversation, currentUser.getId());
        }

        conversation.setStatus(PassConversationStatus.CLOSED);
        conversation.setClosedAt(LocalDateTime.now());
        return toDetailResponse(conversation, currentUser.getId());
    }

    @Transactional
    public TicketDetailResponse transferTicket(Long conversationId) {
        User currentUser = currentUserService.getCurrentUser();
        PassConversationEntity conversation = passConversationJpaRepository.findByIdForUpdate(conversationId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Conversation not found"));

        if (!conversation.getOwnerUser().getId().equals(currentUser.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only the pass post owner can transfer this ticket");
        }
        if (conversation.getStatus() != PassConversationStatus.OPEN) {
            throw new BusinessException(HttpStatus.CONFLICT, "Conversation is not open");
        }

        PassTicketPostEntity post = conversation.getPassPost();
        if (post.getStatus() != PassPostStatus.ACTIVE) {
            throw new BusinessException(HttpStatus.CONFLICT, "Pass post is no longer active");
        }

        TicketEntity ticket = ticketService.getTransferableTicketForUpdate(post.getTicket().getId(), currentUser.getId());
        ticketService.transferTicket(ticket, conversation.getInterestedUser());

        LocalDateTime now = LocalDateTime.now();
        post.setStatus(PassPostStatus.COMPLETED);
        post.setClosedAt(now);

        for (PassConversationEntity item : passConversationJpaRepository.findAllByPassPostId(post.getId())) {
            if (item.getId().equals(conversation.getId())) {
                item.setStatus(PassConversationStatus.COMPLETED);
                item.setCompletedAt(now);
                item.setClosedAt(now);
            } else if (item.getStatus() != PassConversationStatus.COMPLETED) {
                item.setStatus(PassConversationStatus.CLOSED);
                item.setClosedAt(now);
            }
        }

        return ticketService.toDetailResponse(ticket);
    }

    private PassConversationMessageEntity appendMessage(PassConversationEntity conversation, Long senderUserId, String content) {
        conversation.setUpdatedAt(LocalDateTime.now());
        PassConversationMessageEntity message = new PassConversationMessageEntity();
        message.setConversation(conversation);
        message.setSenderUser(userJpaRepository.getReferenceById(senderUserId));
        message.setContent(content);
        return passConversationMessageJpaRepository.save(message);
    }

    private PassConversationDetailResponse toDetailResponse(PassConversationEntity conversation, Long viewerUserId) {
        assertParticipant(conversation, viewerUserId);
        List<PassConversationMessageResponse> messages = passConversationMessageJpaRepository
                .findByConversation_IdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(this::toMessageResponse)
                .toList();

        return PassConversationDetailResponse.builder()
                .id(conversation.getId())
                .passPostId(conversation.getPassPost() != null ? conversation.getPassPost().getId() : null)
                .ticketId(conversation.getPassPost() != null && conversation.getPassPost().getTicket() != null
                        ? conversation.getPassPost().getTicket().getId()
                        : null)
                .status(conversation.getStatus())
                .ownerUserId(conversation.getOwnerUser() != null ? conversation.getOwnerUser().getId() : null)
                .ownerFullName(conversation.getOwnerUser() != null ? conversation.getOwnerUser().getFullName() : null)
                .interestedUserId(conversation.getInterestedUser() != null ? conversation.getInterestedUser().getId() : null)
                .interestedUserFullName(conversation.getInterestedUser() != null ? conversation.getInterestedUser().getFullName() : null)
                .fieldName(conversation.getPassPost() != null
                        && conversation.getPassPost().getTicket() != null
                        && conversation.getPassPost().getTicket().getBooking() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt().getField() != null
                        ? conversation.getPassPost().getTicket().getBooking().getCourt().getField().getName()
                        : null)
                .courtName(conversation.getPassPost() != null
                        && conversation.getPassPost().getTicket() != null
                        && conversation.getPassPost().getTicket().getBooking() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt() != null
                        ? "Court " + conversation.getPassPost().getTicket().getBooking().getCourt().getCourtNumber()
                        : null)
                .postContent(conversation.getPassPost() != null ? conversation.getPassPost().getContent() : null)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .messages(messages)
                .build();
    }

    private PassConversationSummaryResponse toSummaryResponse(PassConversationEntity conversation, Long viewerUserId) {
        PassConversationMessageEntity lastMessage = passConversationMessageJpaRepository
                .findTopByConversation_IdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        boolean viewerIsOwner = conversation.getOwnerUser() != null
                && conversation.getOwnerUser().getId().equals(viewerUserId);

        return PassConversationSummaryResponse.builder()
                .id(conversation.getId())
                .passPostId(conversation.getPassPost() != null ? conversation.getPassPost().getId() : null)
                .ticketId(conversation.getPassPost() != null && conversation.getPassPost().getTicket() != null
                        ? conversation.getPassPost().getTicket().getId()
                        : null)
                .status(conversation.getStatus())
                .ownerUserId(conversation.getOwnerUser() != null ? conversation.getOwnerUser().getId() : null)
                .ownerFullName(conversation.getOwnerUser() != null ? conversation.getOwnerUser().getFullName() : null)
                .interestedUserId(conversation.getInterestedUser() != null ? conversation.getInterestedUser().getId() : null)
                .interestedUserFullName(conversation.getInterestedUser() != null ? conversation.getInterestedUser().getFullName() : null)
                .counterpartUserId(viewerIsOwner
                        ? (conversation.getInterestedUser() != null ? conversation.getInterestedUser().getId() : null)
                        : (conversation.getOwnerUser() != null ? conversation.getOwnerUser().getId() : null))
                .counterpartFullName(viewerIsOwner
                        ? (conversation.getInterestedUser() != null ? conversation.getInterestedUser().getFullName() : null)
                        : (conversation.getOwnerUser() != null ? conversation.getOwnerUser().getFullName() : null))
                .fieldName(conversation.getPassPost() != null
                        && conversation.getPassPost().getTicket() != null
                        && conversation.getPassPost().getTicket().getBooking() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt().getField() != null
                        ? conversation.getPassPost().getTicket().getBooking().getCourt().getField().getName()
                        : null)
                .courtName(conversation.getPassPost() != null
                        && conversation.getPassPost().getTicket() != null
                        && conversation.getPassPost().getTicket().getBooking() != null
                        && conversation.getPassPost().getTicket().getBooking().getCourt() != null
                        ? "Court " + conversation.getPassPost().getTicket().getBooking().getCourt().getCourtNumber()
                        : null)
                .updatedAt(conversation.getUpdatedAt())
                .createdAt(conversation.getCreatedAt())
                .lastMessagePreview(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageAt(lastMessage != null ? lastMessage.getCreatedAt() : null)
                .build();
    }

    private PassConversationMessageResponse toMessageResponse(PassConversationMessageEntity message) {
        return PassConversationMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderUserId(message.getSenderUser() != null ? message.getSenderUser().getId() : null)
                .senderFullName(message.getSenderUser() != null ? message.getSenderUser().getFullName() : null)
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private void assertParticipant(PassConversationEntity conversation, Long userId) {
        boolean isOwner = conversation.getOwnerUser() != null && conversation.getOwnerUser().getId().equals(userId);
        boolean isInterestedUser = conversation.getInterestedUser() != null
                && conversation.getInterestedUser().getId().equals(userId);
        if (!isOwner && !isInterestedUser) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You do not have access to this conversation");
        }
    }

    private String normalizeRequiredMessage(String content) {
        String normalized = normalizeMessage(content);
        if (normalized == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Message content is required");
        }
        return normalized;
    }

    private String normalizeMessage(String content) {
        if (content == null) {
            return null;
        }
        String normalized = content.trim();
        return normalized.isBlank() ? null : normalized;
    }
}
