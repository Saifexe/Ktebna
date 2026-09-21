package com.ktebna.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KtebnaBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(KtebnaBackendApplication.class, args);
    }
}
