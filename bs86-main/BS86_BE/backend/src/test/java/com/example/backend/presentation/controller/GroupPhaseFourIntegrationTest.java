package com.example.backend.presentation.controller;

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
class GroupPhaseFourIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void activeMemberCanSendAndReadMessagesWithPagination() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Chat Test");
        String inviteCode = generateInviteCode(groupId, "user@gmail.com", "user123");
        joinByInvite(inviteCode, "owner@gmail.com", "owner123");

        String leaderToken = loginAndGetToken("user@gmail.com", "user123");
        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");

        mockMvc.perform(post("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Tin nhan so 1"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderEmail").value("user@gmail.com"));

        mockMvc.perform(post("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Tin nhan so 2"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderEmail").value("owner@gmail.com"));

        String latestPage = mockMvc.perform(get("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + leaderToken)
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].content").value("Tin nhan so 2"))
                .andExpect(jsonPath("$.hasMore").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long nextBeforeMessageId = objectMapper.readTree(latestPage).get("nextBeforeMessageId").asLong();

        mockMvc.perform(get("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + leaderToken)
                        .param("limit", "1")
                        .param("beforeMessageId", String.valueOf(nextBeforeMessageId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].content").value("Tin nhan so 1"));
    }

    @Test
    void nonMemberAndLeftMemberCannotUseChatApis() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Security Chat");
        String inviteCode = generateInviteCode(groupId, "user@gmail.com", "user123");
        joinByInvite(inviteCode, "owner@gmail.com", "owner123");

        String outsiderToken = loginAndGetToken("owner2@gmail.com", "owner123");
        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");

        mockMvc.perform(get("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/groups/{groupId}/leave", groupId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Toi da roi nhom"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void disbandedGroupCannotBeChatted() throws Exception {
        Long groupId = createGroupAs("user@gmail.com", "user123", "Nhom Disband Chat");
        String leaderToken = loginAndGetToken("user@gmail.com", "user123");

        mockMvc.perform(post("/api/groups/{groupId}/disband", groupId)
                        .header("Authorization", "Bearer " + leaderToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/groups/{groupId}/messages", groupId)
                        .header("Authorization", "Bearer " + leaderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "content": "Khong gui duoc"
                                }
                                """))
                .andExpect(status().isBadRequest());
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
}
