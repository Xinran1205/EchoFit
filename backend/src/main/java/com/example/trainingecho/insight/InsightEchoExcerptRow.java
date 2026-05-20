package com.example.trainingecho.insight;

import java.time.LocalDate;
import lombok.Data;

@Data
public class InsightEchoExcerptRow {

    private Long id;
    private LocalDate trainingDate;
    private String content;
}
