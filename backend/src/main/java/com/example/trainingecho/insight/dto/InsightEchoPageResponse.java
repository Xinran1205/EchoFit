package com.example.trainingecho.insight.dto;

import java.util.List;

public record InsightEchoPageResponse(
    String rangeType,
    String startDate,
    String endDate,
    long totalMessages,
    int page,
    int pageSize,
    int totalPages,
    List<InsightEchoExcerptResponse> items
) {
}
