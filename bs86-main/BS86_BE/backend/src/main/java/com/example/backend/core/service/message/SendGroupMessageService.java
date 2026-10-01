package com.example.backend.core.service.message;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.entity.group.GroupMessage;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.enums.groups.MessageType;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupMessageRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.dto.request.message.SendGroupMessageRequest;
import com.example.backend.presentation.dto.response.message.GroupMessageResponse;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SendGroupMessageService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMessageRepository groupMessageRepository;

    @Transactional
    public GroupMessageResponse execute(Long groupId, SendGroupMessageRequest request, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can receive messages");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to send messages in this group"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are not allowed to send messages in this group");
        }

        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isBlank()) {
            throw new GroupDomainException("Message content is required");
        }
        if (content.length() > 2000) {
            throw new GroupDomainException("Message content must not exceed 2000 characters");
        }

        GroupMessage saved = groupMessageRepository.save(GroupMessage.builder()
                .groupId(groupId)
                .senderId(currentUser.getId())
                .content(content)
                .messageType(MessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build());

        return GroupMessageResponse.builder()
                .id(saved.getId())
                .groupId(saved.getGroupId())
                .senderId(saved.getSenderId())
                .senderEmail(currentUser.getEmail())
                .content(saved.getContent())
                .messageType(saved.getMessageType())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
