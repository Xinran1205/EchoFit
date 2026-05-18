package com.example.trainingecho.user;

import java.util.Arrays;

public enum UserGender {
    MALE("male", "男"),
    FEMALE("female", "女");

    private final String value;
    private final String label;

    UserGender(String value, String label) {
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

    public static String normalize(String value) {
        return contains(value) ? value : MALE.value;
    }
}
