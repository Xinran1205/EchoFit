package com.example.trainingecho.training;

import java.util.Arrays;

public enum TrainingMood {
    EFFECTIVE("effective"),
    NORMAL("normal"),
    TIRED_BUT_DONE("tired_but_done"),
    RECOVERY("recovery"),
    LIGHT("light");

    private final String value;

    TrainingMood(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static boolean contains(String value) {
        return Arrays.stream(values()).anyMatch((item) -> item.value.equals(value));
    }
}
