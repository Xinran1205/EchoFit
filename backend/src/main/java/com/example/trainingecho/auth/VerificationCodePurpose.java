package com.example.trainingecho.auth;

public enum VerificationCodePurpose {
    REGISTER("register", "注册"),
    CHANGE_PASSWORD("change-password", "修改密码");

    private final String key;
    private final String label;

    VerificationCodePurpose(String key, String label) {
        this.key = key;
        this.label = label;
    }

    public String getKey() {
        return key;
    }

    public String getLabel() {
        return label;
    }
}
