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
public class RemoveMemberService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public void execute(Long groupId, Long memberUserId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can remove members");
        }

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to remove members"));

        if (currentMember.getStatus() != GroupMemberStatus.ACTIVE || currentMember.getRole() != GroupRole.LEADER) {
            throw new GroupDomainException("You are not allowed to remove members");
        }

        if (currentUser.getId().equals(memberUserId)) {
            throw new GroupDomainException("Leader cannot remove themselves from the group");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberUserId)
                .orElseThrow(() -> new GroupDomainException("Group member not found"));

        if (targetMember.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("Group member not found");
        }

        if (targetMember.getRole() == GroupRole.LEADER) {
            throw new GroupDomainException("Leader cannot be removed");
        }

        targetMember.setStatus(GroupMemberStatus.REMOVED);
        groupMemberRepository.save(targetMember);
    }
}
