package com.example.trainingecho.reminder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.trainingecho.mail.EmailSender;
import com.example.trainingecho.user.UserEntity;
import com.example.trainingecho.user.UserMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MailReminderJobTest {

    @Mock
    private ReminderService reminderService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private EmailSender emailSender;

    @Test
    void sendDailyReminderContinuesWhenOneUserSendFails() {
        MailReminderJob job = new MailReminderJob(
            reminderService,
            userMapper,
            emailSender,
            true,
            "aa1401545387@163.com",
            "aa1401545387@163.com"
        );

        UserEntity firstUser = createUser(1L, "first@example.com");
        UserEntity secondUser = createUser(2L, "second@example.com");
        UserEntity thirdUser = createUser(3L, "third@example.com");
        when(userMapper.selectList(any())).thenReturn(List.of(firstUser, secondUser, thirdUser));

        when(reminderService.getOrCreateConfig(1L)).thenReturn(createConfig(1));
        when(reminderService.getOrCreateConfig(2L)).thenReturn(createConfig(0));
        when(reminderService.getOrCreateConfig(3L)).thenReturn(createConfig(1));

        doThrow(new RuntimeException("smtp error"))
            .when(emailSender)
            .sendText(eq("first@example.com"), any(), any());

        job.sendDailyReminder();

        verify(emailSender).sendText(
            "first@example.com",
            "EchoFit 训练提醒",
            "如果今天训练了，别忘了回来记录。"
        );
        verify(emailSender).sendText(
            "third@example.com",
            "EchoFit 训练提醒",
            "如果今天训练了，别忘了回来记录。"
        );
        verify(emailSender, never()).sendText(eq("second@example.com"), any(), any());
    }

    @Test
    void sendDailyReminderSkipsWhenMailDisabled() {
        MailReminderJob job = new MailReminderJob(
            reminderService,
            userMapper,
            emailSender,
            false,
            "aa1401545387@163.com",
            "aa1401545387@163.com"
        );

        job.sendDailyReminder();

        verify(userMapper, never()).selectList(any());
        verify(emailSender, never()).sendText(any(), any(), any());
    }

    private static UserEntity createUser(Long id, String email) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setEmail(email);
        user.setStatus(1);
        return user;
    }

    private static ReminderConfigEntity createConfig(int enabled) {
        ReminderConfigEntity entity = new ReminderConfigEntity();
        entity.setEnabled(enabled);
        entity.setRemindHour(20);
        entity.setRemindMinute(0);
        return entity;
    }
}
