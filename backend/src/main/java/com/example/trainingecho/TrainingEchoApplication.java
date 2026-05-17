package com.example.trainingecho;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TrainingEchoApplication {

    public static void main(String[] args) {
        SpringApplication.run(TrainingEchoApplication.class, args);
    }
}

