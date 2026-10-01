package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.message.GetGroupMessagesService;
import com.example.backend.core.service.message.SendGroupMessageService;
import com.example.backend.presentation.dto.request.message.SendGroupMessageRequest;
import com.example.backend.presentation.dto.response.message.GroupMessagePageResponse;
import com.example.backend.presentation.dto.response.message.GroupMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupMessageController {

    private final CurrentUserService currentUserService;
    private final SendGroupMessageService sendGroupMessageService;
    private final GetGroupMessagesService getGroupMessagesService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/{groupId}/messages")
    public GroupMessageResponse sendMessage(
            @PathVariable Long groupId,
            @RequestBody SendGroupMessageRequest request
    ) {
        User currentUser = currentUserService.getCurrentUser();
        GroupMessageResponse response = sendGroupMessageService.execute(groupId, request, currentUser);
        messagingTemplate.convertAndSend("/topic/groups/" + groupId, response);
        return response;
    }

    @GetMapping("/{groupId}/messages")
    public GroupMessagePageResponse getMessages(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long beforeMessageId,
            @RequestParam(required = false) Integer limit
    ) {
        User currentUser = currentUserService.getCurrentUser();
        return getGroupMessagesService.execute(groupId, beforeMessageId, limit, currentUser);
    }
}
