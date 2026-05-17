package com.example.trainingecho.echo;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("echo_message")
public class EchoMessageEntity {

    @TableId
    private Long id;

    private Long userId;
    private String source;
    private String content;
    private Long relatedRecordId;
    private Integer usedCount;
    private LocalDateTime lastUsedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
