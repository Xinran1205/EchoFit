package com.example.trainingecho.training;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.echo.EchoMessageEntity;
import com.example.trainingecho.echo.EchoMessageMapper;
import com.example.trainingecho.echo.EchoService;
import com.example.trainingecho.training.dto.CreateRestDayRequest;
import com.example.trainingecho.training.dto.CreateTrainingRecordRequest;
import com.example.trainingecho.training.dto.CreateTrainingRecordResponse;
import com.example.trainingecho.training.dto.HomeSummaryResponse;
import com.example.trainingecho.training.dto.LatestWeightResponse;
import com.example.trainingecho.training.dto.MonthRecordsResponse;
import com.example.trainingecho.training.dto.RestDayResponse;
import com.example.trainingecho.training.dto.TrainingRecordPhotoResponse;
import com.example.trainingecho.training.dto.TrainingRecordResponse;
import com.example.trainingecho.training.dto.UpdateTrainingRecordRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TrainingRecordService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int MAX_PHOTO_COUNT = 4;
    private static final long MAX_PHOTO_SIZE_BYTES = 15L * 1024 * 1024;

    private final TrainingRecordMapper trainingRecordMapper;
    private final EchoMessageMapper echoMessageMapper;
    private final EchoService echoService;
    private final RestDayMapper restDayMapper;
    private final TrainingRecordPhotoMapper trainingRecordPhotoMapper;
    private final TrainingPhotoStorageService trainingPhotoStorageService;
    private final ObjectMapper objectMapper;

    public TrainingRecordService(
        TrainingRecordMapper trainingRecordMapper,
        EchoMessageMapper echoMessageMapper,
        EchoService echoService,
        RestDayMapper restDayMapper,
        TrainingRecordPhotoMapper trainingRecordPhotoMapper,
        TrainingPhotoStorageService trainingPhotoStorageService,
        ObjectMapper objectMapper
    ) {
        this.trainingRecordMapper = trainingRecordMapper;
        this.echoMessageMapper = echoMessageMapper;
        this.echoService = echoService;
        this.restDayMapper = restDayMapper;
        this.trainingRecordPhotoMapper = trainingRecordPhotoMapper;
        this.trainingPhotoStorageService = trainingPhotoStorageService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CreateTrainingRecordResponse createRecord(
        Long userId,
        CreateTrainingRecordRequest request,
        List<MultipartFile> photoFiles
    ) {
        List<String> parts = normalizeParts(request.parts());
        String mood = normalizeMood(request.mood());
        List<MultipartFile> normalizedPhotoFiles = normalizePhotoFiles(photoFiles);
        validatePhotoCount(normalizedPhotoFiles.size());
        ensureRecordDateNotInFuture(request.date());
        ensureDateAvailable(userId, request.date());

        TrainingRecordEntity entity = new TrainingRecordEntity();
        entity.setId(IdWorker.getId());
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
            throw new BizException(ErrorCode.CONFLICT, "这一天已经有训练记录", HttpStatus.CONFLICT);
        }

        List<String> storedPhotoKeys = persistNewPhotos(userId, entity.getId(), normalizedPhotoFiles, 0);
        registerPhotoStorageCleanup(storedPhotoKeys, List.of());
        Long echoId = echoService.generateForNewRecord(entity);
        return new CreateTrainingRecordResponse(String.valueOf(entity.getId()), String.valueOf(echoId));
    }

    @Transactional
    public TrainingRecordResponse updateRecord(
        Long userId,
        String recordId,
        UpdateTrainingRecordRequest request,
        List<String> keptPhotoIds,
        List<MultipartFile> newPhotoFiles
    ) {
        TrainingRecordEntity entity = getRequiredRecord(userId, parseId(recordId));
        List<TrainingRecordPhotoEntity> existingPhotos = listActivePhotosForRecord(entity.getId());
        List<Long> keptExistingPhotoIds = parsePhotoIds(keptPhotoIds);
        List<MultipartFile> normalizedNewPhotoFiles = normalizePhotoFiles(newPhotoFiles);

        validateRequestedPhotoIds(existingPhotos, keptExistingPhotoIds);
        validatePhotoCount(keptExistingPhotoIds.size() + normalizedNewPhotoFiles.size());

        entity.setPartsJson(writeParts(normalizeParts(request.parts())));
        entity.setDurationMinutes(request.durationMinutes());
        entity.setMood(normalizeMood(request.mood()));
        entity.setWeightKg(normalizeWeight(request.weightKg()));
        entity.setNote(normalizeNote(request.note()));
        trainingRecordMapper.updateById(entity);

        Map<Long, TrainingRecordPhotoEntity> existingPhotoMap = existingPhotos.stream()
            .collect(Collectors.toMap(TrainingRecordPhotoEntity::getId, (photo) -> photo));
        updateKeptPhotoOrder(keptExistingPhotoIds, existingPhotoMap);
        List<String> removedPhotoKeys = deleteRemovedPhotos(existingPhotos, keptExistingPhotoIds);
        List<String> storedPhotoKeys = persistNewPhotos(
            userId,
            entity.getId(),
            normalizedNewPhotoFiles,
            keptExistingPhotoIds.size()
        );
        registerPhotoStorageCleanup(storedPhotoKeys, removedPhotoKeys);

        return getRecordById(userId, String.valueOf(entity.getId()));
    }

    @Transactional
    public RestDayResponse createRestDay(Long userId, CreateRestDayRequest request) {
        ensureRecordDateNotInFuture(request.date());
        ensureDateAvailable(userId, request.date());

        RestDayEntity entity = new RestDayEntity();
        entity.setId(IdWorker.getId());
        entity.setUserId(userId);
        entity.setRestDate(request.date());
        entity.setNote(normalizeNote(request.note()));

        try {
            restDayMapper.insert(entity);
        } catch (DuplicateKeyException exception) {
            throw new BizException(ErrorCode.CONFLICT, "这一天已经存在日程记录", HttpStatus.CONFLICT);
        }

        return toRestDayResponse(entity);
    }

    public TrainingRecordResponse getRecordByDate(Long userId, LocalDate date) {
        return findByDate(userId, date)
            .map((entity) -> toResponse(entity, listActivePhotosForRecord(entity.getId()), loadFutureMessagePreview(entity)))
            .orElse(null);
    }

    public TrainingRecordResponse getRecordById(Long userId, String recordId) {
        TrainingRecordEntity entity = getRequiredRecord(userId, parseId(recordId));
        return toResponse(entity, listActivePhotosForRecord(entity.getId()), loadFutureMessagePreview(entity));
    }

    public MonthRecordsResponse getMonthRecords(Long userId, String month) {
        YearMonth yearMonth = parseMonth(month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        LambdaQueryWrapper<TrainingRecordEntity> recordQuery = new LambdaQueryWrapper<TrainingRecordEntity>()
            .eq(TrainingRecordEntity::getUserId, userId)
            .between(TrainingRecordEntity::getTrainingDate, startDate, endDate)
            .orderByAsc(TrainingRecordEntity::getTrainingDate, TrainingRecordEntity::getId);
        List<TrainingRecordEntity> recordEntities = trainingRecordMapper.selectList(recordQuery);
        Map<Long, List<TrainingRecordPhotoEntity>> photosByRecordId = groupPhotosByRecordIds(recordEntities);
        Map<Long, String> futureMessagePreviews = loadFutureMessagePreviews(recordEntities);

        List<TrainingRecordResponse> records = recordEntities.stream()
            .map((entity) -> toResponse(
                entity,
                photosByRecordId.getOrDefault(entity.getId(), List.of()),
                futureMessagePreviews.get(entity.getId())
            ))
            .toList();

        LambdaQueryWrapper<RestDayEntity> restQuery = new LambdaQueryWrapper<RestDayEntity>()
            .eq(RestDayEntity::getUserId, userId)
            .between(RestDayEntity::getRestDate, startDate, endDate)
            .orderByAsc(RestDayEntity::getRestDate, RestDayEntity::getId);
        List<RestDayResponse> restDays = restDayMapper.selectList(restQuery)
            .stream()
            .map(this::toRestDayResponse)
            .toList();

        return new MonthRecordsResponse(month, records, restDays);
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
        boolean hasTrainingToday = records.stream().anyMatch((record) -> today.equals(record.getTrainingDate()));
        Optional<RestDayEntity> restDay = findRestDayByDate(userId, today);
        Map<String, Integer> partCounts = buildPartCounts(records);
        int totalDurationMinutes = records.stream()
            .map(TrainingRecordEntity::getDurationMinutes)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();

        String todayEntryType = hasTrainingToday ? "training" : restDay.map((ignored) -> "rest").orElse(null);
        String todayRestNote = restDay.map(RestDayEntity::getNote).orElse(null);

        return new HomeSummaryResponse(
            today.toString(),
            hasTrainingToday || restDay.isPresent(),
            todayEntryType,
            todayRestNote,
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

    public PhotoFilePayload loadPhotoPayload(Long userId, String photoId) {
        Long parsedPhotoId = parseId(photoId);
        LambdaQueryWrapper<TrainingRecordPhotoEntity> queryWrapper = new LambdaQueryWrapper<TrainingRecordPhotoEntity>()
            .eq(TrainingRecordPhotoEntity::getId, parsedPhotoId)
            .eq(TrainingRecordPhotoEntity::getUserId, userId)
            .last("limit 1");
        TrainingRecordPhotoEntity entity = trainingRecordPhotoMapper.selectOne(queryWrapper);
        if (entity == null) {
            throw new BizException(ErrorCode.NOT_FOUND, "训练照片不存在", HttpStatus.NOT_FOUND);
        }

        Path filePath = trainingPhotoStorageService.resolvePath(entity.getStorageKey());
        if (!Files.exists(filePath)) {
            throw new BizException(ErrorCode.NOT_FOUND, "训练照片文件不存在", HttpStatus.NOT_FOUND);
        }

        return new PhotoFilePayload(
            filePath,
            entity.getMimeType(),
            entity.getOriginalFilename(),
            entity.getFileSize()
        );
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
            throw new BizException(
                ErrorCode.INTERNAL_ERROR,
                "训练记录数据格式异常",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private void ensureDateAvailable(Long userId, LocalDate date) {
        if (findByDate(userId, date).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "这一天已经有训练记录", HttpStatus.CONFLICT);
        }
        if (findRestDayByDate(userId, date).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "这一天已经标记为休息，不能再补记训练", HttpStatus.CONFLICT);
        }
    }

    private Optional<RestDayEntity> findRestDayByDate(Long userId, LocalDate date) {
        LambdaQueryWrapper<RestDayEntity> queryWrapper = new LambdaQueryWrapper<RestDayEntity>()
            .eq(RestDayEntity::getUserId, userId)
            .eq(RestDayEntity::getRestDate, date)
            .last("limit 1");
        return Optional.ofNullable(restDayMapper.selectOne(queryWrapper));
    }

    private void ensureRecordDateNotInFuture(LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            throw new BizException(
                ErrorCode.VALIDATION_ERROR,
                "记录日期不能晚于今天",
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

    private List<MultipartFile> normalizePhotoFiles(List<MultipartFile> photoFiles) {
        if (photoFiles == null || photoFiles.isEmpty()) {
            return List.of();
        }

        List<MultipartFile> normalized = photoFiles.stream()
            .filter(Objects::nonNull)
            .filter((file) -> !file.isEmpty())
            .toList();

        for (MultipartFile file : normalized) {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new BizException(
                    ErrorCode.VALIDATION_ERROR,
                    "只能上传图片文件",
                    HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() <= 0) {
                throw new BizException(
                    ErrorCode.VALIDATION_ERROR,
                    "上传的图片不能为空",
                    HttpStatus.BAD_REQUEST
                );
            }
            if (file.getSize() > MAX_PHOTO_SIZE_BYTES) {
                throw new BizException(
                    ErrorCode.VALIDATION_ERROR,
                    "单张图片不能超过 15MB",
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        return normalized;
    }

    private void validatePhotoCount(int photoCount) {
        if (photoCount > MAX_PHOTO_COUNT) {
            throw new BizException(
                ErrorCode.VALIDATION_ERROR,
                "最多只能保存 4 张训练照片",
                HttpStatus.BAD_REQUEST
            );
        }
    }

    private List<Long> parsePhotoIds(List<String> photoIds) {
        if (photoIds == null || photoIds.isEmpty()) {
            return List.of();
        }

        Set<Long> orderedIds = new LinkedHashSet<>();
        for (String photoId : photoIds) {
            orderedIds.add(parseId(photoId));
        }
        return List.copyOf(orderedIds);
    }

    private void validateRequestedPhotoIds(
        List<TrainingRecordPhotoEntity> existingPhotos,
        List<Long> keptPhotoIds
    ) {
        Set<Long> existingIds = existingPhotos.stream()
            .map(TrainingRecordPhotoEntity::getId)
            .collect(Collectors.toSet());
        boolean hasInvalidId = keptPhotoIds.stream().anyMatch((photoId) -> !existingIds.contains(photoId));
        if (hasInvalidId) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "照片列表包含无效项");
        }
    }

    private void updateKeptPhotoOrder(
        List<Long> keptPhotoIds,
        Map<Long, TrainingRecordPhotoEntity> existingPhotoMap
    ) {
        for (int index = 0; index < keptPhotoIds.size(); index++) {
            TrainingRecordPhotoEntity entity = existingPhotoMap.get(keptPhotoIds.get(index));
            if (entity == null) {
                continue;
            }
            if (entity.getSortOrder() != null && entity.getSortOrder() == index) {
                continue;
            }
            entity.setSortOrder(index);
            trainingRecordPhotoMapper.updateById(entity);
        }
    }

    private List<String> deleteRemovedPhotos(List<TrainingRecordPhotoEntity> existingPhotos, List<Long> keptPhotoIds) {
        Set<Long> keptIds = Set.copyOf(keptPhotoIds);
        List<TrainingRecordPhotoEntity> removedPhotos = existingPhotos.stream()
            .filter((photo) -> !keptIds.contains(photo.getId()))
            .toList();
        List<String> removedStorageKeys = new ArrayList<>(removedPhotos.size());

        for (TrainingRecordPhotoEntity photo : removedPhotos) {
            trainingRecordPhotoMapper.deleteById(photo.getId());
            removedStorageKeys.add(photo.getStorageKey());
        }

        return removedStorageKeys;
    }

    private List<String> persistNewPhotos(
        Long userId,
        Long recordId,
        List<MultipartFile> photoFiles,
        int startSortOrder
    ) {
        if (photoFiles.isEmpty()) {
            return List.of();
        }

        List<String> storedKeys = new ArrayList<>();
        try {
            for (int index = 0; index < photoFiles.size(); index++) {
                MultipartFile photoFile = photoFiles.get(index);
                Long photoId = IdWorker.getId();
                TrainingPhotoStorageService.StoredPhoto storedPhoto =
                    trainingPhotoStorageService.savePhoto(userId, recordId, photoId, photoFile);
                storedKeys.add(storedPhoto.storageKey());

                TrainingRecordPhotoEntity photoEntity = new TrainingRecordPhotoEntity();
                photoEntity.setId(photoId);
                photoEntity.setUserId(userId);
                photoEntity.setRecordId(recordId);
                photoEntity.setStorageKey(storedPhoto.storageKey());
                photoEntity.setOriginalFilename(storedPhoto.originalFilename());
                photoEntity.setMimeType(storedPhoto.contentType());
                photoEntity.setFileSize(storedPhoto.fileSize());
                photoEntity.setSortOrder(startSortOrder + index);
                trainingRecordPhotoMapper.insert(photoEntity);
            }
            return List.copyOf(storedKeys);
        } catch (RuntimeException exception) {
            storedKeys.forEach(trainingPhotoStorageService::deleteQuietly);
            throw exception;
        }
    }

    private void registerPhotoStorageCleanup(
        List<String> rollbackDeleteKeys,
        List<String> commitDeleteKeys
    ) {
        if (rollbackDeleteKeys.isEmpty() && commitDeleteKeys.isEmpty()) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            commitDeleteKeys.forEach(trainingPhotoStorageService::deleteQuietly);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                commitDeleteKeys.forEach(trainingPhotoStorageService::deleteQuietly);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    rollbackDeleteKeys.forEach(trainingPhotoStorageService::deleteQuietly);
                }
            }
        });
    }

    private List<TrainingRecordPhotoEntity> listActivePhotosForRecord(Long recordId) {
        LambdaQueryWrapper<TrainingRecordPhotoEntity> queryWrapper =
            new LambdaQueryWrapper<TrainingRecordPhotoEntity>()
                .eq(TrainingRecordPhotoEntity::getRecordId, recordId)
                .orderByAsc(TrainingRecordPhotoEntity::getSortOrder, TrainingRecordPhotoEntity::getId);
        return trainingRecordPhotoMapper.selectList(queryWrapper);
    }

    private Map<Long, List<TrainingRecordPhotoEntity>> groupPhotosByRecordIds(List<TrainingRecordEntity> records) {
        if (records.isEmpty()) {
            return Map.of();
        }

        List<Long> recordIds = records.stream().map(TrainingRecordEntity::getId).toList();
        LambdaQueryWrapper<TrainingRecordPhotoEntity> queryWrapper =
            new LambdaQueryWrapper<TrainingRecordPhotoEntity>()
                .in(TrainingRecordPhotoEntity::getRecordId, recordIds)
                .orderByAsc(TrainingRecordPhotoEntity::getSortOrder, TrainingRecordPhotoEntity::getId);
        return trainingRecordPhotoMapper.selectList(queryWrapper)
            .stream()
            .collect(Collectors.groupingBy(
                TrainingRecordPhotoEntity::getRecordId,
                LinkedHashMap::new,
                Collectors.toList()
            ));
    }

    private Map<Long, String> loadFutureMessagePreviews(List<TrainingRecordEntity> recordEntities) {
        List<Long> futureMessageIds = recordEntities.stream()
            .map(TrainingRecordEntity::getFutureMessageId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (futureMessageIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, String> messageContents = echoMessageMapper.selectBatchIds(futureMessageIds)
            .stream()
            .collect(Collectors.toMap(EchoMessageEntity::getId, EchoMessageEntity::getContent));

        Map<Long, String> result = new LinkedHashMap<>();
        for (TrainingRecordEntity entity : recordEntities) {
            if (entity.getFutureMessageId() != null) {
                result.put(entity.getId(), messageContents.get(entity.getFutureMessageId()));
            }
        }
        return result;
    }

    private String loadFutureMessagePreview(TrainingRecordEntity entity) {
        if (entity.getFutureMessageId() == null) {
            return null;
        }
        EchoMessageEntity messageEntity = echoMessageMapper.selectById(entity.getFutureMessageId());
        return messageEntity != null ? messageEntity.getContent() : null;
    }

    private TrainingRecordResponse toResponse(
        TrainingRecordEntity entity,
        List<TrainingRecordPhotoEntity> photoEntities,
        String futureMessagePreview
    ) {
        return new TrainingRecordResponse(
            String.valueOf(entity.getId()),
            String.valueOf(entity.getUserId()),
            entity.getTrainingDate().toString(),
            readParts(entity.getPartsJson()),
            entity.getDurationMinutes(),
            entity.getMood(),
            entity.getWeightKg(),
            entity.getNote(),
            photoEntities.stream().map(this::toPhotoResponse).toList(),
            futureMessagePreview,
            formatDateTime(entity.getCreatedAt()),
            formatDateTime(entity.getUpdatedAt())
        );
    }

    private TrainingRecordPhotoResponse toPhotoResponse(TrainingRecordPhotoEntity entity) {
        return new TrainingRecordPhotoResponse(
            String.valueOf(entity.getId()),
            entity.getOriginalFilename(),
            entity.getMimeType(),
            entity.getFileSize() != null ? entity.getFileSize() : 0L,
            "/training-record-photos/" + entity.getId() + "/file"
        );
    }

    private RestDayResponse toRestDayResponse(RestDayEntity entity) {
        return new RestDayResponse(
            String.valueOf(entity.getId()),
            String.valueOf(entity.getUserId()),
            entity.getRestDate().toString(),
            entity.getNote(),
            formatDateTime(entity.getCreatedAt()),
            formatDateTime(entity.getUpdatedAt())
        );
    }

    private String writeParts(List<String> parts) {
        try {
            return objectMapper.writeValueAsString(parts);
        } catch (JsonProcessingException exception) {
            throw new BizException(
                ErrorCode.INTERNAL_ERROR,
                "训练记录数据格式异常",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
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

    private Long parseId(String rawId) {
        try {
            return Long.valueOf(rawId);
        } catch (NumberFormatException exception) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "记录 ID 不合法");
        }
    }

    private YearMonth parseMonth(String month) {
        try {
            return YearMonth.parse(month);
        } catch (Exception exception) {
            throw new BizException(ErrorCode.VALIDATION_ERROR, "月份格式需要是 YYYY-MM");
        }
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_TIME_FORMATTER) : null;
    }

    public record PhotoFilePayload(
        Path filePath,
        String mimeType,
        String originalFilename,
        Long fileSize
    ) {
    }
}
