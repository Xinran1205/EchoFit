package com.example.trainingecho.echo;

import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.echo.dto.EchoResponse;
import com.example.trainingecho.echo.dto.FutureMessageSavedResponse;
import com.example.trainingecho.echo.dto.SaveFutureMessageRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/echo")
public class EchoController {

    private final EchoService echoService;

    public EchoController(EchoService echoService) {
        this.echoService = echoService;
    }

    @GetMapping("/by-record/{recordId}")
    public ApiResponse<EchoResponse> getByRecord(@PathVariable String recordId) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(echoService.getEchoByRecord(userId, recordId));
    }

    @PostMapping("/future-message")
    public ApiResponse<FutureMessageSavedResponse> saveFutureMessage(
        @Valid @RequestBody SaveFutureMessageRequest request
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(echoService.saveFutureMessage(userId, request));
    }
}
