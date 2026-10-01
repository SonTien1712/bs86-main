package com.example.backend.core.service.group;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.factory.GroupFactory;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.dto.request.group.CreateGroupRequest;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CreateGroupService {

    private final GroupFactory groupFactory;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public GroupDetailSummary execute(CreateGroupRequest request, User currentUser) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new GroupDomainException("Group name is required");
        }

        Group group = groupFactory.create(
                request.getName().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                currentUser.getId()
        );
        Group savedGroup = groupRepository.save(group);

        GroupMember leaderMember = GroupMember.builder()
                .groupId(savedGroup.getId())
                .userId(currentUser.getId())
                .role(GroupRole.LEADER)
                .status(GroupMemberStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();
        groupMemberRepository.save(leaderMember);

        return GroupDetailSummary.builder()
                .group(savedGroup)
                .myRole(GroupRole.LEADER)
                .memberCount(1)
                .build();
    }
}
