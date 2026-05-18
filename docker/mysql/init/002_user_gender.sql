SET @gender_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_user'
    AND COLUMN_NAME = 'gender'
);

SET @gender_column_sql = IF(
  @gender_column_exists = 0,
  "ALTER TABLE app_user ADD COLUMN gender VARCHAR(16) NOT NULL DEFAULT 'male' COMMENT 'male, female' AFTER nickname",
  "SELECT 1"
);

PREPARE gender_column_stmt FROM @gender_column_sql;
EXECUTE gender_column_stmt;
DEALLOCATE PREPARE gender_column_stmt;

UPDATE app_user
SET gender = 'male'
WHERE gender IS NULL OR gender = '';
