package com.example.backend.core.service.member;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.enums.groups.InviteStatus;
import com.example.backend.core.repository.group.GroupInviteRepository;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class JoinGroupByCodeService {

    private final GroupInviteRepository groupInviteRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    @Transactional
    public GroupDetailSummary execute(String code, User currentUser) {
        GroupInvite invite = groupInviteRepository.findByCode(code)
                .orElseThrow(() -> new GroupDomainException("Invalid invite code or invite not found"));

        if (invite.getStatus() == InviteStatus.REVOKED) {
            throw new GroupDomainException("Invalid invite code or invite not found");
        }

        if (invite.getExpiredAt().isBefore(LocalDateTime.now())) {
            invite.setStatus(InviteStatus.EXPIRED);
            groupInviteRepository.save(invite);
            throw new GroupDomainException("Invalid invite code or invite not found");
        }

        Group group = groupRepository.findById(invite.getGroupId())
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Group not found");
        }

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(group.getId(), currentUser.getId())
                .orElse(null);

        if (member != null && member.getStatus() == GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are already an active member of this group");
        }

        if (member == null) {
            member = GroupMember.builder()
                    .groupId(group.getId())
                    .userId(currentUser.getId())
                    .role(GroupRole.MEMBER)
                    .status(GroupMemberStatus.ACTIVE)
                    .joinedAt(LocalDateTime.now())
                    .build();
        } else {
            member.setRole(GroupRole.MEMBER);
            member.setStatus(GroupMemberStatus.ACTIVE);
            member.setJoinedAt(LocalDateTime.now());
        }

        groupMemberRepository.save(member);

        return GroupDetailSummary.builder()
                .group(group)
                .myRole(GroupRole.MEMBER)
                .memberCount(groupMemberRepository.countByGroupIdAndStatus(group.getId(), GroupMemberStatus.ACTIVE))
                .build();
    }
}
