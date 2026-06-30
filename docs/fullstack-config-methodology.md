# 前后端项目配置方法论（Docker 本地 + 阿里云部署）

## 1. 适用范围

适用于这类典型项目：

- 前端：`Vite + React` 一类 SPA
- 后端：`Spring Boot` 一类 API 服务
- 基础设施：`MySQL`、`Redis`、`Nginx`
- 运行方式：本地 `Docker Compose` 联调，阿里云单机 Docker 部署

目标只有两个：

- 本地开发和联调稳定
- 阿里云部署后地址、数据、上传目录、反向代理都不出错

## 2. 核心原则

- 配置分层，不把所有配置堆进一个文件。
- 前端永远只访问 `/api`，不要在浏览器里直连后端 IP。
- 浏览器访问地址和容器内部访问地址分开设计。
- 本地和生产分别维护编排文件，不混用。
- 数据库、Redis、JWT、邮件、文件存储路径全部环境变量化。
- 有状态数据必须显式持久化，不能依赖容器临时层。
- 生产是否可用以健康检查和接口验证为准，不以“容器启动了”为准。
- 仓库只提交 `*.example`，真实 `env` 不入库。

## 3. 推荐目录结构

```text
backend/
  src/main/resources/
    application.yml
    application-local.yml
    application-docker.yml
    application-prod.yml
  Dockerfile

frontend/
  .env.example
  nginx.conf
  nginx.aliyun.conf
  Dockerfile

deploy/
  local.env.example
  aliyun.env.example

docker/
  mysql/init/

data/uploads/

docker-compose.local.yml
docker-compose.aliyun.yml
```

## 4. 配置应该怎么分层

### 4.1 后端配置

- `application.yml` 放全环境通用配置。
- `application-local.yml` 放本机开发配置，通常直连 `localhost`。
- `application-docker.yml` 放容器运行配置，数据库和 Redis 主机名从环境变量读取。
- `application-prod.yml` 放生产专属开关，例如收紧 CORS、关闭 SQL 明细日志。

后端配置建议固定这样写：

- API 前缀统一，例如 `/api`
- JWT 密钥走 `JWT_SECRET`
- CORS 白名单走 `CORS_ALLOWED_ORIGINS`
- 上传根目录走 `TRAINING_PHOTO_STORAGE_ROOT`
- MySQL/Redis 地址不要写死，统一走 `MYSQL_*`、`REDIS_*`

### 4.2 前端配置

- 前端默认接口地址只保留 `VITE_API_BASE_URL=/api`
- 开发态由 Vite 代理 `/api -> http://localhost:8080`
- 容器态由 Nginx 代理 `/api -> backend`
- 不要把后端公网 IP、域名直接写进前端代码

这样做的好处是：

- 本地开发、Docker、本地浏览器访问方式一致
- 切换域名、端口、反向代理时，前端业务代码不用改

### 4.3 Compose 配置

- `docker-compose.local.yml` 负责本地联调
- `docker-compose.aliyun.yml` 负责阿里云部署
- 本地和生产共用镜像构建逻辑，但不要共用网络和端口策略
- 敏感值在生产 compose 里用 `${VAR:?required}` 强制校验

## 5. 本地 Docker 标准模式

本地默认用 Docker bridge 网络，这是第一选择。

标准做法：

- `frontend` 通过 `backend:8080` 反代后端
- `backend` 通过 `mysql:3306`、`redis:6379` 访问依赖
- MySQL、Redis、后端、前端都保留必要端口映射，方便本机调试
- `depends_on + healthcheck` 保证后端在依赖就绪后再启动

本项目里对应的是：

- `docker-compose.local.yml`
- `frontend/nginx.conf`
- `backend/src/main/resources/application-docker.yml`

本地模式下，Nginx 反代容器服务名时建议加：

```nginx
resolver 127.0.0.11 valid=30s ipv6=off;
```

原因是 Nginx 会缓存容器 IP，服务重建后容易指向旧地址。

## 6. 阿里云部署标准模式

阿里云部署默认直接使用当前项目已经验证过的 `host` 网络方案，不再把标准 bridge 网络当作优先方案。

- `frontend` 使用 `network_mode: host`
- `backend` 使用 `network_mode: host`
- 前端 Nginx 改为 `proxy_pass http://127.0.0.1:8080`
- 后端改为 `MYSQL_HOST=127.0.0.1`
- 后端改为 `REDIS_HOST=127.0.0.1`
- MySQL、Redis 只绑定到宿主机回环地址，例如 `127.0.0.1:3306:3306`

这个方案的本质是：

- 浏览器只访问一个入口
- 前端和后端走宿主机本地回环
- 数据库和 Redis 不暴露公网
- 绕开不稳定的容器互联链路

本项目里对应的是：

- `docker-compose.aliyun.yml`
- `frontend/nginx.aliyun.conf`

这样写不是理论上的“最通用 Docker 写法”，而是当前阿里云场景下更稳定的基线方案。
只有在后续明确验证过目标 ECS 的 bridge 网络长期稳定时，才考虑切回容器服务名互联。

## 7. 持久化必须这样做

- MySQL 用 named volume，例如 `mysql_data`
- Redis 用 named volume，例如 `redis_data`
- 上传文件用宿主机目录挂载，例如 `./data/uploads:/app/data/uploads`
- 后端代码只认容器内路径，例如 `/app/data/uploads` 对应的逻辑路径

这样分层后：

- 数据库和缓存重建容器不会丢
- 上传文件不会跟着镜像一起丢
- 后续从本地磁盘切到 OSS/S3 时，只需要替换存储实现

## 8. 初始化 SQL 的规则

- `docker/mysql/init/*.sql` 只会在数据库目录首次初始化时执行
- 卷已经存在后，修改这些 SQL 不会自动重跑
- 后续表结构变更要走迁移脚本或手工执行 SQL

这一条必须写进团队约定，否则很容易误判“为什么我改了 SQL 没生效”。

## 9. 构建层的推荐做法

- 前后端都用多阶段构建
- `.dockerignore` 排除 `target`、`node_modules`、`dist`、日志文件
- Maven 和 npm 安装依赖时加镜像源、缓存、重试
- 镜像版本尽量固定，不要长期漂浮 `latest`

本项目已经体现了这些点：

- 后端 `Dockerfile` 使用 Maven 缓存和重试
- 后端单独维护 `backend/.mvn/settings-docker.xml`
- 前端 `Dockerfile` 使用 `npmmirror`
- 本地容器构建通过 `build args` 控制 `PWA` 开关

## 10. 环境变量清单

| 变量 | 用途 | 规则 |
| --- | --- | --- |
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 仅 root 使用 |
| `MYSQL_DATABASE` | 业务库名 | 本地和生产保持一致更省事 |
| `MYSQL_USER` | 业务账号 | 不要写成 `root` |
| `MYSQL_PASSWORD` | 业务账号密码 | 生产必须替换 |
| `REDIS_HOST` / `REDIS_PORT` | Redis 地址 | 本地 bridge 用服务名，host 网络用 `127.0.0.1` |
| `JWT_SECRET` | JWT 签名密钥 | 生产必须是随机强密钥 |
| `CORS_ALLOWED_ORIGINS` | 前端来源白名单 | 生产不要保留本地通配 |
| `MAIL_*` | 邮件能力 | 只有开启邮件功能时才配置 |
| `TRAINING_PHOTO_STORAGE_ROOT` | 上传目录根路径 | 必须和 volume 挂载设计一致 |
| `SERVER_HOST` | 生产入口域名/IP | 供生产 compose 或部署文档使用 |

## 11. 后续项目的标准启动方式

本地：

```bash
cp deploy/local.env.example deploy/local.env
docker compose -f docker-compose.local.yml up -d --build
```

阿里云：

建议后续项目都补一份 `deploy/aliyun.env.example`。如果当前仓库还没有这个模板，就按上面的环境变量清单手工创建 `deploy/aliyun.env`。

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

变更了以下任意内容后，不要只做 `restart`：

- `Dockerfile`
- compose
- Nginx 配置
- Spring profile
- 环境变量

正确做法仍然是重新 `up -d --build --force-recreate`。

## 12. 部署后最少验收项

- `docker compose ps`
- `curl http://127.0.0.1:8080/api/actuator/health`
- 浏览器打开首页和登录页
- 至少打通一次核心业务接口
- 检查 `frontend`、`backend`、`mysql` 日志

如果健康检查不是 `UP`，就不要认为部署成功。

## 13. 不要这样配

- 不要把后端公网地址写死在前端代码里
- 不要把真实 `env` 文件提交到仓库
- 不要把 MySQL、Redis 直接暴露到公网
- 不要把本地和生产配置写进同一个 profile
- 不要修改初始化 SQL 后期待老数据卷自动生效
- 不要把 `MYSQL_USER` 写成 `root`

## 14. 对后续项目的直接建议

后续开发同类项目时，可以直接沿用这套骨架：

- 保留 `local`、`docker`、`prod` 三层后端配置
- 保留 `local`、`aliyun` 两套 compose
- 前端接口基址固定 `/api`
- 用 Nginx 统一收口前后端
- 提前把上传目录、数据库卷、Redis 卷设计清楚

真正需要按项目微调的，通常只有这些：

- 域名和 HTTPS
- 是否启用邮件
- 是否接 OSS/S3
- 是否在新机器上经过验证后，允许从默认 `host` 网络切回 bridge 网络
- 端口、上传大小、健康检查、资源配额

结论：后续项目先复制这套分层方式，再改业务本身；不要每次从零重新想配置结构。
