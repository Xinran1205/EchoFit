package com.example.trainingecho.auth;

import com.example.trainingecho.common.BizException;
import com.example.trainingecho.common.ErrorCode;
import com.example.trainingecho.mail.EmailSender;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class VerificationCodeService {
    private static final Logger log = LoggerFactory.getLogger(VerificationCodeService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final HexFormat HEX_FORMAT = HexFormat.of();

    private final StringRedisTemplate redisTemplate;
    private final EmailSender emailSender;
    private final boolean mailEnabled;
    private final Duration expireDuration;
    private final Duration resendDuration;

    public VerificationCodeService(
        StringRedisTemplate redisTemplate,
        EmailSender emailSender,
        @Value("${app.mail.enabled:false}") boolean mailEnabled,
        @Value("${app.auth.verification-code.expire-minutes:10}") long expireMinutes,
        @Value("${app.auth.verification-code.resend-seconds:60}") long resendSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.emailSender = emailSender;
        this.mailEnabled = mailEnabled;
        this.expireDuration = Duration.ofMinutes(expireMinutes);
        this.resendDuration = Duration.ofSeconds(resendSeconds);
    }

    public void sendCode(
        VerificationCodePurpose purpose,
        String email,
        String subject,
        String contentPrefix
    ) {
        ensureMailEnabled();
        String codeKey = buildCodeKey(purpose, email);
        String resendKey = buildResendKey(purpose, email);
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(resendKey, "1", resendDuration);
        if (!Boolean.TRUE.equals(locked)) {
            throw new BizException(
                ErrorCode.TOO_MANY_REQUESTS,
                "验证码刚发送过，请稍后再试",
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        String code = generateCode();
        try {
            redisTemplate.opsForValue().set(codeKey, hashCode(code), expireDuration);
            emailSender.sendText(email, subject, buildMailContent(contentPrefix, code));
        } catch (Exception exception) {
            redisTemplate.delete(codeKey);
            redisTemplate.delete(resendKey);
            log.error("Failed to send verification code email. purpose={}, email={}", purpose.getKey(), email, exception);
            throw new BizException(
                ErrorCode.INTERNAL_ERROR,
                "验证码发送失败，请稍后再试",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    public void verifyCode(VerificationCodePurpose purpose, String email, String submittedCode) {
        String normalizedCode = submittedCode == null ? "" : submittedCode.trim();
        String codeKey = buildCodeKey(purpose, email);
        String storedHash = redisTemplate.opsForValue().get(codeKey);
        if (storedHash == null) {
            throw new BizException(ErrorCode.BUSINESS_ERROR, "验证码无效或已过期", HttpStatus.BAD_REQUEST);
        }
        if (!storedHash.equals(hashCode(normalizedCode))) {
            throw new BizException(ErrorCode.BUSINESS_ERROR, "验证码错误", HttpStatus.BAD_REQUEST);
        }

        redisTemplate.delete(codeKey);
        redisTemplate.delete(buildResendKey(purpose, email));
    }

    private void ensureMailEnabled() {
        if (!mailEnabled) {
            throw new BizException(
                ErrorCode.BUSINESS_ERROR,
                "邮箱验证码服务暂未开启",
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }

    private String buildCodeKey(VerificationCodePurpose purpose, String email) {
        return "echofit:verification:" + purpose.getKey() + ":" + email;
    }

    private String buildResendKey(VerificationCodePurpose purpose, String email) {
        return buildCodeKey(purpose, email) + ":resend";
    }

    private String generateCode() {
        return String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
    }

    private String buildMailContent(String contentPrefix, String code) {
        long expireMinutes = Math.max(1L, expireDuration.toMinutes());
        return contentPrefix
            + "验证码是 "
            + code
            + "，"
            + expireMinutes
            + " 分钟内有效。如非本人操作，请忽略这封邮件。";
    }

    private String hashCode(String code) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            return HEX_FORMAT.formatHex(messageDigest.digest(code.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is required", exception);
        }
    }
}
