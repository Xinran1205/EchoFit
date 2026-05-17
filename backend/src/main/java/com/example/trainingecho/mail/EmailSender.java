package com.example.trainingecho.mail;

public interface EmailSender {

    void sendText(String to, String subject, String content);
}
