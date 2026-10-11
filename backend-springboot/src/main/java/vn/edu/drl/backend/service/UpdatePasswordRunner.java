package vn.edu.drl.backend.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.drl.backend.dao.UserRepository;
import vn.edu.drl.backend.model.User;
import java.util.List;

// @Component
public class UpdatePasswordRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UpdatePasswordRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        String defaultPassword = passwordEncoder.encode("123456");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            user.setPasswordHash(defaultPassword);
            userRepository.save(user);
        }
        System.out.println("===> ALL PASSWORDS UPDATED TO 123456");
    }
}
