package com.example.trainingecho.common;

public enum ErrorCode {

    VALIDATION_ERROR(40000),
    BUSINESS_ERROR(40001),
    UNAUTHORIZED(40100),
    FORBIDDEN(40300),
    CONFLICT(40900),
    NOT_FOUND(40400),
    TOO_MANY_REQUESTS(42900),
    INTERNAL_ERROR(50000);

    private final int code;

    ErrorCode(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}
