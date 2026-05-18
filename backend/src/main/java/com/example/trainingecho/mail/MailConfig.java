package com.example.trainingecho.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.util.StringUtils;

@Configuration
public class MailConfig {

    @Bean
    public EmailSender emailSender(
        ObjectProvider<JavaMailSender> javaMailSenderProvider,
        @Value("${app.mail.enabled:false}") boolean mailEnabled,
        @Value("${app.mail.from:}") String configuredFrom,
        @Value("${spring.mail.username:}") String mailUsername
    ) {
        if (!mailEnabled) {
            return new NoopEmailSender();
        }

        JavaMailSender javaMailSender = javaMailSenderProvider.getIfAvailable();
        if (javaMailSender == null) {
            throw new IllegalStateException("Mail is enabled but JavaMailSender is not configured");
        }

        String from = StringUtils.hasText(configuredFrom) ? configuredFrom : mailUsername;
        if (!StringUtils.hasText(from)) {
            throw new IllegalStateException("Mail is enabled but no sender address is configured");
        }

        return new SmtpEmailSender(javaMailSender, from);
    }
}
