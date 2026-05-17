package com.example.trainingecho.training;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.echo.EchoMessageEntity;
import com.example.trainingecho.echo.EchoMessageMapper;
import com.example.trainingecho.echo.EchoService;
import com.example.trainingecho.training.dto.CreateTrainingRecordRequest;
import com.example.trainingecho.training.dto.CreateTrainingRecordResponse;
import com.example.trainingecho.training.dto.HomeSummaryResponse;
import com.example.trainingecho.training.dto.LatestWeightResponse;
import com.example.trainingecho.training.dto.MonthRecordsResponse;
import com.example.trainingecho.training.dto.TrainingRecordResponse;
import com.example.trainingecho.training.dto.UpdateTrainingRecordRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingRecordService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final TrainingRecordMapper trainingRecordMapper;
    private final EchoMessageMapper echoMessageMapper;
    private final EchoService echoService;
    private final ObjectMapper objectMapper;

    public TrainingRecordService(
        TrainingRecordMapper trainingRecordMapper,
        EchoMessageMapper echoMessageMapper,
        EchoService echoService,
        ObjectMapper objectMapper
    ) {
        this.trainingRecordMapper = trainingRecordMapper;
        this.echoMessageMapper = echoMessageMapper;
        this.echoService = echoService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CreateTrainingRecordResponse createRecord(Long userId, CreateTrainingRecordRequest request) {
        List<String> parts = normalizeParts(request.parts());
        String mood = normalizeMood(request.mood());
        ensureRecordDateNotInFuture(request.date());
        ensureDateAvailable(userId, request.date());

        TrainingRecordEntity entity = new TrainingRecordEntity();
        entity.setUserId(userId);
        entity.setTrainingDate(request.date());
        entity.setPartsJson(writeParts(parts));
        entity.setDurationMinutes(request.durationMinutes());
        entity.setMood(mood);
        entity.setWeightKg(normalizeWeight(request.weightKg()));
        entity.setNote(normalizeNote(request.note()));

        try {
            trainingRecordMapper.insert(entity);
        } catch (DuplicateKeyException exception) {
            throw new BizException(ErrorCode.CONFLICT, "这一天已有训练记录", HttpStatus.CONFLICT);
        }

        Long echoId = echoService.generateForNewRecord(entity);
        return new CreateTrainingRecordResponse(String.valueOf(entity.getId()), String.valueOf(echoId));
    }

    @Transactional
    public TrainingRecordResponse updateRecord(
        Long userId,
        String recordId,
        UpdateTrainingRecordRequest request
    ) {
        TrainingRecordEntity entity = getRequiredRecord(userId, parseId(recordId));
        entity.setPartsJson(writeParts(normalizeParts(request.parts())));
        entity.setDurationMinutes(request.durationMinutes());
        entity.setMood(normalizeMood(request.mood()));
        entity.setWeightKg(normalizeWeight(request.weightKg()));
        entity.setNote(normalizeNote(request.note()));
        trainingRecordMapper.updateById(entity);
        return toResponse(getRequiredRecord(userId, entity.getId()));
    }

    public TrainingRecordResponse getRecordByDate(Long userId, LocalDate date) {
        return findByDate(userId, date).map(this::toResponse).orElse(null);
    }

    public TrainingRecordResponse getRecordById(Long userId, String recordId) {
        return toResponse(getRequiredRecord(userId, parseId(recordId)));
    }

    public MonthRecordsResponse getMonthRecords(Long userId, String month) {
        YearMonth yearMonth = parseMonth(month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .between(TrainingRecordEntity::getTrainingDate, startDate, endDate)
            .orderByAsc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId);
        List<TrainingRecordResponse> records = trainingRecordMapper.selectList(queryWrapper)
            .stream()
            .map(this::toResponse)
            .toList();
        return new MonthRecordsResponse(month, records);
    }

    public LatestWeightResponse getLatestWeight(Long userId) {
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .isNotNull(TrainingRecordEntity::getWeightKg)
            .orderByDesc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId)
            .last("limit 1");
        TrainingRecordEntity entity = trainingRecordMapper.selectOne(queryWrapper);
        return new LatestWeightResponse(entity != null ? entity.getWeightKg() : null);
    }

    public HomeSummaryResponse getHomeSummary(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(6);
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .between(TrainingRecordEntity::getTrainingDate, startDate, today)
            .orderByAsc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId);
        List<TrainingRecordEntity> records = trainingRecordMapper.selectList(queryWrapper);
        Map<String, Integer> partCounts = buildPartCounts(records);
        int totalDurationMinutes = records.stream()
            .map(TrainingRecordEntity::getDurationMinutes)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();
        return new HomeSummaryResponse(
            today.toString(),
            records.stream().anyMatch((record) -> today.equals(record.getTrainingDate())),
            new HomeSummaryResponse.Last7DaysSummary(records.size(), totalDurationMinutes, partCounts)
        );
    }

    public Optional<TrainingRecordEntity> findByDate(Long userId, LocalDate date) {
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .eq(TrainingRecordEntity::getTrainingDate, date)
            .last("limit 1");
        return Optional.ofNullable(trainingRecordMapper.selectOne(queryWrapper));
    }

    public TrainingRecordEntity getRequiredRecord(Long userId, Long recordId) {
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getId, recordId)
            .eq(TrainingRecordEntity::getUserId, userId)
            .last("limit 1");
        TrainingRecordEntity entity = trainingRecordMapper.selectOne(queryWrapper);
        if (entity == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "训练记录不存在", HttpStatus.NOT_FOUND);
        }
        return entity;
    }

    public List<String> readParts(String partsJson) {
        if (partsJson == null || partsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(partsJson, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new BizException(ErrorCode.INTERNAL_ERROR, "训练记录数据格式异常", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public TrainingRecordResponse toResponse(TrainingRecordEntity entity) {
        String futureMessagePreview = null;
        if (entity.getFutureMessageId() != null) {
            EchoMessageEntity messageEntity = echoMessageMapper.selectById(entity.getFutureMessageId());
            if (messageEntity != null) {
                futureMessagePreview = messageEntity.getContent();
            }
        }
        return new TrainingRecordResponse(
            String.valueOf(entity.getId()),
            String.valueOf(entity.getUserId()),
            entity.getTrainingDate().toString(),
            readParts(entity.getPartsJson()),
            entity.getDurationMinutes(),
            entity.getMood(),
            entity.getWeightKg(),
            entity.getNote(),
            futureMessagePreview,
            formatDateTime(entity.getCreatedAt()),
            formatDateTime(entity.getUpdatedAt())
        );
    }

    private void ensureDateAvailable(Long userId, LocalDate date) {
        if (findByDate(userId, date).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "这一天已有训练记录", HttpStatus.CONFLICT);
        }
    }

    private void ensureRecordDateNotInFuture(LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            throw new BizException(
                ErrorCode.VALIDATION_ERROR,
                "训练日期不能晚于今天",
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private List<String> normalizeParts(List<String> parts) {
        List<String> normalizedParts = parts.stream()
            .map(String::trim)
            .map(String::toLowerCase)
            .distinct()
            .toList();
        if (normalizedParts.isEmpty()) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "请选择训练部位");
        }
        List<String> invalidParts = normalizedParts.stream()
            .filter((part) -> !TrainingPart.contains(part))
            .toList();
        if (!invalidParts.isEmpty()) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "训练部位不合法");
        }
        return normalizedParts;
    }

    private String normalizeMood(String mood) {
        String normalizedMood = mood.trim().toLowerCase();
        if (!TrainingMood.contains(normalizedMood)) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "训练状态不合法");
        }
        return normalizedMood;
    }

    private BigDecimal normalizeWeight(BigDecimal weightKg) {
        if (weightKg == null) {
            return null;
        }
        return weightKg.setScale(1, RoundingMode.HALF_UP);
    }

    private String normalizeNote(String note) {
        if (note == null) {
            return null;
        }
        String trimmed = note.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String writeParts(List<String> parts) {
        try {
            return objectMapper.writeValueAsString(parts);
        } catch (JsonProcessingException exception) {
            throw new BizException(ErrorCode.INTERNAL_ERROR, "训练记录数据格式异常", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Map<String, Integer> buildPartCounts(List<TrainingRecordEntity> records) {
        Map<String, Integer> partCounts = new LinkedHashMap<>();
        for (TrainingPart part : TrainingPart.values()) {
            partCounts.put(part.getValue(), 0);
        }
        for (TrainingRecordEntity record : records) {
            for (String part : readParts(record.getPartsJson())) {
                partCounts.computeIfPresent(part, (key, value) -> value + 1);
            }
        }
        return partCounts;
    }

    private Long parseId(String recordId) {
        try {
            return Long.valueOf(recordId);
        } catch (NumberFormatException exception) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "记录 ID 不合法");
        }
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (Exception exception) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "月份格式需为 YYYY-MM");
        }
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMATTER) : null;
    }
}
