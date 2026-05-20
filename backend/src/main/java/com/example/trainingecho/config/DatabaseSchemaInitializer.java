package com.example.trainingecho.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer genderColumnCount = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'app_user'
              AND COLUMN_NAME = 'gender'
            """,
            Integer.class
        );
        if (genderColumnCount == null || genderColumnCount == 0) {
            jdbcTemplate.execute(
                "ALTER TABLE app_user " +
                    "ADD COLUMN gender VARCHAR(16) NOT NULL DEFAULT 'male' " +
                    "COMMENT 'male, female' AFTER nickname"
            );
        }
        jdbcTemplate.execute("UPDATE app_user SET gender = 'male' WHERE gender IS NULL OR gender = ''");
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS training_record_photo (
              id BIGINT PRIMARY KEY,
              user_id BIGINT NOT NULL,
              record_id BIGINT NOT NULL,
              storage_key VARCHAR(255) NOT NULL,
              original_filename VARCHAR(255) NULL,
              mime_type VARCHAR(100) NOT NULL,
              file_size BIGINT NOT NULL,
              sort_order INT NOT NULL DEFAULT 0,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              deleted TINYINT NOT NULL DEFAULT 0,
              KEY idx_record_sort (record_id, sort_order),
              KEY idx_user_created (user_id, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
        );
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS rest_day (
              id BIGINT PRIMARY KEY,
              user_id BIGINT NOT NULL,
              rest_date DATE NOT NULL,
              note VARCHAR(100) NULL,
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deleted TINYINT NOT NULL DEFAULT 0,
              UNIQUE KEY uk_rest_user_date_not_deleted (user_id, rest_date, deleted),
              KEY idx_rest_user_date (user_id, rest_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
            """
        );
        log.info("Database schema initialization completed");
    }
}
