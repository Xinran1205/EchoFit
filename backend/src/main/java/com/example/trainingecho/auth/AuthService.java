package com.example.trainingecho.auth;

import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.reminder.ReminderService;
import com.example.trainingecho.user.UserEntity;
import com.example.trainingecho.user.UserGender;
import com.example.trainingecho.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final VerificationCodeService verificationCodeService;
    private final ReminderService reminderService;

    public AuthService(
        UserService userService,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        VerificationCodeService verificationCodeService,
        ReminderService reminderService
    ) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.verificationCodeService = verificationCodeService;
        this.reminderService = reminderService;
    }

    public void sendRegisterVerificationCode(SendRegisterVerificationCodeRequest request) {
        String email = normalizeEmail(request.email());
        if (userService.findByEmail(email).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "该邮箱已注册", HttpStatus.CONFLICT);
        }

        verificationCodeService.sendCode(
            VerificationCodePurpose.REGISTER,
            email,
            "EchoFit 注册验证码",
            "你正在创建 EchoFit 账号，"
        );
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userService.findByEmail(email).isPresent()) {
            throw new BizException(ErrorCode.CONFLICT, "该邮箱已注册", HttpStatus.CONFLICT);
        }
        verificationCodeService.verifyCode(
            VerificationCodePurpose.REGISTER,
            email,
            request.verificationCode()
        );

        UserEntity user = new UserEntity();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setGender(UserGender.MALE.getValue());
        user.setStatus(1);
        userService.save(user);
        reminderService.getOrCreateConfig(user.getId());

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

    public void sendPasswordChangeVerificationCode(AuthUser authUser) {
        UserEntity user = userService.requireActiveById(authUser.userId());
        verificationCodeService.sendCode(
            VerificationCodePurpose.CHANGE_PASSWORD,
            user.getEmail(),
            "EchoFit 修改密码验证码",
            "你正在修改 EchoFit 登录密码，"
        );
    }

    public void updatePassword(AuthUser authUser, String verificationCode, String newPassword) {
        UserEntity user = userService.requireActiveById(authUser.userId());
        verificationCodeService.verifyCode(
            VerificationCodePurpose.CHANGE_PASSWORD,
            user.getEmail(),
            verificationCode
        );
        userService.updatePasswordHash(user.getId(), passwordEncoder.encode(newPassword));
    }

    public CurrentUser me(AuthUser authUser) {
        UserEntity user = userService.requireActiveById(authUser.userId());
        return userService.toCurrentUser(user);
    }

    private AuthResponse buildAuthResponse(UserEntity user) {
        return new AuthResponse(jwtService.generateToken(user), userService.toCurrentUser(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
