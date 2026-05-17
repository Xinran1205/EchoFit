package com.example.trainingecho.reminder.dto;

public record ReminderConfigResponse(boolean enabled, int remindHour, int remindMinute) {
}
