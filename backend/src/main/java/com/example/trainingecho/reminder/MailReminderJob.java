package com.example.trainingecho.reminder;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.trainingecho.mail.EmailSender;
import com.example.trainingecho.user.UserEntity;
import com.example.trainingecho.user.UserMapper;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MailReminderJob {
    private static final Logger log = LoggerFactory.getLogger(MailReminderJob.class);
    private static final String REMINDER_SUBJECT = "EchoFit 训练提醒";
    private static final String REMINDER_CONTENT = "如果今天训练了，别忘了回来记录。";

    private final ReminderService reminderService;
    private final UserMapper userMapper;
    private final EmailSender emailSender;
    private final boolean mailEnabled;
    private final String senderAddress;

    public MailReminderJob(
        ReminderService reminderService,
        UserMapper userMapper,
        EmailSender emailSender,
        @Value("${app.mail.enabled:false}") boolean mailEnabled,
        @Value("${app.mail.from:}") String configuredFrom,
        @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.reminderService = reminderService;
        this.userMapper = userMapper;
        this.emailSender = emailSender;
        this.mailEnabled = mailEnabled;
        this.senderAddress = StringUtils.hasText(configuredFrom) ? configuredFrom : mailUsername;
    }

    @Scheduled(
        cron = "0 ${app.reminder.daily-minute:0} ${app.reminder.daily-hour:20} * * ?",
        zone = "Asia/Shanghai"
    )
    public void sendDailyReminder() {
        if (!mailEnabled) {
            return;
        }

        LambdaQueryWrapper<UserEntity> queryWrapper = new LambdaQueryWrapper<UserEntity>()
            .eq(UserEntity::getStatus, 1);
        List<UserEntity> users = userMapper.selectList(queryWrapper);
        log.info("Dispatching daily reminder emails. sender={}, candidates={}", senderAddress, users.size());

        for (UserEntity user : users) {
            if (!StringUtils.hasText(user.getEmail())) {
                continue;
            }

            ReminderConfigEntity config = reminderService.getOrCreateConfig(user.getId());
            if (config.getEnabled() == null || config.getEnabled() != 1) {
                continue;
            }

            try {
                emailSender.sendText(
                    user.getEmail(),
                    REMINDER_SUBJECT,
                    REMINDER_CONTENT
                );
                log.info("Reminder email sent. userId={}, email={}", user.getId(), user.getEmail());
            } catch (Exception exception) {
                log.error(
                    "Failed to send reminder email. userId={}, email={}",
                    user.getId(),
                    user.getEmail(),
                    exception
                );
            }
        }
    }
}
