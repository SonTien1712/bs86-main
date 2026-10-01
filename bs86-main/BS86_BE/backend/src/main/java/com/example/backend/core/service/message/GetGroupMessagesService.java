package com.example.backend.core.service.message;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.entity.group.GroupMessage;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupMessageRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.dto.response.message.GroupMessagePageResponse;
import com.example.backend.presentation.dto.response.message.GroupMessageResponse;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GetGroupMessagesService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final UserRepository userRepository;

    public GroupMessagePageResponse execute(Long groupId, Long beforeMessageId, Integer limit, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can show messages");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to view this group's messages"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are not allowed to view this group's messages");
        }

        int safeLimit = limit == null ? 20 : Math.min(Math.max(limit, 1), 50);

        List<GroupMessage> messages = groupMessageRepository.findLatestMessages(groupId, beforeMessageId, safeLimit + 1);
        boolean hasMore = messages.size() > safeLimit;

        List<GroupMessageResponse> items = messages.stream()
                .limit(safeLimit)
                .sorted(Comparator.comparing(GroupMessage::getId))
                .map(message -> GroupMessageResponse.builder()
                        .id(message.getId())
                        .groupId(message.getGroupId())
                        .senderId(message.getSenderId())
                        .senderEmail(userRepository.findById(message.getSenderId()).map(User::getEmail).orElse("Unknown"))
                        .content(message.getContent())
                        .messageType(message.getMessageType())
                        .createdAt(message.getCreatedAt())
                        .build())
                .toList();

        Long nextBeforeMessageId = items.isEmpty() ? null : items.getFirst().getId();

        return GroupMessagePageResponse.builder()
                .items(items)
                .nextBeforeMessageId(nextBeforeMessageId)
                .hasMore(hasMore)
                .build();
    }
}
