CREATE DATABASE IF NOT EXISTS training_echo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE training_echo;

CREATE TABLE IF NOT EXISTS app_user (
  id BIGINT PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NULL,
  gender VARCHAR(16) NOT NULL DEFAULT 'male' COMMENT 'male, female',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1 active, 0 disabled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS training_record (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  training_date DATE NOT NULL,
  parts_json JSON NOT NULL,
  duration_minutes INT NOT NULL,
  mood VARCHAR(32) NOT NULL,
  weight_kg DECIMAL(5,2) NULL,
  note VARCHAR(500) NULL,
  future_message_id BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT NOT NULL DEFAULT 0,

  UNIQUE KEY uk_user_date_not_deleted (user_id, training_date, deleted),
  KEY idx_user_date (user_id, training_date),
  CONSTRAINT chk_duration_minutes CHECK (duration_minutes BETWEEN 5 AND 300)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS echo_message (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  source VARCHAR(32) NOT NULL COMMENT 'future_message, fact, system',
  content VARCHAR(255) NOT NULL,
  related_record_id BIGINT NULL,
  used_count INT NOT NULL DEFAULT 0,
  last_used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT NOT NULL DEFAULT 0,

  KEY idx_user_source (user_id, source),
  KEY idx_user_last_used (user_id, last_used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS echo_history (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  record_id BIGINT NOT NULL,
  echo_message_id BIGINT NULL,
  source VARCHAR(32) NOT NULL,
  content VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_user_created (user_id, created_at),
  KEY idx_record (record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reminder_config (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  enabled TINYINT NOT NULL DEFAULT 1,
  remind_hour TINYINT NOT NULL DEFAULT 20,
  remind_minute TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT NOT NULL DEFAULT 0,

  UNIQUE KEY uk_user_reminder (user_id, deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
