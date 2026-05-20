package com.example.trainingecho.training.dto;

import java.util.Map;

public record HomeSummaryResponse(
    String today,
    boolean todayRecorded,
    String todayEntryType,
    String todayRestNote,
    Last7DaysSummary last7Days
) {

    public record Last7DaysSummary(
        int trainingDays,
        int totalDurationMinutes,
        Map<String, Integer> partCounts
    ) {
    }
}
