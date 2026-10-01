package com.example.backend.presentation.controller;

import com.example.backend.core.repository.UserRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupMemberRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.group_user.SpringDataGroupRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GroupPhaseOneTwoIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SpringDataGroupRepository groupRepository;

    @Autowired
    private SpringDataGroupMemberRepository groupMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void createGroup_createsLeaderMembershipAndReturnsGroup() throws Exception {
        String token = loginAndGetToken("user@gmail.com", "user123");

        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Nhom Ban Cuoi Tuan",
                                  "description": "Da ban thu 7"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nhom Ban Cuoi Tuan"))
                .andExpect(jsonPath("$.myRole").value("LEADER"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        Long groupId = json.get("id").asLong();
        Long currentUserId = userRepository.findByEmail("user@gmail.com").orElseThrow().getId();

        assertThat(groupRepository.findById(groupId)).isPresent();
        assertThat(groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)).isPresent();
    }

    @Test
    void getMyGroups_returnsCreatedGroupForActiveMember() throws Exception {
        createGroupAndReturnId("Nhom Cua Toi");
        String token = loginAndGetToken("user@gmail.com", "user123");

        mockMvc.perform(get("/api/groups/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Nhom Cua Toi"))
                .andExpect(jsonPath("$[0].myRole").value("LEADER"));
    }

    @Test
    void inviteFlow_generateValidateJoin_worksForLeaderAndInvitedUser() throws Exception {
        Long groupId = createGroupAsUserAndReturnId("Nhom Invite");
        String userToken = loginAndGetToken("user@gmail.com", "user123");
        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");

        String inviteResponse = mockMvc.perform(post("/api/groups/{groupId}/invites", groupId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "clientBaseUrl": "http://localhost:3000"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inviteLink").value(org.hamcrest.Matchers.containsString("/groups/invite?code=")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String code = objectMapper.readTree(inviteResponse).get("code").asText();

        mockMvc.perform(get("/api/groups/invites/{code}", code)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupName").value("Nhom Invite"))
                .andExpect(jsonPath("$.alreadyMember").value(false));

        mockMvc.perform(post("/api/groups/invites/{code}/join", code)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.myRole").value("MEMBER"))
                .andExpect(jsonPath("$.name").value("Nhom Invite"));

        mockMvc.perform(get("/api/groups/invites/{code}", code)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alreadyMember").value(true));
    }

    @Test
    void generateInvite_blocksNonLeader() throws Exception {
        Long groupId = createGroupAsUserAndReturnId("Nhom Khoa Quyen");
        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");

        mockMvc.perform(post("/api/groups/{groupId}/invites", groupId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateGroup_blocksNonLeader() throws Exception {
        Long groupId = createGroupAsUserAndReturnId("Nhom Update");
        String ownerToken = loginAndGetToken("owner@gmail.com", "owner123");

        mockMvc.perform(put("/api/groups/{groupId}", groupId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Nhom Update Moi",
                                  "description": "abc"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    private Long createGroupAndReturnId(String name) throws Exception {
        String token = loginAndGetToken("user@gmail.com", "user123");

        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "description": "Mo ta"
                                }
                                """.formatted(name)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createGroupAsUserAndReturnId(String name) throws Exception {
        String token = loginAndGetToken("user@gmail.com", "user123");

        String response = mockMvc.perform(post("/api/groups")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "%s",
                                  "description": "Mo ta"
                                }
                                """.formatted(name)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
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
