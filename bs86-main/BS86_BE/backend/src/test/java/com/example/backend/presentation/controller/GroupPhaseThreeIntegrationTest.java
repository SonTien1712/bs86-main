package com.example.backend.presentation.controller;

import com.example.backend.core.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GroupPhaseThreeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void membersListAndRemoveMember_workForLeader() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Member Test");
        String inviteCode = generateInviteCode(groupId, "user@gmail.com", "user123");
        joinByInvite(inviteCode, "owner@gmail.com", "owner123");

        String leaderToken = loginAndGetToken("user@gmail.com", "user123");

        mockMvc.perform(get("/api/groups/{groupId}/members", groupId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].userEmail").exists());

        mockMvc.perform(post("/api/groups/{groupId}/members/{memberUserId}/remove", groupId, getUserIdByEmail("owner@gmail.com"))
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Member removed successfully"));

        mockMvc.perform(get("/api/groups/{groupId}/members", groupId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void activeMemberCanLeaveButLeaderCannotLeaveBeforeTransfer() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Leave Test");
        String inviteCode = generateInviteCode(groupId, "user@gmail.com", "user123");
        joinByInvite(inviteCode, "owner@gmail.com", "owner123");

        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");
        String leaderToken = loginAndGetToken("user@gmail.com", "user123");

        mockMvc.perform(post("/api/groups/{groupId}/leave", groupId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Left group successfully"));

        mockMvc.perform(get("/api/groups/{groupId}", groupId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/groups/{groupId}/leave", groupId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Leader must transfer leadership or disband group before leaving"));
    }

    @Test
    void transferLeader_thenOldLeaderCanLeave() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Transfer Test");
        String inviteCode = generateInviteCode(groupId, "user@gmail.com", "user123");
        joinByInvite(inviteCode, "owner@gmail.com", "owner123");

        String leaderToken = loginAndGetToken("user@gmail.com", "user123");
        Long ownerUserId = getUserIdByEmail("owner@gmail.com");

        mockMvc.perform(post("/api/groups/{groupId}/transfer-leader", groupId)
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "targetUserId": %d
                                }
                                """.formatted(ownerUserId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Leadership transferred successfully"));

        mockMvc.perform(post("/api/groups/{groupId}/leave", groupId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Left group successfully"));
    }

    @Test
    void nonMemberCannotViewMembers() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Security Test");
        String outsiderToken = loginAndGetToken("owner2@gmail.com", "owner123");

        mockMvc.perform(get("/api/groups/{groupId}/members", groupId)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
    }

    private Long createGroupAs(String email, String password, String name) throws Exception {
        String token = loginAndGetToken(email, password);
        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "description": "Mo ta"
                                }
                                """.formatted(name)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private String generateInviteCode(Long groupId, String email, String password) throws Exception {
        String token = loginAndGetToken(email, password);
        String response = mockMvc.perform(post("/api/groups/{groupId}/invites", groupId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("code").asText();
    }

    private void joinByInvite(String code, String email, String password) throws Exception {
        String token = loginAndGetToken(email, password);
        mockMvc.perform(post("/api/groups/invites/{code}/join", code)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).path("data").path("token").asText();
    }

    private Long getUserIdByEmail(String email) throws Exception {
        return userRepository.findByEmail(email).orElseThrow().getId();
    }
}
