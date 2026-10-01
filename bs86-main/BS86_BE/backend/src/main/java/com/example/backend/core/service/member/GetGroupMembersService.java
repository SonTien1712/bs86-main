package com.example.backend.core.service.member;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.presentation.dto.response.member.GroupMemberResponse;
import com.example.backend.presentation.exception.GroupDomainException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GetGroupMembersService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public List<GroupMemberResponse> execute(Long groupId, User currentUser) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupDomainException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupDomainException("Only active groups can show members");
        }

        GroupMember currentMember = groupMemberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new GroupDomainException("You are not allowed to view this group's members"));

        if (currentMember.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new GroupDomainException("You are not allowed to view this group's members");
        }

        return groupMemberRepository.findByGroupIdAndStatus(groupId, GroupMemberStatus.ACTIVE).stream()
                .sorted(Comparator.comparing((GroupMember member) -> member.getRole().name())
                        .thenComparing(GroupMember::getJoinedAt))
                .map(member -> GroupMemberResponse.builder()
                        .userId(member.getUserId())
                        .userEmail(userRepository.findById(member.getUserId()).map(User::getEmail).orElse("Unknown"))
                        .role(member.getRole())
                        .status(member.getStatus())
                        .joinedAt(member.getJoinedAt())
                        .build())
                .toList();
    }
}
