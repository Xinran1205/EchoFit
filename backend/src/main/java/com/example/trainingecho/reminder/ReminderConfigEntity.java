package com.example.trainingecho.reminder;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("reminder_config")
public class ReminderConfigEntity {

    @TableId
    private Long id;

    private Long userId;
    private Integer enabled;
    private Integer remindHour;
    private Integer remindMinute;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
