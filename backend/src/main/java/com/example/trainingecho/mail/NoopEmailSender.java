package com.example.trainingecho.mail;

public class NoopEmailSender implements EmailSender {

    @Override
    public void sendText(String to, String subject, String content) {
        // No-op in local and Stage 2 baseline.
    }
}
