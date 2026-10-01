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
public class TransferLeaderService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public void execute(Long groupId, Long targetUserId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can transfer leadership");
        }

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to transfer leadership"));

        if (currentMember.getStatus() != GroupMemberStatus.ACTIVE || currentMember.getRole() != GroupRole.LEADER) {
            throw new GroupDomainException("You are not allowed to transfer leadership");
        }

        if (currentUser.getId().equals(targetUserId)) {
            throw new GroupDomainException("Target leader must be another active member");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new GroupDomainException("Group member not found"));

        if (targetMember.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("Target leader must be another active member");
        }

        currentMember.setRole(GroupRole.MEMBER);
        targetMember.setRole(GroupRole.LEADER);
        group.setLeaderId(targetUserId);

        groupMemberRepository.save(currentMember);
        groupMemberRepository.save(targetMember);
        groupRepository.save(group);
    }
}
