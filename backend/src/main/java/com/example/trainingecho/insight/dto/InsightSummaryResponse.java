package com.example.trainingecho.insight.dto;

import java.util.List;
import java.util.Map;

public record InsightSummaryResponse(
    String rangeType,
    String startDate,
    String endDate,
    Overview overview,
    Map<String, Integer> partCounts,
    EchoPreview echoPreview
) {

    public record Overview(
        int trainingDays,
        int totalDurationMinutes
    ) {
    }

    public record EchoPreview(
        long totalMessages,
        List<InsightEchoExcerptResponse> excerpts
    ) {
    }
}
