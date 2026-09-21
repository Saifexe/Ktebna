package com.ktebna.backend.unit;

import com.ktebna.backend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String SECRET = "unit-test-secret-that-is-comfortably-over-32-bytes";

    private static JwtUtil jwt(String secret) {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", secret);
        ReflectionTestUtils.setField(util, "expirationMs", 60_000L);
        return util;
    }

    private static void validate(JwtUtil util) {
        ReflectionTestUtils.invokeMethod(util, "validateSecret");
    }

    @Test
    void refusesSecretsShorterThan32Bytes() {
        assertThatThrownBy(() -> validate(jwt("too-short")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    void refusesThePublicPlaceholderThatOlderVersionsShipped() {
        assertThatThrownBy(() -> validate(jwt("change-this-to-a-long-random-secret-of-at-least-32-characters")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("placeholder");
    }

    @Test
    void acceptsAStrongSecret() {
        validate(jwt(SECRET));
    }

    @Test
    void issuedTokenIsValidAndCarriesTheUserId() {
        JwtUtil util = jwt(SECRET);
        String token = util.generateToken(42L, "reader@example.com");

        assertThat(util.isTokenValid(token)).isTrue();
        assertThat(util.extractUserId(token)).isEqualTo(42L);
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtUtil util = jwt(SECRET);
        String token = util.generateToken(42L, "reader@example.com");
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(util.isTokenValid(tampered)).isFalse();
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String foreign = jwt("a-completely-different-secret-also-over-32-bytes").generateToken(1L, "x@example.com");

        assertThat(jwt(SECRET).isTokenValid(foreign)).isFalse();
    }

    @Test
    void garbageIsRejected() {
        assertThat(jwt(SECRET).isTokenValid("not.a.jwt")).isFalse();
    }
}
