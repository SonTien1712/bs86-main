package com.example.backend.presentation.controller;

import com.example.backend.core.entity.User;
import com.example.backend.core.entity.group.GroupDetailSummary;
import com.example.backend.core.entity.group.GroupInvite;
import com.example.backend.core.entity.group.GroupInvitePreview;
import com.example.backend.core.service.CurrentUserService;
import com.example.backend.core.service.invite.GenerateInviteLinkService;
import com.example.backend.core.service.invite.ValidateInviteCodeService;
import com.example.backend.core.service.member.JoinGroupByCodeService;
import com.example.backend.presentation.dto.request.invite.GenerateInviteRequest;
import com.example.backend.presentation.dto.response.group.GroupDetailResponse;
import com.example.backend.presentation.dto.response.invite.InviteLinkResponse;
import com.example.backend.presentation.dto.response.invite.InviteValidationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupInviteController {

    private final CurrentUserService currentUserService;
    private final GenerateInviteLinkService generateInviteLinkService;
    private final ValidateInviteCodeService validateInviteCodeService;
    private final JoinGroupByCodeService joinGroupByCodeService;

    @PostMapping("/{groupId}/invites")
    public InviteLinkResponse generateInvite(
            @PathVariable Long groupId,
            @RequestBody(required = false) GenerateInviteRequest request
    ) {
        User currentUser = currentUserService.getCurrentUser();
        GroupInvite invite = generateInviteLinkService.execute(groupId, currentUser);

        String baseUrl = request != null && request.getClientBaseUrl() != null && !request.getClientBaseUrl().isBlank()
                ? request.getClientBaseUrl().replaceAll("/$", "")
                : "";

        String inviteLink = baseUrl.isBlank()
                ? "/groups/invite?code=" + invite.getCode()
                : baseUrl + "/groups/invite?code=" + invite.getCode();

        return InviteLinkResponse.builder()
                .code(invite.getCode())
                .inviteLink(inviteLink)
                .expiredAt(invite.getExpiredAt())
                .build();
    }

    @GetMapping("/invites/{code}")
    public InviteValidationResponse validateInvite(@PathVariable String code) {
        User currentUser = currentUserService.getCurrentUser();
        GroupInvitePreview preview = validateInviteCodeService.execute(code, currentUser);

        return InviteValidationResponse.builder()
                .code(preview.getInvite().getCode())
                .groupId(preview.getGroup().getId())
                .groupName(preview.getGroup().getName())
                .groupDescription(preview.getGroup().getDescription())
                .memberCount(preview.getMemberCount())
                .leaderEmail(preview.getLeaderEmail())
                .inviteStatus(preview.getInvite().getStatus())
                .expiredAt(preview.getInvite().getExpiredAt())
                .alreadyMember(preview.isAlreadyMember())
                .build();
    }

    @PostMapping("/invites/{code}/join")
    public GroupDetailResponse joinByInvite(@PathVariable String code) {
        User currentUser = currentUserService.getCurrentUser();
        return toGroupDetailResponse(joinGroupByCodeService.execute(code, currentUser));
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
