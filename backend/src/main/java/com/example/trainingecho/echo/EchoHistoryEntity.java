package com.example.trainingecho.echo;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("echo_history")
public class EchoHistoryEntity {

    @TableId
    private Long id;

    private Long userId;
    private Long recordId;
    private Long echoMessageId;
    private String source;
    private String content;
    private LocalDateTime createdAt;
}
