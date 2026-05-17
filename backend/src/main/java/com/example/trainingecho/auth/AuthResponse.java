package com.example.trainingecho.auth;

public record AuthResponse(String token, CurrentUser user) {
}
