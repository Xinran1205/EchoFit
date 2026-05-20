package com.example.trainingecho.training.dto;

import java.util.List;

public record MonthRecordsResponse(
    String month,
    List<TrainingRecordResponse> records,
    List<RestDayResponse> restDays
) {
}
