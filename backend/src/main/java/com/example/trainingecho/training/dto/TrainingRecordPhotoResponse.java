package com.example.trainingecho.training.dto;

public record TrainingRecordPhotoResponse(
    String id,
    String originalFilename,
    String mimeType,
    long fileSize,
    String downloadPath
) {
}
