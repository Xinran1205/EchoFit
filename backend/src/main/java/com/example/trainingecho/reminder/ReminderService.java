package com.example.trainingecho.reminder;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.reminder.dto.ReminderConfigResponse;
import com.example.trainingecho.reminder.dto.UpdateReminderConfigRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReminderService {

    private final ReminderConfigMapper reminderConfigMapper;
    private final boolean defaultEnabled;
    private final int defaultHour;
    private final int defaultMinute;

    public ReminderService(
        ReminderConfigMapper reminderConfigMapper,
        @Value("${app.reminder.default-enabled:true}") boolean defaultEnabled,
        @Value("${app.reminder.daily-hour:20}") int defaultHour,
        @Value("${app.reminder.daily-minute:0}") int defaultMinute
    ) {
        this.reminderConfigMapper = reminderConfigMapper;
        this.defaultEnabled = defaultEnabled;
        this.defaultHour = defaultHour;
        this.defaultMinute = defaultMinute;
    }

    @Transactional
    public ReminderConfigResponse getConfig(Long userId) {
        return toResponse(getOrCreateConfig(userId));
    }

    @Transactional
    public ReminderConfigResponse updateConfig(Long userId, UpdateReminderConfigRequest request) {
        ReminderConfigEntity entity = getOrCreateConfig(userId);
        entity.setEnabled(Boolean.TRUE.equals(request.enabled()) ? 1 : 0);
        reminderConfigMapper.updateById(entity);
        return toResponse(entity);
    }

    public ReminderConfigEntity getOrCreateConfig(Long userId) {
        LambdaQueryWrapper<ReminderConfigEntity> queryWrapper = new LambdaQueryWrapper<ReminderConfigEntity>()
            .eq(ReminderConfigEntity::getUserId, userId)
            .last("limit 1");
        ReminderConfigEntity entity = reminderConfigMapper.selectOne(queryWrapper);
        if (entity != null) {
            return entity;
        }

        ReminderConfigEntity created = new ReminderConfigEntity();
        created.setUserId(userId);
        created.setEnabled(defaultEnabled ? 1 : 0);
        created.setRemindHour(defaultHour);
        created.setRemindMinute(defaultMinute);
        reminderConfigMapper.insert(created);
        return created;
    }

    private ReminderConfigResponse toResponse(ReminderConfigEntity entity) {
        return new ReminderConfigResponse(
            entity.getEnabled() != null && entity.getEnabled() == 1,
            entity.getRemindHour(),
            entity.getRemindMinute()
        );
    }
}
