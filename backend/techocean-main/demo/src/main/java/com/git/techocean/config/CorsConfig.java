package com.git.techocean.config;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Autowired(required = false)
    private SessionAuditInterceptor sessionAuditInterceptor;

    private static final Set<String> BASE_ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:8080",
            "https://*.lovable.app",
            "https://*.lovable.dev",
            "https://techocean-site.onrender.com");

    @Value("${CORS_ALLOWED_ORIGIN_PATTERNS:}")
    private String allowedOriginPatterns;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        Set<String> allowedOrigins = new LinkedHashSet<>(BASE_ALLOWED_ORIGINS);
        if (allowedOriginPatterns != null && !allowedOriginPatterns.isBlank()) {
            Arrays.stream(allowedOriginPatterns.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .forEach(allowedOrigins::add);
        }

        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override public void addInterceptors(org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        if (sessionAuditInterceptor != null) registry.addInterceptor(sessionAuditInterceptor);
    }
}
