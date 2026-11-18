package vn.edu.drl.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BackendSpringbootApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendSpringbootApplication.class, args);
    }
}
