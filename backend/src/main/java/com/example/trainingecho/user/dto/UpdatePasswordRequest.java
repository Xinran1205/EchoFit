package com.example.trainingecho.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequest(
    @NotBlank(message = "请输入验证码")
    @Pattern(regexp = "\\d{6}", message = "验证码应为 6 位数字")
    String verificationCode,
    @NotBlank(message = "请输入新密码")
    @Size(min = 8, max = 64, message = "密码长度需为 8 到 64 位")
    String newPassword
) {
}
