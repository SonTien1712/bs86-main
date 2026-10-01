package com.example.backend.infrastructure.config;

import com.example.backend.core.entity.User;
import com.example.backend.core.enums.groups.GroupMemberStatus;
import com.example.backend.core.enums.groups.GroupStatus;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.core.repository.group.GroupMemberRepository;
import com.example.backend.core.repository.group.GroupRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.PassConversationEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.PassConversationJpaRepository;
import com.example.backend.infrastructure.security.jwt.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Pattern GROUP_TOPIC_PATTERN = Pattern.compile("^/topic/groups/(\\d+)$");
    private static final Pattern PASS_CONVERSATION_TOPIC_PATTERN = Pattern.compile("^/topic/pass-conversations/(\\d+)$");

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PassConversationJpaRepository passConversationJpaRepository;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null || accessor.getCommand() == null) {
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    accessor.setUser(buildAuthentication(accessor));
                    return message;
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    Principal principal = accessor.getUser();
                    if (principal == null) {
                        throw new IllegalArgumentException("Authentication is required for websocket subscriptions");
                    }

                    String destination = accessor.getDestination();
                    if (destination == null) {
                        return message;
                    }

                    User user = userRepository.findByEmail(principal.getName())
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));

                    Matcher groupMatcher = GROUP_TOPIC_PATTERN.matcher(destination);
                    if (groupMatcher.matches()) {
                        validateGroupSubscription(groupMatcher, user);
                        return message;
                    }

                    Matcher passConversationMatcher = PASS_CONVERSATION_TOPIC_PATTERN.matcher(destination);
                    if (passConversationMatcher.matches()) {
                        validatePassConversationSubscription(passConversationMatcher, user);
                    }
                }

                return message;
            }
        });
    }

    private void validateGroupSubscription(Matcher matcher, User user) {
        Long groupId = Long.parseLong(matcher.group(1));

        var group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new IllegalArgumentException("Only active groups can be subscribed");
        }

        var member = groupMemberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("You are not allowed to subscribe to this group"));

        if (member.getStatus() != GroupMemberStatus.ACTIVE) {
            throw new IllegalArgumentException("You are not allowed to subscribe to this group");
        }
    }

    private void validatePassConversationSubscription(Matcher matcher, User user) {
        Long conversationId = Long.parseLong(matcher.group(1));
        PassConversationEntity conversation = passConversationJpaRepository.findWithDetailsById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Pass conversation not found"));

        boolean isOwner = conversation.getOwnerUser() != null
                && conversation.getOwnerUser().getId().equals(user.getId());
        boolean isInterestedUser = conversation.getInterestedUser() != null
                && conversation.getInterestedUser().getId().equals(user.getId());

        if (!isOwner && !isInterestedUser) {
            throw new IllegalArgumentException("You are not allowed to subscribe to this pass conversation");
        }
    }

    private Principal buildAuthentication(StompHeaderAccessor accessor) {
        String header = resolveAuthorizationHeader(accessor);
        if (header == null || !header.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header is required");
        }

        String token = header.substring(7);
        Claims claims = jwtUtil.parse(token);
        String email = claims.getSubject();
        Object rawRoles = claims.get("roles");

        List<String> roles;
        if (rawRoles instanceof List<?> list) {
            roles = list.stream().map(String::valueOf).toList();
        } else if (rawRoles instanceof String role) {
            roles = List.of(role);
        } else {
            roles = List.of();
        }

        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList()
        );
    }

    private String resolveAuthorizationHeader(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            authHeaders = accessor.getNativeHeader("authorization");
        }
        return (authHeaders == null || authHeaders.isEmpty()) ? null : authHeaders.getFirst();
    }
}
