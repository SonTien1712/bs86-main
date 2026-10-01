package com.example.backend.core.service.member;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LeaveGroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public void execute(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can be left");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to leave this group"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are not allowed to leave this group");
        }

        if (member.getRole() == GroupRole.LEADER) {
            throw new GroupDomainException("Leader must transfer leadership or disband group before leaving");
        }

        member.setStatus(GroupMemberStatus.LEFT);
        groupMemberRepository.save(member);
    }
}
