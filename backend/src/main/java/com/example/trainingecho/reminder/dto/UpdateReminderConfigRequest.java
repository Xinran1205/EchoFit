package com.example.trainingecho.reminder.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateReminderConfigRequest(
    @NotNull(message = "请提供提醒开关状态")
    Boolean enabled
) {
}
