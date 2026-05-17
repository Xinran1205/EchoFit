package com.example.trainingecho.training;

import java.util.Arrays;

public enum TrainingPart {
    CHEST("chest", "胸"),
    BACK("back", "背"),
    SHOULDER("shoulder", "肩"),
    LEGS("legs", "腿"),
    ARMS("arms", "手臂"),
    CORE("core", "核心"),
    CARDIO("cardio", "有氧"),
    STRETCH("stretch", "拉伸");

    private final String value;
    private final String label;

    TrainingPart(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public static boolean contains(String value) {
        return Arrays.stream(values()).anyMatch((item) -> item.value.equals(value));
    }

    public static String labelOf(String value) {
        return Arrays.stream(values())
            .filter((item) -> item.value.equals(value))
            .findFirst()
            .map(TrainingPart::getLabel)
            .orElse(value);
    }
}
