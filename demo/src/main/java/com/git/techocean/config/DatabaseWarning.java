package com.git.techocean.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class DatabaseWarning {
    private static final Logger log = LoggerFactory.getLogger(DatabaseWarning.class);

    @Value("${spring.datasource.url:}")
    private String url;

    @EventListener(ApplicationReadyEvent.class)
    void warnIfVolatile() {
        if (url == null || url.isBlank() || url.startsWith("jdbc:h2")) {
            log.error("BANCO VOLATIL (H2 em memoria): todos os dados serao perdidos a cada deploy/reinicio. "
                    + "Configure SPRING_PROFILES_ACTIVE=production e DB_URL (ou DB_HOST/DB_NAME/DB_USER/DB_PASSWORD) apontando para um PostgreSQL.");
        }
    }
}
