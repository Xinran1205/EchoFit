package com.example.trainingecho.reminder;

import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.reminder.dto.ReminderConfigResponse;
import com.example.trainingecho.reminder.dto.UpdateReminderConfigRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reminder")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping("/config")
    public ApiResponse<ReminderConfigResponse> getConfig() {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(reminderService.getConfig(userId));
    }

    @PutMapping("/config")
    public ApiResponse<ReminderConfigResponse> updateConfig(
        @Valid @RequestBody UpdateReminderConfigRequest request
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(reminderService.updateConfig(userId, request));
    }
}
