// backend-springboot/src/main/java/com/edrl/backend/security/UserDetailsImpl.java
package com.edrl.backend.security;

import com.edrl.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@Getter
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    private Long id;
    private String userCode;
    private String email;
    private String password;
    private Long deptId;
    private Long classId;
    private Collection<? extends GrantedAuthority> authorities;

    // Chuyển đổi từ User Entity sang UserDetailsImpl
    public static UserDetailsImpl build(User user) {
        // Biến Enum Role thành GrantedAuthority (Ví dụ: "ADMIN")
        GrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());

        return new UserDetailsImpl(
                user.getId(),
                user.getUserCode(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getDeptId(),
                user.getClassId(),
                Collections.singletonList(authority)
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email; // Dùng email làm định danh chính trong Spring Security
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}