// backend-springboot/src/main/java/com/edrl/backend/security/JwtUtils.java
package com.edrl.backend.security;

import com.edrl.backend.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private int jwtExpirationMs;

    // Khởi tạo Key mã hóa từ chuỗi secret base64
    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    /**
     * Sinh JWT Token chuẩn xác theo tài liệu (chứa sub, role, deptId, classId)
     */
    public String generateJwtToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail()) // 'sub' claim
                .claim("userId", user.getId())
                .claim("role", user.getRole().name())
                .claim("deptId", user.getDeptId())
                .claim("classId", user.getClassId())
                .setIssuedAt(new Date()) // 'iat' claim
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs)) // 'exp' claim
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Lấy Email (Subject) từ Token
     */
    public String getEmailFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    /**
     * Xác thực tính hợp lệ của Token
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature/token: {}", e.getMessage());