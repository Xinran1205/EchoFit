# 私人训练记录 Web App 后端技术方案

> 目标：用 **Spring Boot + Spring MVC + MySQL + MyBatis-Plus + Lombok + Docker + Nginx** 做一个简单、稳定、可部署的后端 MVP。  
> 部署路径：**先本地 Docker Compose 验证前后端联通 → 再 Docker 部署到阿里云服务器 → Nginx 统一反向代理前端和后端 API → 腾讯云 SES 发送邮件提醒**。

---

## 1. 后端目标

这个后端不追求复杂架构，不做微服务，不做过度设计。

核心目标：

1. 支持邮箱注册 / 登录。
2. 支持训练记录的新增、补记、编辑、查询。
3. 支持首页近 7 天状态统计。
4. 支持日志页按月份查看记录。
5. 支持新建记录后生成回声。
6. 支持给未来自己的话。
7. 支持邮件提醒配置。
8. 支持后续部署到阿里云服务器。
9. 支持本地 Docker Compose 一键验证前后端和数据库。

---

## 2. 推荐技术栈与版本

### 2.1 后端核心版本

| 类型 | 推荐版本 | 说明 |
|---|---:|---|
| Java | 21 LTS | Spring Boot 3.5 支持 Java 17+，Java 21 是当前更适合新项目的 LTS |
| Spring Boot | 3.5.14 | 走 Spring Boot 3.5 稳定线，不建议 MVP 阶段上 Spring Boot 4 |
| Spring Framework | 由 Spring Boot 管理 | 不手动指定 |
| Spring MVC | `spring-boot-starter-web` | REST API |
| MyBatis-Plus | 3.5.16 | 使用 `mybatis-plus-spring-boot3-starter` |
| MySQL | 8.4 LTS | 本地和服务器统一用 MySQL 8.4 系列 |
| MySQL Docker 镜像 | `mysql:8.4.9` | 推荐固定小版本，避免 `latest` 自动升级 |
| Lombok | 由 Spring Boot / Maven 管理 | 减少实体、DTO 样板代码 |
| Docker | Docker Engine + Compose v2 | 本地和服务器部署一致 |
| Nginx | official stable/alpine | 前端静态资源 + API 反向代理 |
| 邮件服务 | 腾讯云 SES | 推荐先抽象接口，生产使用腾讯云邮件服务 |
| 构建工具 | Maven | 简单、稳定、Spring Boot 项目常用 |

### 2.2 为什么不用 Spring Boot 4

虽然 Spring Boot 4 已经存在，但本项目暂时不建议使用。

原因：

1. 你的后端目标是 **MVP 简单可用**，不是追最新。
2. MyBatis-Plus 与 Spring Boot 3 的 starter 已经成熟：`mybatis-plus-spring-boot3-starter`。
3. Spring Boot 3.5 仍然是稳定线，生态兼容性更稳。
4. Spring Boot 4 使用更新的 Servlet / Tomcat / Spring Framework 版本，后续第三方库兼容性可能需要额外验证。

所以推荐：

```xml
<spring-boot.version>3.5.14</spring-boot.version>
<mybatis-plus.version>3.5.16</mybatis-plus.version>
<java.version>21</java.version>
```

---

## 3. 项目架构选择

推荐架构：

```txt
单体后端
REST API
MySQL 持久化
Nginx 反向代理
Docker Compose 部署
```

不做：

```txt
微服务
Redis
MQ
Elasticsearch
复杂权限系统
复杂后台管理系统
Kubernetes
分布式任务调度
```

原因：你的产品是私人训练记录 Web App，MVP 数据量很小，功能边界清晰，用单体 Spring Boot 足够。

---

## 4. 模块划分

推荐使用简单分层结构：

```txt
controller  接收 HTTP 请求
service     业务逻辑
mapper      数据访问
entity      数据库实体
dto         请求 / 响应对象
config      配置
common      通用返回、异常、工具类
```

不建议一开始搞复杂 DDD。  
可以用“按业务 feature 分包 + 简单分层”的方式。

推荐目录：

```txt
src/main/java/com/example/trainingecho/
  TrainingEchoApplication.java

  common/
    ApiResponse.java
    BizException.java
    ErrorCode.java
    GlobalExceptionHandler.java
    PageResponse.java

  config/
    WebConfig.java
    MybatisPlusConfig.java
    SecurityConfig.java
    CorsConfig.java
    MailConfig.java

  auth/
    AuthController.java
    AuthService.java
    JwtService.java
    LoginRequest.java
    RegisterRequest.java
    LoginResponse.java
    CurrentUser.java

  user/
    UserEntity.java
    UserMapper.java
    UserService.java

  training/
    TrainingRecordEntity.java
    TrainingRecordMapper.java
    TrainingRecordService.java
    TrainingController.java
    dto/
      CreateTrainingRecordRequest.java
      UpdateTrainingRecordRequest.java
      TrainingRecordResponse.java
      HomeSummaryResponse.java
      MonthRecordResponse.java

  echo/
    EchoMessageEntity.java
    EchoHistoryEntity.java
    EchoService.java
    EchoController.java
    dto/
      EchoResponse.java
      SaveFutureMessageRequest.java

  reminder/
    ReminderConfigEntity.java
    ReminderConfigMapper.java
    ReminderService.java
    ReminderController.java
    MailReminderJob.java

  mail/
    EmailSender.java
    NoopEmailSender.java
    TencentSesSmtpEmailSender.java
    TencentSesApiEmailSender.java
```

---

## 5. Maven 依赖建议

### 5.1 pom.xml

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="
           http://maven.apache.org/POM/4.0.0
           https://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.14</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>training-echo-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>training-echo-backend</name>
    <description>Private training log backend</description>

    <properties>
        <java.version>21</java.version>
        <mybatis-plus.version>3.5.16</mybatis-plus.version>
        <jjwt.version>0.12.6</jjwt.version>
    </properties>

    <dependencies>
        <!-- Web / Spring MVC -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Validation: @NotBlank, @Email, @Min 等 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Security: 用于密码加密和 JWT 认证过滤 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- MyBatis-Plus for Spring Boot 3 -->
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>${mybatis-plus.version}</version>
        </dependency>

        <!-- MySQL Driver: 版本交给 Spring Boot BOM 管理 -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Mail -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>

        <!-- Scheduler / Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Dev only -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Spring Boot 打包插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>

            <!-- Java 21 编译 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <release>21</release>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## 6. 配置文件设计

### 6.1 application.yml

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: training-echo-backend

  profiles:
    active: local

  jackson:
    time-zone: Asia/Shanghai
    date-format: yyyy-MM-dd HH:mm:ss
    default-property-inclusion: non_null

  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver

  mail:
    host: ${MAIL_HOST:}
    port: ${MAIL_PORT:465}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    protocol: smtp
    properties:
      mail:
        smtp:
          auth: true
          ssl:
            enable: true
          starttls:
            enable: false

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: assign_id
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

app:
  jwt:
    secret: ${JWT_SECRET:please-change-this-secret-at-least-32-bytes}
    expire-hours: ${JWT_EXPIRE_HOURS:720}
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173}
  mail:
    enabled: ${MAIL_ENABLED:false}
    from: ${MAIL_FROM:}
  reminder:
    default-enabled: true
    daily-hour: 20
    daily-minute: 0

management:
  endpoints:
    web:
      exposure:
        include: health,info
```

### 6.2 application-local.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/training_echo?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: training
    password: training123

app:
  mail:
    enabled: false
```

### 6.3 application-docker.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://mysql:3306/training_echo?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER:training}
    password: ${MYSQL_PASSWORD:training123}

app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:https://your-domain.com}
```

### 6.4 application-prod.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:mysql}:${MYSQL_PORT:3306}/${MYSQL_DATABASE:training_echo}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.nologging.NoLoggingImpl

app:
  mail:
    enabled: true
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:https://your-domain.com}
```

---

## 7. 数据库设计

### 7.1 表设计原则

1. 每位用户每天最多一条训练记录。
2. 训练部位可以用 JSON 存储，MVP 简单可用。
3. 体重并入训练记录。
4. 回声内容和写给未来自己的话单独存。
5. 邮件提醒配置单独存。
6. 所有表统一有 `created_at`、`updated_at`、`deleted`。

---

## 8. 建表 SQL

建议创建 `docker/mysql/init/001_schema.sql`。

```sql
CREATE DATABASE IF NOT EXISTS training_echo
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE training_echo;

CREATE TABLE IF NOT EXISTS app_user (
  id BIGINT PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(64) NULL,
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
```

### 8.1 关于 `parts_json`

MVP 推荐用 JSON 存训练部位，例如：

```json
["chest", "back", "cardio"]
```

这样可以减少表数量。  
如果未来要做复杂统计、动作库、肌群分析，再拆成关联表。

### 8.2 关于唯一索引

```sql
UNIQUE KEY uk_user_date_not_deleted (user_id, training_date, deleted)
```

这用于实现：

```txt
每个用户每天最多 1 条未删除训练记录
```

因为 MySQL 没有 PostgreSQL 那种 partial unique index，所以用 `deleted` 参与唯一索引是简单做法。

---

## 9. 枚举设计

### 9.1 训练部位

后端枚举：

```java
public enum TrainingPart {
    CHEST,
    BACK,
    SHOULDER,
    LEGS,
    ARMS,
    CORE,
    CARDIO,
    STRETCH
}
```

前端值建议统一小写：

```txt
chest
back
shoulder
legs
arms
core
cardio
stretch
```

后端可以直接存小写字符串，或者用枚举时做转换。  
为了前后端简单一致，MVP 推荐接口中使用小写字符串。

### 9.2 训练状态

```txt
effective          很有效
normal             正常发挥
tired_but_done     有点累但坚持了
recovery           恢复训练
light              轻松活动一下
```

---

## 10. API 设计

统一前缀：

```txt
/api
```

### 10.1 通用返回结构

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

错误示例：

```json
{
  "code": 40001,
  "message": "请选择训练部位",
  "data": null
}
```

### 10.2 认证接口

#### 注册

```http
POST /api/auth/register
```

请求：

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "10001",
      "email": "user@example.com",
      "nickname": null
    }
  }
}
```

#### 登录

```http
POST /api/auth/login
```

请求：

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

#### 当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 10.3 首页接口

#### 获取首页摘要

```http
GET /api/home/summary
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "today": "2026-05-12",
    "todayRecorded": false,
    "last7Days": {
      "trainingDays": 4,
      "totalDurationMinutes": 210,
      "partCounts": {
        "chest": 1,
        "back": 2,
        "shoulder": 1,
        "legs": 0,
        "arms": 1,
        "core": 0,
        "cardio": 1,
        "stretch": 0
      }
    }
  }
}
```

统计口径：

```txt
近 7 天训练次数 = 近 7 天有记录的天数
近 7 天累计训练时长 = 近 7 天记录 duration_minutes 总和
部位分布 = 近 7 天内各部位出现次数
```

---

### 10.4 训练记录接口

#### 新建记录 / 补记记录

```http
POST /api/training-records
Authorization: Bearer <token>
```

请求：

```json
{
  "date": "2026-05-12",
  "parts": ["chest", "back"],
  "durationMinutes": 60,
  "mood": "normal",
  "weightKg": 70.5,
  "note": "今天卧推状态不错"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "recordId": "10001",
    "echoId": "20001"
  }
}
```

规则：

1. 新建今天记录和补记历史记录都走这个接口。
2. 每位用户每天最多 1 条记录。
3. 如果该日期已有记录，返回业务错误。
4. 新建成功后生成回声。
5. 前端随后跳转 `/echo/:recordId`。

#### 编辑记录

```http
PUT /api/training-records/{recordId}
Authorization: Bearer <token>
```

规则：

1. 只能编辑自己的记录。
2. 编辑不触发回声。
3. 日期不允许修改。
4. 如果要改日期，MVP 不支持；用户可以删除后补记，删除功能可以后置。

#### 查询某天记录

```http
GET /api/training-records/by-date?date=2026-05-12
Authorization: Bearer <token>
```

#### 查询某月记录

```http
GET /api/training-records/month?month=2026-05
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "month": "2026-05",
    "records": [
      {
        "id": "10001",
        "date": "2026-05-12",
        "parts": ["chest", "back"],
        "durationMinutes": 60,
        "mood": "normal",
        "weightKg": 70.5,
        "note": "今天卧推状态不错",
        "hasFutureMessage": true
      }
    ]
  }
}
```

#### 查询上次体重

```http
GET /api/training-records/latest-weight
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "weightKg": 70.5
  }
}
```

---

### 10.5 回声接口

#### 获取本次回声

```http
GET /api/echo/by-record/{recordId}
Authorization: Bearer <token>
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "record": {
      "date": "2026-05-12",
      "parts": ["chest", "back"],
      "durationMinutes": 60,
      "mood": "normal",
      "weightKg": 70.5
    },
    "echo": {
      "source": "fact",
      "content": "这是你近 7 天里的第 4 次训练"
    }
  }
}
```

#### 保存给未来自己的话

```http
POST /api/echo/future-message
Authorization: Bearer <token>
```

请求：

```json
{
  "recordId": "10001",
  "content": "状态一般的时候，更要把节奏保住。"
}
```

规则：

1. 最多 50 字。
2. 每次回声后最多写 1 条。
3. 保存为 `echo_message.source = future_message`。
4. 未来新建记录时优先参与回声候选。

---

### 10.6 邮件提醒配置接口

#### 获取提醒配置

```http
GET /api/reminder/config
Authorization: Bearer <token>
```

#### 更新提醒开关

```http
PUT /api/reminder/config
Authorization: Bearer <token>
```

请求：

```json
{
  "enabled": true
}
```

MVP 规则：

1. 默认开启。
2. 时间固定每天 20:00。
3. 不支持用户自定义提醒时间。
4. 不做短信提醒。
5. 不做智能提醒。

---

## 11. 回声生成策略

回声只在新建记录成功后生成。

包括：

1. 首页新建今天记录。
2. 日志页补记某天记录。

不包括：

1. 编辑已有记录。
2. 打开首页。
3. 打开日志页。
4. 修改提醒配置。

### 11.1 生成优先级

```txt
过去写给未来自己的话
↓
事实反馈
↓
系统默认文案
```

### 11.2 初始概率

```txt
未来话命中概率：70%
事实反馈命中概率：70%
默认文案：兜底
```

### 11.3 默认文案

```txt
节奏不会一下子成形，但会慢慢留下痕迹。
不必每次都状态最好，回来就很好。
在普通的一天完成训练，也很难得。
```

### 11.4 事实反馈模板

```txt
这是你近 7 天里的第 N 次训练
近 7 天累计训练时长已达 X 分钟
今天是你近 7 天第一次腿部训练
今天是你近 7 天第一次有氧训练
```

### 11.5 去重规则

1. 未来话最近 3 次回声出现过的不再重复。
2. 系统默认文案避免连续两次完全相同。
3. 事实反馈 MVP 暂不做复杂去重。

---

## 12. 认证与安全

### 12.1 登录方案

MVP 推荐：

```txt
邮箱 + 密码 + JWT
```

原因：

1. 前后端分离简单。
2. 适合 PWA。
3. 不需要服务端 session 存储。
4. 不引入 Redis。

### 12.2 密码存储

禁止明文存储密码。  
使用 BCrypt：

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

数据库只存：

```txt
password_hash
```

### 12.3 JWT 存储

前端 MVP 可以先存在 `localStorage`。

注意：

1. 必须全站 HTTPS。
2. JWT 过期时间不要无限长。
3. 退出登录时前端删除 token。
4. 后续如果安全要求提高，可以改成 HttpOnly Cookie。

### 12.4 CORS

本地：

```txt
http://localhost:5173
```

生产：

```txt
https://your-domain.com
```

不要生产环境直接放开：

```txt
*
```

---

## 13. 邮件提醒方案

### 13.1 推荐邮件服务

你计划用国产发邮件服务，推荐：

```txt
腾讯云 SES
```

原因：

1. 有控制台。
2. 支持 API。
3. 支持 SMTP。
4. 适合通知邮件、验证码邮件、业务提醒邮件。

### 13.2 重要注意

腾讯云 SES 当前有一个重要限制：  
新开通 SES 的个人认证用户，可能无法继续使用 SMTP 发信，建议使用企业认证账号，或改用 API/控制台发送。

因此代码层必须抽象：

```java
public interface EmailSender {
    void sendText(String to, String subject, String content);
}
```

实现可以有三个：

```txt
NoopEmailSender              本地开发，不真的发邮件
TencentSesSmtpEmailSender    SMTP 可用时使用
TencentSesApiEmailSender     SMTP 不可用时切 API
```

### 13.3 MVP 推荐

本地：

```txt
MAIL_ENABLED=false
```

生产：

```txt
MAIL_ENABLED=true
```

如果你的腾讯云账号支持 SMTP，先用 SMTP，代码简单。  
如果不支持 SMTP，再切腾讯云 SES API。

### 13.4 定时任务

MVP 每天固定 20:00 扫描开启提醒的用户，发送邮件。

```java
@Scheduled(cron = "0 0 20 * * ?", zone = "Asia/Shanghai")
public void sendDailyReminder() {
    // 查询 enabled = 1 的提醒配置
    // 给用户邮箱发送提醒邮件
}
```

邮件文案：

```txt
今天如果有训练，别忘了回来记一下。
练完之后，回来留下一条记录。
今天的训练，也值得被记下来。
```

---

## 14. 本地 Docker 验证方案

推荐本地目录：

```txt
project-root/
  backend/
  frontend/
  docker/
    mysql/
      init/
        001_schema.sql
    nginx/
      nginx.local.conf
  docker-compose.local.yml
```

### 14.1 backend/Dockerfile

```dockerfile
# build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

ENV TZ=Asia/Shanghai

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

### 14.2 docker-compose.local.yml

```yaml
services:
  mysql:
    image: mysql:8.4.9
    container_name: training-echo-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123456
      MYSQL_DATABASE: training_echo
      MYSQL_USER: training
      MYSQL_PASSWORD: training123
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_0900_ai_ci
      - --default-time-zone=+08:00
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -proot123456 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: training-echo-backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: docker
      MYSQL_USER: training
      MYSQL_PASSWORD: training123
      JWT_SECRET: please-change-this-secret-at-least-32-bytes
      CORS_ALLOWED_ORIGINS: http://localhost:5173,http://localhost:8081
      MAIL_ENABLED: "false"
      TZ: Asia/Shanghai
    ports:
      - "8080:8080"

volumes:
  mysql_data:
```

启动：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

查看日志：

```bash
docker logs -f training-echo-backend
```

测试健康检查：

```bash
curl http://localhost:8080/api/actuator/health
```

---

## 15. 本地前后端联调

### 15.1 前端开发模式

前端本地：

```bash
cd frontend
pnpm dev
```

前端访问：

```txt
http://localhost:5173
```

后端访问：

```txt
http://localhost:8080/api
```

前端 `.env.local`：

```txt
VITE_API_BASE_URL=http://localhost:8080/api
```

### 15.2 推荐联调顺序

1. 启动 MySQL。
2. 启动后端。
3. Postman / curl 测试注册登录。
4. 前端接登录接口。
5. 前端接首页摘要。
6. 前端接新建训练记录。
7. 前端接回声页。
8. 前端接日志月历。

---

## 16. 生产部署方案：阿里云 ECS + Docker + Nginx

### 16.1 服务器建议

MVP 初期配置：

```txt
阿里云 ECS
2 vCPU
2 GB RAM 起步
40 GB 云盘
Ubuntu 22.04 / 24.04 LTS
```

如果预算允许，建议：

```txt
2 vCPU
4 GB RAM
```

MySQL 和后端都跑 Docker，2GB 可用但比较紧，4GB 更舒服。

### 16.2 生产目录

```txt
/opt/training-echo/
  docker-compose.prod.yml
  .env
  nginx/
    nginx.conf
  frontend/
    dist/
  mysql/
    data/
```

### 16.3 docker-compose.prod.yml

```yaml
services:
  mysql:
    image: mysql:8.4.9
    container_name: training-echo-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TZ: Asia/Shanghai
    volumes:
      - ./mysql/data:/var/lib/mysql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_0900_ai_ci
      - --default-time-zone=+08:00
    networks:
      - training_net

  backend:
    image: training-echo-backend:latest
    container_name: training-echo-backend
    restart: unless-stopped
    depends_on:
      - mysql
    environment:
      SPRING_PROFILES_ACTIVE: prod
      MYSQL_HOST: mysql
      MYSQL_PORT: 3306
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
      MAIL_ENABLED: ${MAIL_ENABLED}
      MAIL_HOST: ${MAIL_HOST}
      MAIL_PORT: ${MAIL_PORT}
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
      MAIL_FROM: ${MAIL_FROM}
      TZ: Asia/Shanghai
    networks:
      - training_net

  nginx:
    image: nginx:1.28-alpine
    container_name: training-echo-nginx
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      # 如果你后续配 HTTPS，可挂载证书目录
      # - ./certs:/etc/nginx/certs:ro
    networks:
      - training_net

networks:
  training_net:
    driver: bridge
```

### 16.4 .env 示例

```txt
MYSQL_ROOT_PASSWORD=change-root-password
MYSQL_DATABASE=training_echo
MYSQL_USER=training
MYSQL_PASSWORD=change-training-password

JWT_SECRET=please-change-this-secret-at-least-32-bytes-in-production
CORS_ALLOWED_ORIGINS=https://your-domain.com

MAIL_ENABLED=true
MAIL_HOST=smtp.qcloudmail.com
MAIL_PORT=465
MAIL_USERNAME=your-smtp-user
MAIL_PASSWORD=your-smtp-password
MAIL_FROM=your-sender@example.com
```

---

## 17. Nginx 配置

### 17.1 nginx.conf

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 5m;

    # 前端 SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://backend:8080/api/;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # 静态资源缓存
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
    }
}
```

### 17.2 HTTPS

生产必须上 HTTPS，尤其你要做登录。

推荐：

```txt
域名 DNS 指向阿里云 ECS
Nginx 监听 80/443
证书使用阿里云免费证书 / Let's Encrypt
HTTP 自动跳 HTTPS
```

MVP 可以先跑通 HTTP，但正式自己使用前建议尽快切 HTTPS。

---

## 18. 日志与监控

MVP 简单做：

1. 后端输出 JSON 或普通控制台日志。
2. Docker logs 查看。
3. Spring Boot Actuator 暴露 health。
4. Nginx access/error log 默认保留。

后续再考虑：

```txt
Prometheus
Grafana
ELK
Sentry
```

MVP 不需要。

---

## 19. 备份策略

即使是个人项目，也要备份 MySQL。

### 19.1 手动备份命令

```bash
docker exec training-echo-mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" training_echo \
  > backup_$(date +%F_%H%M%S).sql
```

### 19.2 推荐备份频率

MVP：

```txt
每周一次
```

如果使用频繁：

```txt
每天一次
```

### 19.3 备份位置

不要只放服务器本机。  
建议定期下载到本地，或上传到对象存储。

---

## 20. 开发优先级

### P0：必须完成

1. 项目初始化。
2. MySQL 表结构。
3. 注册 / 登录。
4. JWT 鉴权。
5. 首页近 7 天摘要。
6. 新建训练记录。
7. 编辑训练记录。
8. 按日期查询记录。
9. 按月份查询记录。
10. 新建记录后生成回声。
11. 保存未来话。
12. 邮件提醒配置开关。
13. Docker Compose 本地跑通。
14. 前后端联调。

### P1：体验完善

1. 邮件提醒定时任务。
2. 统一异常处理。
3. 参数校验。
4. 保存失败提示。
5. 健康检查。
6. Nginx 部署。
7. HTTPS。
8. 数据库备份脚本。

### P2：以后再做

1. 删除训练记录。
2. 邮件提醒时间自定义。
3. 邮件退订。
4. 深色模式。
5. 更复杂的统计。
6. 动作库。
7. Apple Health 接入。
8. Redis。
9. 管理后台。

---

## 21. 不建议现在做的东西

MVP 阶段不建议加入：

```txt
Redis
RabbitMQ
Spring Cloud
Kubernetes
复杂 RBAC 权限
管理后台
多租户
复杂报表
复杂训练动作库
复杂 CI/CD
对象存储
短信
微信登录
支付宝/支付
```

原因：当前产品重点是快速验证核心体验。

---

## 22. 接口命名约定

推荐 REST 风格，但不要过度教条。

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/home/summary

POST   /api/training-records
PUT    /api/training-records/{id}
GET    /api/training-records/by-date
GET    /api/training-records/month
GET    /api/training-records/latest-weight

GET    /api/echo/by-record/{recordId}
POST   /api/echo/future-message

GET    /api/reminder/config
PUT    /api/reminder/config
```

---

## 23. 参数校验规则

### 23.1 注册

```txt
email: 必填，邮箱格式，最长 191
password: 必填，最短 8 位
```

### 23.2 训练记录

```txt
date: 必填，YYYY-MM-DD
parts: 必填，至少 1 个
durationMinutes: 必填，5–300
mood: 必填，限定枚举
weightKg: 可选，建议 20–300
note: 可选，最多 500
```

### 23.3 未来话

```txt
content: 必填，1–50 字
recordId: 必填，且必须属于当前用户
```

---

## 24. 关键业务规则

1. 每位用户每天最多 1 条训练记录。
2. 首页已有今日记录后，不再允许再次新建今日记录。
3. 编辑已有记录不触发回声。
4. 新建记录和补记历史记录都会触发回声。
5. 给未来自己的话每次回声后最多写 1 条。
6. 邮件提醒默认开启。
7. 邮件提醒时间 MVP 固定为每天 20:00。
8. 日志页按月份查询，不一次性加载所有历史记录。
9. 训练日期不允许在编辑页修改。
10. 所有查询必须按当前用户隔离数据。

---

## 25. 本地验证 Checklist

```txt
[ ] docker compose 启动 MySQL 成功
[ ] 后端启动成功
[ ] /api/actuator/health 返回 UP
[ ] 注册成功
[ ] 登录成功
[ ] 带 JWT 调 /api/auth/me 成功
[ ] 首页摘要接口成功
[ ] 新建训练记录成功
[ ] 重复新建同一天记录失败
[ ] 新建记录后能查到回声
[ ] 编辑记录成功且不新建回声
[ ] 按月份查询记录成功
[ ] 保存未来话成功
[ ] 邮件提醒配置查询成功
[ ] 邮件提醒开关更新成功
[ ] 前端能通过 VITE_API_BASE_URL 调后端
```

---

## 26. 阿里云部署 Checklist

```txt
[ ] 服务器安装 Docker
[ ] 服务器安装 Docker Compose v2
[ ] 放行 80 / 443 端口
[ ] 域名解析到 ECS 公网 IP
[ ] 上传 docker-compose.prod.yml
[ ] 上传 .env
[ ] 构建 backend 镜像
[ ] 上传 frontend/dist
[ ] 启动 docker compose
[ ] Nginx 能访问首页
[ ] /api/actuator/health 正常
[ ] 注册登录正常
[ ] HTTPS 配置完成
[ ] 数据库备份脚本配置完成
```

---

## 27. 结论

最终推荐后端方案：

```txt
Java 21
Spring Boot 3.5.14
Spring MVC
MyBatis-Plus 3.5.16 boot3 starter
MySQL 8.4.9
Lombok
Spring Security + JWT
Spring Scheduler
Spring Mail / Tencent Cloud SES
Docker Compose
Nginx
阿里云 ECS
```

这套方案的特点：

1. 技术栈成熟。
2. 版本兼容风险低。
3. 本地和生产环境一致。
4. Docker 部署简单。
5. 后端结构清晰。
6. 能支撑当前 MVP。
7. 后续如果产品做大，也能平滑演进。
