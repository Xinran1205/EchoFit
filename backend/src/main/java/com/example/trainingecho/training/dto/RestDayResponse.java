package com.example.trainingecho.training.dto;

public record RestDayResponse(
    String id,
    String userId,
    String date,
    String note,
    String createdAt,
    String updatedAt
) {
}
