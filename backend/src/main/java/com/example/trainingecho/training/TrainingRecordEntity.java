package com.example.trainingecho.training;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("training_record")
public class TrainingRecordEntity {

    @TableId
    private Long id;

    private Long userId;
    private LocalDate trainingDate;
    private String partsJson;
    private Integer durationMinutes;
    private String mood;
    private BigDecimal weightKg;
    private String note;
    private Long futureMessageId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
