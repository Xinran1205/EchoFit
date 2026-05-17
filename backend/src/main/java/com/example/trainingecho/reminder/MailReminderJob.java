package com.example.trainingecho.reminder;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.mail.EmailSender;
import com.example.trainingecho.user.UserEntity;
import com.example.trainingecho.user.UserMapper;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MailReminderJob {

    private final ReminderConfigMapper reminderConfigMapper;
    private final UserMapper userMapper;
    private final EmailSender emailSender;
    private final boolean mailEnabled;

    public MailReminderJob(
        ReminderConfigMapper reminderConfigMapper,
        UserMapper userMapper,
        EmailSender emailSender,
        @Value("${app.mail.enabled:false}") boolean mailEnabled
    ) {
        this.reminderConfigMapper = reminderConfigMapper;
        this.userMapper = userMapper;
        this.emailSender = emailSender;
        this.mailEnabled = mailEnabled;
    }

    @Scheduled(
        cron = "0 ${app.reminder.daily-minute:0} ${app.reminder.daily-hour:20} * * ?",
        zone = "Asia/Shanghai"
    )
    public void sendDailyReminder() {
        if (!mailEnabled) {
            return;
        }

        LambdaQueryWrapper<ReminderConfigEntity> queryWrapper = new LambdaQueryWrapper<ReminderConfigEntity>()
            .eq(ReminderConfigEntity::getEnabled, 1);
        List<ReminderConfigEntity> configs = reminderConfigMapper.selectList(queryWrapper);
        for (ReminderConfigEntity config : configs) {
            UserEntity user = userMapper.selectById(config.getUserId());
            if (user != null && user.getStatus() != null && user.getStatus() == 1) {
                emailSender.sendText(
                    user.getEmail(),
                    "EchoFit 训练提醒",
                    "今天如果有训练，别忘了回来记一下。"
                );
            }
        }
    }
}
