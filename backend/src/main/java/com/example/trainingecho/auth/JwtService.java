package com.example.trainingecho.auth;

import com.example.trainingecho.user.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expireHours;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expire-hours}") long expireHours
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireHours = expireHours;
    }

    public String generateToken(UserEntity user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expireHours, ChronoUnit.HOURS);
        return Jwts.builder()
            .subject(String.valueOf(user.getId()))
            .claim("uid", user.getId())
            .claim("email", user.getEmail())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey)
            .compact();
    }

    public Optional<AuthUser> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            Long userId = claims.get("uid", Long.class);
            if (userId == null) {
                userId = Long.valueOf(claims.getSubject());
            }
            String email = claims.get("email", String.class);
            return Optional.of(new AuthUser(userId, email));
        } catch (JwtException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
