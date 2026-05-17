package com.example.trainingecho.auth;

import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static AuthUser requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthUser authUser)) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "未登录或登录已过期", HttpStatus.UNAUTHORIZED);
        }
        return authUser;
    }
}
