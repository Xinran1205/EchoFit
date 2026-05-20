package com.example.trainingecho.insight;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.insight.dto.InsightEchoExcerptResponse;
import com.example.trainingecho.insight.dto.InsightEchoPageResponse;
import com.example.trainingecho.insight.dto.InsightSummaryResponse;
import com.example.trainingecho.training.TrainingPart;
import com.example.trainingecho.training.TrainingRecordEntity;
import com.example.trainingecho.training.TrainingRecordMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class InsightService {

    private static final int ECHO_PREVIEW_LIMIT = 3;
    private static final int DEFAULT_ECHO_PAGE_SIZE = 10;
    private static final int MAX_ECHO_PAGE_SIZE = 20;

    private final TrainingRecordMapper trainingRecordMapper;
    private final InsightMapper insightMapper;
    private final ObjectMapper objectMapper;

    public InsightService(
        TrainingRecordMapper trainingRecordMapper,
        InsightMapper insightMapper,
        ObjectMapper objectMapper
    ) {
        this.trainingRecordMapper = trainingRecordMapper;
        this.insightMapper = insightMapper;
        this.objectMapper = objectMapper;
    }

    public InsightSummaryResponse getSummary(
        Long userId,
        String rangeType,
        LocalDate startDate,
        LocalDate endDate
    ) {
        InsightRange range = resolveRange(rangeType, startDate, endDate);
        List<TrainingRecordEntity> records = listRecords(userId, range);
        int totalDurationMinutes = records.stream()
            .map(TrainingRecordEntity::getDurationMinutes)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();
        long totalMessages = insightMapper.countFutureMessages(userId, range.startDate(), range.endDate());
        List<InsightEchoExcerptResponse> excerpts = totalMessages == 0
            ? List.of()
            : mapEchoRows(
                insightMapper.selectFutureMessagePage(
                    userId,
                    range.startDate(),
                    range.endDate(),
                    0,
                    ECHO_PREVIEW_LIMIT
                )
            );

        return new InsightSummaryResponse(
            range.rangeType(),
            range.startDate().toString(),
            range.endDate().toString(),
            new InsightSummaryResponse.Overview(records.size(), totalDurationMinutes),
            buildPartCounts(records),
            new InsightSummaryResponse.EchoPreview(totalMessages, excerpts)
        );
    }

    public InsightEchoPageResponse getEchoPage(
        Long userId,
        String rangeType,
        LocalDate startDate,
        LocalDate endDate,
        Integer page,
        Integer pageSize
    ) {
        InsightRange range = resolveRange(rangeType, startDate, endDate);
        int safePageSize = sanitizePageSize(pageSize);
        long totalMessages = insightMapper.countFutureMessages(userId, range.startDate(), range.endDate());
        int totalPages = totalMessages == 0
            ? 0
            : (int) ((totalMessages + safePageSize - 1) / safePageSize);
        int safePage = totalPages == 0
            ? 1
            : Math.min(Math.max(page == null ? 1 : page, 1), totalPages);
        long offset = (long) (safePage - 1) * safePageSize;
        List<InsightEchoExcerptResponse> items = totalMessages == 0
            ? List.of()
            : mapEchoRows(
                insightMapper.selectFutureMessagePage(
                    userId,
                    range.startDate(),
                    range.endDate(),
                    offset,
                    safePageSize
                )
            );

        return new InsightEchoPageResponse(
            range.rangeType(),
            range.startDate().toString(),
            range.endDate().toString(),
            totalMessages,
            safePage,
            safePageSize,
            totalPages,
            items
        );
    }

    private List<TrainingRecordEntity> listRecords(Long userId, InsightRange range) {
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .between(TrainingRecordEntity::getTrainingDate, range.startDate(), range.endDate())
            .orderByAsc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId);
        return trainingRecordMapper.selectList(queryWrapper);
    }

    private InsightRange resolveRange(String rawRangeType, LocalDate startDate, LocalDate endDate) {
        String rangeType = rawRangeType == null || rawRangeType.isBlank() ? "week" : rawRangeType.trim();
        LocalDate today = LocalDate.now();

        return switch (rangeType) {
            case "week" -> {
                LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
                yield new InsightRange("week", weekStart, weekEnd);
            }
            case "month" -> new InsightRange(
                "month",
                today.with(TemporalAdjusters.firstDayOfMonth()),
                today.with(TemporalAdjusters.lastDayOfMonth())
            );
            case "custom" -> {
                if (startDate == null || endDate == null) {
                    throw new BizException(
                        ErrorCode.VALIDATION_ERROR,
                        "自定义时间范围需要开始日期和结束日期",
                        HttpStatus.BAD_REQUEST
                    );
                }

                LocalDate safeEndDate = endDate.isAfter(today) ? today : endDate;
                if (startDate.isAfter(today) || startDate.isAfter(safeEndDate)) {
                    throw new BizException(
                        ErrorCode.VALIDATION_ERROR,
                        "自定义时间范围不合法",
                        HttpStatus.BAD_REQUEST
                    );
                }

                yield new InsightRange("custom", startDate, safeEndDate);
            }
            default -> throw new BizException(
                ErrorCode.VALIDATION_ERROR,
                "洞察范围不合法",
                HttpStatus.BAD_REQUEST
            );
        };
    }

    private int sanitizePageSize(Integer pageSize) {
        if (pageSize == null) {
            return DEFAULT_ECHO_PAGE_SIZE;
        }
        return Math.min(Math.max(pageSize, 1), MAX_ECHO_PAGE_SIZE);
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

    private List<InsightEchoExcerptResponse> mapEchoRows(List<InsightEchoExcerptRow> rows) {
        return rows.stream()
            .map((row) -> new InsightEchoExcerptResponse(
                String.valueOf(row.getId()),
                row.getTrainingDate().toString(),
                row.getContent()
            ))
            .toList();
    }

    private List<String> readParts(String partsJson) {
        if (partsJson == null || partsJson.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(partsJson, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new BizException(
                ErrorCode.INTERNAL_ERROR,
                "洞察数据格式异常",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private record InsightRange(
        String rangeType,
        LocalDate startDate,
        LocalDate endDate
    ) {
    }
}
