package com.example.backend.infrastructure.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                                .requestMatchers("/", "/healthz").permitAll()
                                .requestMatchers("/api/auth/**").permitAll()

                                .requestMatchers("/ws/**").permitAll()

                                .requestMatchers("/api/public/**").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/payments/vnpay/return").permitAll()
                                .requestMatchers(HttpMethod.GET, "/api/payments/callback").permitAll()

                                .requestMatchers(HttpMethod.GET, "/api/courts/*/slots").permitAll()
                                .requestMatchers("/api/bookings/**").authenticated()
                                .requestMatchers("/api/transactions/**").authenticated()
                                .requestMatchers("/api/customer-profile/**").authenticated()

                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                                // Explore module — public endpoints (no token required)
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/posts").permitAll()
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/pass-posts").permitAll()
                                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/fields/*/available-slots").permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/media/upload").permitAll()

                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                .requestMatchers("/api/owner/**").hasRole("OWNER")
//
                                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        var config = new org.springframework.web.cors.CorsConfiguration();
        config.setAllowedOriginPatterns(java.util.List.of("*"));
        config.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(java.util.List.of("*"));
        config.setAllowCredentials(true);

        var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}