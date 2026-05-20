package com.example.trainingecho.training.dto;

import java.math.BigDecimal;
import java.util.List;

public record TrainingRecordResponse(
    String id,
    String userId,
    String date,
    List<String> parts,
    Integer durationMinutes,
    String mood,
    BigDecimal weightKg,
    String note,
    List<TrainingRecordPhotoResponse> photos,
    String futureMessagePreview,
    String createdAt,
    String updatedAt
) {
}
