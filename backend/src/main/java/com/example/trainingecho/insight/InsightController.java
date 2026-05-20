package com.example.trainingecho.insight;

import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.insight.dto.InsightEchoPageResponse;
import com.example.trainingecho.insight.dto.InsightSummaryResponse;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/insights")
public class InsightController {

    private final InsightService insightService;

    public InsightController(InsightService insightService) {
        this.insightService = insightService;
    }

    @GetMapping("/summary")
    public ApiResponse<InsightSummaryResponse> getSummary(
        @RequestParam(defaultValue = "week") String rangeType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(insightService.getSummary(userId, rangeType, startDate, endDate));
    }

    @GetMapping("/echoes")
    public ApiResponse<InsightEchoPageResponse> getEchoes(
        @RequestParam(defaultValue = "week") String rangeType,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(
            insightService.getEchoPage(userId, rangeType, startDate, endDate, page, pageSize)
        );
    }
}
