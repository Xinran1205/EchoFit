package com.example.trainingecho.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateUserProfileRequest(
    @NotBlank(message = "性别不能为空")
    @Pattern(regexp = "male|female", message = "性别不合法")
    String gender
) {
}
