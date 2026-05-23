# EchoFit

EchoFit 是一个移动端优先、安静克制的私人训练记录 Web App。

它不做复杂课程、不做社交比较，也不靠打卡压力驱动使用；它只专注三件事：快速记录今天的训练、回看最近一段时间的节奏，以及在每次记录完成后给你一条属于自己的“回声”。

## 当前状态

这个仓库已经不是纯工程骨架，当前包含一套可运行的前后端 MVP：

- 前端：登录注册、今日页、训练记录、日志月历、洞察页、回声页、设置页
- 后端：认证、训练记录、休息日、洞察统计、提醒配置、未来留言、图片存储
- 部署：本地 Docker Compose 联调方案、阿里云部署配置、Nginx 反向代理

## 核心功能

- 登录与注册：邮箱验证码注册、登录态持久化、修改密码、首次进入补充性别
- 今日：展示最近 7 天训练概览、今日是否已记录、是否标记为休息日、提醒开关
- 记录训练：支持训练部位、时长、状态、体重、备注、训练照片
- 回声：训练记录完成后生成一条反馈，并支持写一句“留给未来自己的话”
- 日志：按月历回看训练和休息日，支持补记历史训练和编辑已有记录
- 洞察：按周、月或自定义时间范围查看训练天数、总时长、部位分布、回声摘录
- 提醒：后端包含每日提醒配置与邮件发送基础设施

## 技术栈

- 前端：`Vite 7.1.4`、`React 18.3.1`、`TypeScript 5.9`、`React Router DOM 6.30.1`、`Zustand 5.0.8`、`Ant Design Mobile 5.40.0`、`Vite PWA`
- 后端：`Java 21`、`Spring Boot 3.5.14`、`Spring Security`、`MyBatis-Plus 3.5.16`、`JWT`、`Spring Mail`、`Redis`
- 基础设施：`MySQL 8.4.9`、`Redis 7.4.2`、`Nginx 1.27`、`Docker Compose`

详细版本说明见 [docs/version-baseline.md](docs/version-baseline.md)。

## 项目结构

```text
frontend/                    Vite + React 前端
backend/                     Spring Boot 后端
docs/                        产品、接口与部署文档
deploy/                      本地与阿里云环境变量模板
docker/mysql/init/           MySQL 初始化脚本
data/uploads/                训练照片持久化目录
docker-compose.local.yml     本地整套联调
docker-compose.aliyun.yml    阿里云部署
```

## 环境要求

- 使用 Docker Compose 跑整套环境：`Docker`、`Docker Compose`
- 前后端分别本地开发：`Node.js >= 20.19`、`npm`、`Java 21`、`Maven 3.9+`

## 本地启动

### 方式一：直接用 Docker Compose 跑整套环境

适合快速体验或联调整套服务。

1. 准备环境变量文件

```bash
cp deploy/local.env.example deploy/local.env
```

2. 启动 MySQL、Redis、后端、前端

```bash
docker compose -f docker-compose.local.yml up -d --build
```

3. 访问服务

- 前端：http://localhost:8081
- 后端：http://localhost:8080/api
- MySQL：`localhost:3306`
- Redis：`localhost:6379`

训练照片会落到仓库下的 `data/uploads/` 目录。

### 方式二：前后端分别本地开发

适合需要热更新和独立调试时使用。

1. 先启动基础依赖

```bash
docker compose -f docker-compose.local.yml up -d mysql redis
```

2. 启动后端

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

后端默认监听 `http://localhost:8080/api`。

3. 启动前端

```bash
cd frontend
npm ci
npm run dev
```

前端开发服务器默认地址为 `http://localhost:5173`，并已将 `/api` 代理到 `http://localhost:8080`。

## 环境变量

本项目主要使用以下配置文件：

- `deploy/local.env.example`：本地 Docker Compose 环境变量模板
- `deploy/aliyun.env.example`：阿里云部署环境变量模板
- `frontend/.env.example`：前端接口地址覆盖模板，默认值为 `/api`

需要重点关注的配置项：

- `JWT_SECRET`：JWT 签名密钥，生产环境必须替换
- `MYSQL_*`：数据库连接信息
- `REDIS_*`：Redis 连接信息
- `MAIL_*`：邮件提醒发送配置
- `SERVER_HOST`：阿里云部署时的服务器域名或公网 IP

## 主要接口模块

后端统一以 `/api` 为前缀，核心模块包括：

- `/auth`：注册验证码、注册、登录、当前用户
- `/user`：性别资料、修改密码、修改密码验证码
- `/home`：今日页训练摘要
- `/training-records`：训练记录、休息日、月历数据、最新体重
- `/echo`：训练回声、未来留言
- `/insights`：时间区间洞察统计、回声分页
- `/reminder`：提醒配置

完整接口约定见 [docs/api-contract.md](docs/api-contract.md)。

## 部署

仓库内已经提供阿里云部署编排文件：

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build
```

部署前请至少确认以下内容：

- `SERVER_HOST` 已设置为实际公网 IP 或域名
- `JWT_SECRET`、数据库密码等敏感配置已替换
- 若开启邮件提醒，`MAIL_*` 配置已可用

部署细节可参考：

- [docs/deploy-aliyun.md](docs/deploy-aliyun.md)
- [docs/echofit-images-storage-aliyun-deploy.md](docs/echofit-images-storage-aliyun-deploy.md)

## 相关文档

- [docs/api-contract.md](docs/api-contract.md)：接口契约
- [docs/echo-logic.md](docs/echo-logic.md)：回声机制说明
- [docs/version-baseline.md](docs/version-baseline.md)：版本基线与选型说明
- [fitness-training-log-mvp-prd-v2.md](fitness-training-log-mvp-prd-v2.md)：MVP 产品需求
- [frontend-ui-ux-tech-stack.md](frontend-ui-ux-tech-stack.md)：前端设计与技术方案
- [backend-tech-stack-springboot.md](backend-tech-stack-springboot.md)：后端技术方案
