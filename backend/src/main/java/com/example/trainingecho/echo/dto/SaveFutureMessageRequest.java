package com.example.trainingecho.echo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveFutureMessageRequest(
    @NotBlank(message = "记录 ID 不能为空")
    String recordId,
    @NotBlank(message = "请输入未来话")
    @Size(max = 50, message = "未来话最多 50 字")
    String content
) {
}
