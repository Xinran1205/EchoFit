package com.example.trainingecho.training.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateRestDayRequest(
    @NotNull(message = "请选择休息日期")
    LocalDate date,
    @Size(max = 100, message = "休息备注最多 100 字")
    String note
) {
}
