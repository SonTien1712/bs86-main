package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupMembershipSummary;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.group.CreateGroupService;
import com.example.backend.core.service.group.DisbandGroupService;
import com.example.backend.core.service.group.GetGroupDetailService;
import com.example.backend.core.service.group.GetMyGroupsService;
import com.example.backend.core.service.group.UpdateGroupService;
import com.example.backend.presentation.dto.request.group.CreateGroupRequest;
import com.example.backend.presentation.dto.request.group.UpdateGroupRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.group.GroupDetailResponse;
import com.example.backend.presentation.dto.response.group.GroupResponse;
import com.example.backend.presentation.dto.response.group.MyGroupItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final CurrentUserService currentUserService;
    private final CreateGroupService createGroupService;
    private final GetMyGroupsService getMyGroupsService;
    private final GetGroupDetailService getGroupDetailService;
    private final UpdateGroupService updateGroupService;
    private final DisbandGroupService disbandGroupService;

    @PostMapping
    public GroupResponse createGroup(@RequestBody CreateGroupRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        return toGroupResponse(createGroupService.execute(request, currentUser));
    }

    @GetMapping("/my")
    public List<MyGroupItemResponse> getMyGroups() {
        User currentUser = currentUserService.getCurrentUser();
        return getMyGroupsService.execute(currentUser).stream()
                .map(this::toMyGroupItemResponse)
                .toList();
    }

    @GetMapping("/{groupId}")
    public GroupDetailResponse getGroupDetail(@PathVariable Long groupId) {
        User currentUser = currentUserService.getCurrentUser();
        return toGroupDetailResponse(getGroupDetailService.execute(groupId, currentUser));
    }

    @PutMapping("/{groupId}")
    public GroupDetailResponse updateGroup(
            @PathVariable Long groupId,
            @RequestBody UpdateGroupRequest request
    ) {
        User currentUser = currentUserService.getCurrentUser();
        return toGroupDetailResponse(updateGroupService.execute(groupId, request, currentUser));
    }

    @PostMapping("/{groupId}/disband")
    public ApiResponse disbandGroup(@PathVariable Long groupId) {
        User currentUser = currentUserService.getCurrentUser();
        disbandGroupService.execute(groupId, currentUser);
        return new ApiResponse("Group disbanded successfully", null);
    }

    private GroupResponse toGroupResponse(GroupDetailSummary summary) {
        return GroupResponse.builder()
                .id(summary.getGroup().getId())
                .name(summary.getGroup().getName())
                .description(summary.getGroup().getDescription())
                .leaderId(summary.getGroup().getLeaderId())
                .memberCount(summary.getMemberCount())
                .myRole(summary.getMyRole())
                .status(summary.getGroup().getStatus())
                .build();
    }

    private MyGroupItemResponse toMyGroupItemResponse(GroupMembershipSummary summary) {
        return MyGroupItemResponse.builder()
                .id(summary.getGroup().getId())
                .name(summary.getGroup().getName())
                .description(summary.getGroup().getDescription())
                .memberCount(summary.getMemberCount())
                .myRole(summary.getMyRole())
                .status(summary.getGroup().getStatus())
                .build();
    }

    private GroupDetailResponse toGroupDetailResponse(GroupDetailSummary summary) {
        return GroupDetailResponse.builder()
                .id(summary.getGroup().getId())
                .name(summary.getGroup().getName())
                .description(summary.getGroup().getDescription())
                .leaderId(summary.getGroup().getLeaderId())
                .status(summary.getGroup().getStatus())
                .myRole(summary.getMyRole())
                .memberCount(summary.getMemberCount())
                .createdAt(summary.getGroup().getCreatedAt())
                .updatedAt(summary.getGroup().getUpdatedAt())
                .build();
    }
}
