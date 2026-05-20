package com.example.trainingecho.training;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("training_record_photo")
public class TrainingRecordPhotoEntity {

    @TableId
    private Long id;

    private Long userId;
    private Long recordId;
    private String storageKey;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    @TableLogic
    private Integer deleted;
}
