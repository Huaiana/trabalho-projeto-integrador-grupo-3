package com.git.techocean.config;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Nullable
    private SessionAuditInterceptor sessionAuditInterceptor;

    public CorsConfig(ObjectProvider<SessionAuditInterceptor> sessionAuditInterceptor) {
        this.sessionAuditInterceptor = sessionAuditInterceptor.getIfAvailable();
    }

    private static final Set<String> BASE_ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:8080",
            "https://*.lovable.app",
            "https://*.lovable.dev",
            "https://*.techocean.pages.dev",
            "https://techocean.pages.dev");

    @Value("${CORS_ALLOWED_ORIGIN_PATTERNS:}")
    private String allowedOriginPatterns;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        Set<String> allowedOrigins = new LinkedHashSet<>(BASE_ALLOWED_ORIGINS);
        if (allowedOriginPatterns != null && !allowedOriginPatterns.isBlank()) {
            Arrays.stream(allowedOriginPatterns.split(","))
                    .map((@NonNull String origin) -> origin.trim())
                    .filter(origin -> !origin.isEmpty())
                    .forEach(allowedOrigins::add);
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(toOriginPatterns(allowedOrigins))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @NonNull
    private String[] toOriginPatterns(Set<String> origins) {
        return origins.toArray(String[]::new);
    }

    @Override public void addInterceptors(
            @NonNull org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        if (sessionAuditInterceptor != null) registry.addInterceptor(sessionAuditInterceptor);
    }

    public @Nullable SessionAuditInterceptor getSessionAuditInterceptor() {
        return sessionAuditInterceptor;
    }

    public void setSessionAuditInterceptor(@Nullable SessionAuditInterceptor sessionAuditInterceptor) {
        this.sessionAuditInterceptor = sessionAuditInterceptor;
    }
}
