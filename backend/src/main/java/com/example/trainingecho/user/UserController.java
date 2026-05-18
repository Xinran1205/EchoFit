package com.example.trainingecho.user;

import com.example.trainingecho.auth.CurrentUser;
import com.example.trainingecho.auth.AuthService;
import com.example.trainingecho.auth.SecurityUtils;
import com.example.trainingecho.common.ApiResponse;
import com.example.trainingecho.user.dto.UpdatePasswordRequest;
import com.example.trainingecho.user.dto.UpdateUserProfileRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PutMapping("/profile")
    public ApiResponse<CurrentUser> updateProfile(@Valid @RequestBody UpdateUserProfileRequest request) {
        Long userId = SecurityUtils.requireCurrentUser().userId();
        return ApiResponse.success(userService.updateGender(userId, request.gender()));
    }

    @PostMapping("/password/code")
    public ApiResponse<Void> sendPasswordVerificationCode() {
        authService.sendPasswordChangeVerificationCode(SecurityUtils.requireCurrentUser());
        return ApiResponse.success();
    }

    @PutMapping("/password")
    public ApiResponse<Void> updatePassword(@Valid @RequestBody UpdatePasswordRequest request) {
        authService.updatePassword(
            SecurityUtils.requireCurrentUser(),
            request.verificationCode(),
            request.newPassword()
        );
        return ApiResponse.success();
    }
}
