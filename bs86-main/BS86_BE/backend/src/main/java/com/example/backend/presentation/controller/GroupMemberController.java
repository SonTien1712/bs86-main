package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.member.GetGroupMembersService;
import com.example.backend.core.service.member.LeaveGroupService;
import com.example.backend.core.service.member.RemoveMemberService;
import com.example.backend.core.service.member.TransferLeaderService;
import com.example.backend.presentation.dto.request.member.TransferLeaderRequest;
import com.example.backend.presentation.dto.response.ApiResponse;
import com.example.backend.presentation.dto.response.member.GroupMemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupMemberController {

    private final CurrentUserService currentUserService;
    private final GetGroupMembersService getGroupMembersService;
    private final LeaveGroupService leaveGroupService;
    private final RemoveMemberService removeMemberService;
    private final TransferLeaderService transferLeaderService;

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> getGroupMembers(@PathVariable Long groupId) {
        User currentUser = currentUserService.getCurrentUser();
        return getGroupMembersService.execute(groupId, currentUser);
    }

    @PostMapping("/{groupId}/leave")
    public ApiResponse leaveGroup(@PathVariable Long groupId) {
        User currentUser = currentUserService.getCurrentUser();
        leaveGroupService.execute(groupId, currentUser);
        return new ApiResponse("Left group successfully", null);
    }

    @PostMapping("/{groupId}/members/{memberUserId}/remove")
    public ApiResponse removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberUserId
    ) {
        User currentUser = currentUserService.getCurrentUser();
        removeMemberService.execute(groupId, memberUserId, currentUser);
        return new ApiResponse("Member removed successfully", null);
    }

    @PostMapping("/{groupId}/transfer-leader")
    public ApiResponse transferLeader(
            @PathVariable Long groupId,
            @RequestBody TransferLeaderRequest request
    ) {
        User currentUser = currentUserService.getCurrentUser();
        transferLeaderService.execute(groupId, request.getTargetUserId(), currentUser);
        return new ApiResponse("Leadership transferred successfully", null);
    }
}
