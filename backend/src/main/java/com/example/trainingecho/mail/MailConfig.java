package com.example.trainingecho.mail;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailConfig {

    @Bean
    public EmailSender emailSender() {
        return new NoopEmailSender();
    }
}
