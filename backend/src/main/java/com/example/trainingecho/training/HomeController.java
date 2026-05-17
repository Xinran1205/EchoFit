package com.example.trainingecho.training;

import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.training.dto.HomeSummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/home")
public class HomeController {

    private final TrainingRecordService trainingRecordService;

    public HomeController(TrainingRecordService trainingRecordService) {
        this.trainingRecordService = trainingRecordService;
    }

    @GetMapping("/summary")
    public ApiResponse<HomeSummaryResponse> summary() {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.getHomeSummary(userId));
    }
}
