package com.example.backend.core.service.invite;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.entity.group.GroupInvitePreview;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.enums.groups.InviteStatus;
import com.example.backend.core.repository.UserRepository;
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
public class ValidateInviteCodeService {

    private final GroupInviteRepository groupInviteRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupInvitePreview execute(String code, User currentUser) {
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

        GroupMember existingMember = groupMemberRepository.findByGroupIdAndUserId(group.getId(), currentUser.getId())
                .orElse(null);

        String leaderEmail = userRepository.findById(group.getLeaderId())
                .map(User::getEmail)
                .orElse("Unknown leader");

        return GroupInvitePreview.builder()
                .invite(invite)
                .group(group)
                .memberCount(groupMemberRepository.countByGroupIdAndStatus(group.getId(), GroupMemberStatus.ACTIVE))
                .leaderEmail(leaderEmail)
                .alreadyMember(existingMember != null && existingMember.getStatus() == GroupMemberStatus.ACTIVE)
                .build();
    }
}
