package com.example.trainingecho.echo;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.echo.dto.EchoPayload;
import com.example.trainingecho.echo.dto.EchoRecordSummary;
import com.example.trainingecho.echo.dto.EchoResponse;
import com.example.trainingecho.echo.dto.FutureMessageSavedResponse;
import com.example.trainingecho.echo.dto.SaveFutureMessageRequest;
import com.example.trainingecho.training.TrainingPart;
import com.example.trainingecho.training.TrainingRecordEntity;
import com.example.trainingecho.training.TrainingRecordMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EchoService {

    private static final List<String> DEFAULT_MESSAGES = List.of(
        "节奏不会一下子成形，但会慢慢留下痕迹。",
        "不必每次都状态最好，回来就很好。",
        "在普通的一天完成训练，也很难得。"
    );

    private final EchoMessageMapper echoMessageMapper;
    private final EchoHistoryMapper echoHistoryMapper;
    private final TrainingRecordMapper trainingRecordMapper;
    private final ObjectMapper objectMapper;

    public EchoService(
        EchoMessageMapper echoMessageMapper,
        EchoHistoryMapper echoHistoryMapper,
        TrainingRecordMapper trainingRecordMapper,
        ObjectMapper objectMapper
    ) {
        this.echoMessageMapper = echoMessageMapper;
        this.echoHistoryMapper = echoHistoryMapper;
        this.trainingRecordMapper = trainingRecordMapper;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Long generateForNewRecord(TrainingRecordEntity record) {
        GeneratedEcho generatedEcho = chooseEcho(record);

        EchoHistoryEntity historyEntity = new EchoHistoryEntity();
        historyEntity.setUserId(record.getUserId());
        historyEntity.setRecordId(record.getId());
        historyEntity.setEchoMessageId(generatedEcho.echoMessageId());
        historyEntity.setSource(generatedEcho.source());
        historyEntity.setContent(generatedEcho.content());
        echoHistoryMapper.insert(historyEntity);

        return historyEntity.getId();
    }

    public EchoResponse getEchoByRecord(Long userId, String recordId) {
        Long parsedRecordId = parseId(recordId);
        TrainingRecordEntity record = getRequiredRecord(userId, parsedRecordId);
        LambdaQueryWrapper<EchoHistoryEntity> queryWrapper = new LambdaQueryWrapper<EchoHistoryEntity>()
            .eq(EchoHistoryEntity::getUserId, userId)
            .eq(EchoHistoryEntity::getRecordId, parsedRecordId)
            .orderByDesc(EchoHistoryEntity::getCreatedAt, EchoHistoryEntity::getId)
            .last("limit 1");
        EchoHistoryEntity historyEntity = echoHistoryMapper.selectOne(queryWrapper);
        if (historyEntity == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "当前记录暂无回声", HttpStatus.NOT_FOUND);
        }
        return new EchoResponse(
            new EchoRecordSummary(
                String.valueOf(record.getId()),
                record.getTrainingDate().toString(),
                readParts(record.getPartsJson()),
                record.getDurationMinutes(),
                record.getMood(),
                record.getWeightKg()
            ),
            new EchoPayload(historyEntity.getSource(), historyEntity.getContent())
        );
    }

    @Transactional
    public FutureMessageSavedResponse saveFutureMessage(Long userId, SaveFutureMessageRequest request) {
        Long recordId = parseId(request.recordId());
        TrainingRecordEntity record = getRequiredRecord(userId, recordId);

        LambdaQueryWrapper<EchoMessageEntity> existingQuery = new LambdaQueryWrapper<EchoMessageEntity>()
            .eq(EchoMessageEntity::getUserId, userId)
            .eq(EchoMessageEntity::getRelatedRecordId, recordId)
            .eq(EchoMessageEntity::getSource, "future_message")
            .last("limit 1");
        if (echoMessageMapper.selectOne(existingQuery) != null) {
            throw new BizException(ErrorCode.CONFLICT, "这一条记录已经写过未来话", HttpStatus.CONFLICT);
        }

        EchoMessageEntity messageEntity = new EchoMessageEntity();
        messageEntity.setUserId(userId);
        messageEntity.setSource("future_message");
        messageEntity.setContent(request.content().trim());
        messageEntity.setRelatedRecordId(recordId);
        messageEntity.setUsedCount(0);
        echoMessageMapper.insert(messageEntity);

        record.setFutureMessageId(messageEntity.getId());
        trainingRecordMapper.updateById(record);

        return new FutureMessageSavedResponse(String.valueOf(messageEntity.getId()));
    }

    private GeneratedEcho chooseEcho(TrainingRecordEntity record) {
        EchoMessageEntity futureMessage = pickFutureMessage(record);
        if (futureMessage != null) {
            futureMessage.setUsedCount((futureMessage.getUsedCount() == null ? 0 : futureMessage.getUsedCount()) + 1);
            futureMessage.setLastUsedAt(LocalDateTime.now());
            echoMessageMapper.updateById(futureMessage);
            return new GeneratedEcho(
                futureMessage.getId(),
                "future_message",
                "来自过去的你：" + futureMessage.getContent()
            );
        }

        String factMessage = buildFactMessage(record);
        if (factMessage != null) {
            return new GeneratedEcho(null, "fact", factMessage);
        }

        return new GeneratedEcho(null, "system", pickDefaultMessage(record.getUserId()));
    }

    private EchoMessageEntity pickFutureMessage(TrainingRecordEntity record) {
        Set<Long> recentIds = listRecentFutureMessageIds(record.getUserId());
        LambdaQueryWrapper<EchoMessageEntity> queryWrapper = new LambdaQueryWrapper<EchoMessageEntity>()
            .eq(EchoMessageEntity::getUserId, record.getUserId())
            .eq(EchoMessageEntity::getSource, "future_message")
            .ne(EchoMessageEntity::getRelatedRecordId, record.getId())
            .orderByAsc(EchoMessageEntity::getLastUsedAt, EchoMessageEntity::getId);
        List<EchoMessageEntity> candidates = echoMessageMapper.selectList(queryWrapper);
        for (EchoMessageEntity candidate : candidates) {
            if (!recentIds.contains(candidate.getId())) {
                return candidate;
            }
        }
        return null;
    }

    private Set<Long> listRecentFutureMessageIds(Long userId) {
        LambdaQueryWrapper<EchoHistoryEntity> queryWrapper = new LambdaQueryWrapper<EchoHistoryEntity>()
            .eq(EchoHistoryEntity::getUserId, userId)
            .eq(EchoHistoryEntity::getSource, "future_message")
            .isNotNull(EchoHistoryEntity::getEchoMessageId)
            .orderByDesc(EchoHistoryEntity::getCreatedAt, EchoHistoryEntity::getId)
            .last("limit 3");
        Set<Long> ids = new LinkedHashSet<>();
        for (EchoHistoryEntity historyEntity : echoHistoryMapper.selectList(queryWrapper)) {
            ids.add(historyEntity.getEchoMessageId());
        }
        return ids;
    }

    private String buildFactMessage(TrainingRecordEntity record) {
        List<TrainingRecordEntity> recentRecords = listRecordsWithinDays(record.getUserId(), record.getTrainingDate(), 7);
        List<String> currentParts = readParts(record.getPartsJson());
        for (String part : currentParts) {
            long count = recentRecords.stream()
                .flatMap((item) -> readParts(item.getPartsJson()).stream())
                .filter(part::equals)
                .count();
            if (count == 1) {
                return "今天是你近 7 天第一次" + TrainingPart.labelOf(part) + "训练。";
            }
        }

        int trainingDays = recentRecords.size();
        if (trainingDays > 0) {
            return "这是你近 7 天里的第 " + trainingDays + " 次训练。";
        }

        return null;
    }

    private String pickDefaultMessage(Long userId) {
        LambdaQueryWrapper<EchoHistoryEntity> queryWrapper = new LambdaQueryWrapper<EchoHistoryEntity>()
            .eq(EchoHistoryEntity::getUserId, userId)
            .eq(EchoHistoryEntity::getSource, "system")
            .orderByDesc(EchoHistoryEntity::getCreatedAt, EchoHistoryEntity::getId)
            .last("limit 1");
        EchoHistoryEntity latestSystemHistory = echoHistoryMapper.selectOne(queryWrapper);
        if (latestSystemHistory == null) {
            return DEFAULT_MESSAGES.get(0);
        }
        for (String message : DEFAULT_MESSAGES) {
            if (!message.equals(latestSystemHistory.getContent())) {
                return message;
            }
        }
        return DEFAULT_MESSAGES.get(0);
    }

    private TrainingRecordEntity getRequiredRecord(Long userId, Long recordId) {
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

    private List<TrainingRecordEntity> listRecordsWithinDays(Long userId, java.time.LocalDate date, int days) {
        java.time.LocalDate startDate = date.minusDays(days - 1L);
        LambdaQueryWrapper<TrainingRecordEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .between(TrainingRecordEntity::getTrainingDate, startDate, date)
            .orderByAsc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId);
        return trainingRecordMapper.selectList(queryWrapper);
    }

    private List<String> readParts(String partsJson) {
        if (partsJson == null || partsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(partsJson, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException exception) {
            throw new BizException(ErrorCode.INTERNAL_ERROR, "回声数据格式异常", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Long parseId(String recordId) {
        try {
            return Long.valueOf(recordId);
        } catch (NumberFormatException exception) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "记录 ID 不合法");
        }
    }
}
