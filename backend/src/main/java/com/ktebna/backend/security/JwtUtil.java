package com.ktebna.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey key;

    // The placeholder that older versions of this repo shipped as a default.
    private static final String KNOWN_PLACEHOLDER =
            "change-this-to-a-long-random-secret-of-at-least-32-characters";

    // Fail at startup rather than run with a secret an attacker could know or brute-force.
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long");
        }
        if (secret.equals(KNOWN_PLACEHOLDER)) {
            throw new IllegalStateException("JWT_SECRET is the public placeholder value; generate a random one");
        }
    }

    private SecretKey getKey() {
        if (key == null) {
            key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
        return key;
    }

    // Claim holding the user's token version when the token was issued; see User.tokenVersion.
    static final String VERSION_CLAIM = "ver";

    public String generateToken(Long userId, String email) {
        return generateToken(userId, email, 0);
    }

    public String generateToken(Long userId, String email, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim(VERSION_CLAIM, tokenVersion)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey())
                .compact();
    }

    /** The verified claims, or null when the token is forged, expired or malformed. */
    public Claims parse(String token) {
        try {
            return Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token).getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    // Tokens issued before versions existed carry none; they count as version 0.
    public static int versionOf(Claims claims) {
        Integer version = claims.get(VERSION_CLAIM, Integer.class);
        return version == null ? 0 : version;
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(getKey()).build()
                .parseSignedClaims(token).getPayload();
        return Long.valueOf(claims.getSubject());
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
