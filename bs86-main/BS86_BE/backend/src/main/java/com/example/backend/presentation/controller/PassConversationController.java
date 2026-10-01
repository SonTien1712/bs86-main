package com.example.backend.presentation.controller;

import com.example.backend.core.service.pass.PassConversationService;
import com.example.backend.presentation.dto.request.pass.SendPassConversationMessageRequest;
import com.example.backend.presentation.dto.response.pass.PassConversationDetailResponse;
import com.example.backend.presentation.dto.response.pass.PassConversationMessageResponse;
import com.example.backend.presentation.dto.response.pass.PassConversationSummaryResponse;
import com.example.backend.presentation.dto.response.ticket.TicketDetailResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pass-conversations")
@RequiredArgsConstructor
public class PassConversationController {

    private final PassConversationService passConversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/my")
    public List<PassConversationSummaryResponse> getMyConversations() {
        return passConversationService.getMyConversations();
    }

    @GetMapping("/{conversationId}")
    public PassConversationDetailResponse getConversation(@PathVariable Long conversationId) {
        return passConversationService.getConversation(conversationId);
    }

    @PostMapping("/{conversationId}/messages")
    public PassConversationMessageResponse sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendPassConversationMessageRequest request
    ) {
        PassConversationMessageResponse response = passConversationService.sendMessage(conversationId, request);
        messagingTemplate.convertAndSend("/topic/pass-conversations/" + conversationId, response);
        return response;
    }

    @PostMapping("/{conversationId}/close")
    public PassConversationDetailResponse closeConversation(@PathVariable Long conversationId) {
        return passConversationService.closeConversation(conversationId);
    }

    @PostMapping("/{conversationId}/transfer")
    public TicketDetailResponse transferTicket(@PathVariable Long conversationId) {
        return passConversationService.transferTicket(conversationId);
    }
}
