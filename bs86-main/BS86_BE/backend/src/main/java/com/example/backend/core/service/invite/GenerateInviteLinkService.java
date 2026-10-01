package com.example.backend.core.service.invite;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupRole;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.factory.GroupInviteFactory;
import com.example.backend.core.repository.group.GroupInviteRepository;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GenerateInviteLinkService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupInviteRepository groupInviteRepository;
    private final GroupInviteFactory groupInviteFactory;

    @Transactional
    public GroupInvite execute(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to generate invite links"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can generate invite links");
        }

        if (member.getStatus() != GroupMemberStatus.ACTIVE || member.getRole() != GroupRole.LEADER) {
            throw new GroupDomainException("You are not allowed to generate invite links");
        }

        String code = generateUniqueCode();
        GroupInvite invite = groupInviteFactory.create(groupId, currentUser.getId(), code);
        return groupInviteRepository.save(invite);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        } while (groupInviteRepository.existsByCode(code));
        return code;
    }
}
