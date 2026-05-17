package com.example.trainingecho.training.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record UpdateTrainingRecordRequest(
    @NotEmpty(message = "请选择训练部位")
    List<@NotBlank(message = "训练部位不能为空") String> parts,
    @NotNull(message = "请选择训练时长")
    @Min(value = 5, message = "训练时长需在 5 到 300 分钟之间")
    @Max(value = 300, message = "训练时长需在 5 到 300 分钟之间")
    Integer durationMinutes,
    @NotBlank(message = "请选择今日状态")
    String mood,
    @DecimalMin(value = "35.0", message = "体重范围不正确")
    @DecimalMax(value = "150.0", message = "体重范围不正确")
    BigDecimal weightKg,
    @Size(max = 100, message = "备注最多 100 字")
    String note
) {
}
