package com.git.techocean.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    SecretKey appSigningKey(@Value("${APP_AUTH_SECRET:}") String configuredSecret, Environment env) {
        boolean production = java.util.Arrays.asList(env.getActiveProfiles()).contains("production");
        String secret = configuredSecret;
        if (secret == null || secret.isBlank()) {
            if (production) throw new IllegalStateException("APP_AUTH_SECRET is required in production");
            secret = UUID.randomUUID() + UUID.randomUUID().toString();
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalStateException("APP_AUTH_SECRET must be at least 32 bytes");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
    @Bean JwtEncoder jwtEncoder(SecretKey key) { return new NimbusJwtEncoder(new ImmutableSecret<>(key)); }
    @Bean JwtDecoder jwtDecoder(SecretKey key) {
        return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            return role == null ? java.util.List.of() : java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role));
        });
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/setup", "/admin/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/clientes", "/mensagens/contatos", "/agendamentos").permitAll()
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        .requestMatchers("/clientes/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/**").hasAnyRole("ADMIN", "SUPERVISOR")
                        .requestMatchers(HttpMethod.GET, "/**").hasAnyRole("ADMIN", "SUPERVISOR", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.POST, "/**").hasAnyRole("ADMIN", "SUPERVISOR", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.PUT, "/**").hasAnyRole("ADMIN", "SUPERVISOR", "FUNCIONARIO")
                        .requestMatchers(HttpMethod.PATCH, "/**").hasAnyRole("ADMIN", "SUPERVISOR", "FUNCIONARIO")
                        .anyRequest().denyAll())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(converter)));
        return http.build();
    }
}
