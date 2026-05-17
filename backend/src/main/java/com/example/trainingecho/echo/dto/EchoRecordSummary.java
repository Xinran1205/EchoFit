package com.example.trainingecho.echo.dto;

import java.math.BigDecimal;
import java.util.List;

public record EchoRecordSummary(
    String id,
    String date,
    List<String> parts,
    Integer durationMinutes,
    String mood,
    BigDecimal weightKg
) {
}
