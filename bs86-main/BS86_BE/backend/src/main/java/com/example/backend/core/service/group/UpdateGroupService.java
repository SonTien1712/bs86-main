package com.example.backend.core.service.group;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.dto.request.group.UpdateGroupRequest;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UpdateGroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public GroupDetailSummary execute(Long groupId, UpdateGroupRequest request, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to update this group"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE || member.getRole() != GroupRole.LEADER) {
            throw new GroupDomainException("You are not allowed to update this group");
        }

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can be updated");
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new GroupDomainException("Group name is required");
        }

        group.setName(request.getName().trim());
        group.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        group.setUpdatedAt(LocalDateTime.now());
        Group savedGroup = groupRepository.save(group);

        return GroupDetailSummary.builder()
                .group(savedGroup)
                .myRole(GroupRole.LEADER)
                .memberCount(groupMemberRepository.countByGroupIdAndStatus(groupId, GroupMemberStatus.ACTIVE))
                .build();
    }
}
