package com.example.backend.core.service.group;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetGroupDetailService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public GroupDetailSummary execute(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to view this group"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are not allowed to view this group");
        }

        return GroupDetailSummary.builder()
                .group(group)
                .myRole(member.getRole())
                .memberCount(groupMemberRepository.countByGroupIdAndStatus(groupId, GroupMemberStatus.ACTIVE))
                .build();
    }
}
