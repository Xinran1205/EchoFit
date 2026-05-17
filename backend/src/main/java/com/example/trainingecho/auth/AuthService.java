package com.example.trainingecho.auth;

import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.user.UserEntity;
import com.example.trainingecho.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserService userService,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userService.findByEmail(email).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "该邮箱已注册", HttpStatus.CONFLICT);
        }

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(1);
        userService.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserEntity user = userService.findByEmail(email)
            .filter((item) -> item.getStatus() != null && item.getStatus() == 1)
            .orElseThrow(() -> new BizException(
                ErrorCode.UNAUTHORIZED,
                "邮箱或密码错误",
                HttpStatus.UNAUTHORIZED
            ));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BizException(ErrorCode.UNAUTHORIZED, "邮箱或密码错误", HttpStatus.UNAUTHORIZED);
        }

        return buildAuthResponse(user);
    }

    public CurrentUser me(AuthUser authUser) {
        UserEntity user = userService.findActiveById(authUser.userId())
            .orElseThrow(() -> new BizException(
                ErrorCode.UNAUTHORIZED,
                "未登录或登录已过期",
                HttpStatus.UNAUTHORIZED
            ));
        return userService.toCurrentUser(user);
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        return new AuthResponse(jwtService.generateToken(user), userService.toCurrentUser(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
