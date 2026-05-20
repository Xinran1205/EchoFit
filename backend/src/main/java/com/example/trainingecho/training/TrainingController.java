package com.example.trainingecho.training;

import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.training.dto.CreateRestDayRequest;
import com.example.trainingecho.training.dto.CreateTrainingRecordRequest;
import com.example.trainingecho.training.dto.CreateTrainingRecordResponse;
import com.example.trainingecho.training.dto.LatestWeightResponse;
import com.example.trainingecho.training.dto.MonthRecordsResponse;
import com.example.trainingecho.training.dto.RestDayResponse;
import com.example.trainingecho.training.dto.TrainingRecordResponse;
import com.example.trainingecho.training.dto.UpdateTrainingRecordRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/training-records")
public class TrainingController {

    private final TrainingRecordService trainingRecordService;

    public TrainingController(TrainingRecordService trainingRecordService) {
        this.trainingRecordService = trainingRecordService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CreateTrainingRecordResponse> createRecord(
        @RequestPart("payload") @Valid CreateTrainingRecordRequest request,
        @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.createRecord(userId, request, photos));
    }

    @PutMapping(path = "/{recordId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TrainingRecordResponse> updateRecord(
        @PathVariable String recordId,
        @RequestPart("payload") @Valid UpdateTrainingRecordRequest request,
        @RequestParam(value = "keptPhotoIds", required = false) List<String> keptPhotoIds,
        @RequestPart(value = "photos", required = false) List<MultipartFile> photos
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(
            trainingRecordService.updateRecord(userId, recordId, request, keptPhotoIds, photos)
        );
    }

    @PostMapping("/rest-days")
    public ApiResponse<RestDayResponse> createRestDay(
        @Valid @RequestBody CreateRestDayRequest request
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.createRestDay(userId, request));
    }

    @GetMapping("/by-date")
    public ApiResponse<TrainingRecordResponse> getByDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.getRecordByDate(userId, date));
    }

    @GetMapping("/{recordId}")
    public ApiResponse<TrainingRecordResponse> getById(@PathVariable String recordId) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.getRecordById(userId, recordId));
    }

    @GetMapping("/month")
    public ApiResponse<MonthRecordsResponse> getMonthRecords(
        @RequestParam
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "月份格式需为 YYYY-MM")
        String month
    ) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.getMonthRecords(userId, month));
    }

    @GetMapping("/latest-weight")
    public ApiResponse<LatestWeightResponse> getLatestWeight() {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(trainingRecordService.getLatestWeight(userId));
    }
}
