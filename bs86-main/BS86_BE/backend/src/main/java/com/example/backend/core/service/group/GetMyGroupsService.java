package com.example.backend.core.service.group;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.Group;
import com.example.backend.core.entity.group.GroupMember;
import com.example.backend.core.entity.group.GroupMembershipSummary;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GetMyGroupsService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;

    public List<GroupMembershipSummary> execute(User currentUser) {
        List<GroupMember> memberships =
                groupMemberRepository.findByUserIdAndStatus(currentUser.getId(), GroupMemberStatus.ACTIVE);

        List<Long> groupIds = memberships.stream()
                .map(GroupMember::getGroupId)
                .toList();

        Map<Long, GroupMember> membershipByGroupId = memberships.stream()
                .collect(Collectors.toMap(GroupMember::getGroupId, Function.identity()));

        List<Group> groups = groupIds.isEmpty()
                ? List.of()
                : groupRepository.findAllByIds(groupIds);

        return groups.stream()
                .map(group -> GroupMembershipSummary.builder()
                        .group(group)
                        .myRole(membershipByGroupId.get(group.getId()).getRole())
                        .memberCount(groupMemberRepository.countByGroupIdAndStatus(group.getId(), GroupMemberStatus.ACTIVE))
                        .build())
                .sorted(Comparator.comparing((GroupMembershipSummary item) -> item.getGroup().getCreatedAt()).reversed())
                .toList();
    }
}
