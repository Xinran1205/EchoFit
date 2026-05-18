# EchoFit 阿里云 Docker 部署基线文档

## 1. 文档目的

这份文档是 EchoFit 当前线上部署方案的基线说明。

它基于当前仓库里已经验证通过的文件和本次线上故障排查结果整理而成，目标是：

- 给后续部署提供一个可直接复用的标准方案
- 解释为什么当前配置要这样写，而不是使用更“通用”的默认 Docker bridge 方式
- 记录这次线上踩过的坑，避免后续重复踩坑
- 明确哪些文件是本次稳定部署的关键参考

结论先写在前面：

- 当前阿里云部署方案已经跑通
- 后续线上部署，优先沿用当前仓库里的生产配置
- 不建议在未验证前，随意改回 `frontend -> backend -> mysql` 全走容器桥接网络的方式

## 2. 当前稳定部署拓扑

当前线上稳定方案不是“纯容器互联”，而是“前后端走宿主机回环地址”。

原因很直接：这台阿里云机器上的 Docker bridge 网络在容器互联时出现了 `No route to host` / `Host is unreachable`，导致：

- `frontend` 无法通过容器 IP 访问 `backend`
- `backend` 无法通过容器 IP 访问 `mysql`

因此最终稳定方案是：

```mermaid
flowchart LR
    A["浏览器 / 用户"] --> B["Nginx 前端容器<br/>host network"]
    B --> C["127.0.0.1:8080"]
    C --> D["Spring Boot 后端容器<br/>host network"]
    D --> E["127.0.0.1:3306"]
    E --> F["MySQL 容器<br/>仅绑定宿主机回环"]
```

这套方案的关键点：

- 前端容器使用 `host` 网络
- 后端容器使用 `host` 网络
- 前端 Nginx 直接代理 `127.0.0.1:8080`
- MySQL 只绑定到宿主机 `127.0.0.1:3306`
- 后端通过 `127.0.0.1:3306` 访问 MySQL
- MySQL 不对公网暴露
- 浏览器只访问一个公网地址：`http://<SERVER_HOST>`

## 3. 当前关键文件与职责

以下文件构成了当前的生产部署基线。

### 3.1 `docker-compose.aliyun.yml`

路径：

- `docker-compose.aliyun.yml`

职责：

- 定义阿里云生产环境的 3 个服务：`mysql`、`backend`、`frontend`
- 约束镜像构建网络
- 定义服务启动顺序
- 定义端口绑定方式
- 定义生产环境变量注入方式

当前关键设计：

- `mysql` 绑定 `127.0.0.1:3306:3306`
- `backend.build.network: host`
- `frontend.build.network: host`
- `backend` 设置 `network_mode: host`
- `backend` 注入：
  - `MYSQL_HOST=127.0.0.1`
  - `MYSQL_PORT=3306`
- `frontend` 设置 `network_mode: host`
- `frontend` 挂载：
  - `./frontend/nginx.aliyun.conf:/etc/nginx/conf.d/default.conf:ro`

这几项是本次稳定运行的核心。

额外说明：

- `build.network: host` 只影响镜像构建阶段
- `network_mode: host` 影响容器运行阶段

两者不是一回事，但当前生产环境两个都保留，是因为：

- 构建阶段需要尽量降低 DNS 和依赖下载失败的概率
- 运行阶段需要绕过不稳定的容器桥接网络

### 3.2 `frontend/nginx.aliyun.conf`

路径：

- `frontend/nginx.aliyun.conf`

职责：

- 生产环境下的前端 Nginx 配置
- 提供静态资源服务
- 将 `/api/*` 转发给后端

当前关键设计：

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:8080;
}
```

这表示：

- 前端不再通过 `backend:8080` 访问后端
- 而是通过宿主机回环地址访问后端

这是规避容器桥接网络异常的关键。

### 3.3 `frontend/nginx.conf`

路径：

- `frontend/nginx.conf`

职责：

- 默认前端镜像内置 Nginx 配置
- 更适合本地或容器桥接网络正常的场景

当前关键设计：

- 它仍然保留了 `backend:8080` 的代理思路
- 同时加入了 `resolver 127.0.0.11`，避免 Nginx 长时间缓存旧的容器 IP

这份配置仍然有价值，但不是当前阿里云生产的最终基线。

### 3.4 `backend/src/main/resources/application-docker.yml`

路径：

- `backend/src/main/resources/application-docker.yml`

职责：

- Spring Boot 在 `docker` profile 下的数据库和 CORS 配置

当前关键设计：

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:mysql}:${MYSQL_PORT:3306}/${MYSQL_DATABASE:training_echo}?...
```

这次修复的关键点是把它从固定的：

- `mysql:3306`

改成了可配置的：

- `${MYSQL_HOST}`
- `${MYSQL_PORT}`

这样：

- 本地 Docker bridge 环境仍可默认使用 `mysql:3306`
- 阿里云生产环境可以显式指定 `127.0.0.1:3306`

### 3.5 `deploy/aliyun.env.example`

路径：

- `deploy/aliyun.env.example`

职责：

- 生产环境变量模板

建议始终基于它复制出真实环境文件：

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
```

### 3.6 `docker/mysql/init/001_schema.sql`

路径：

- `docker/mysql/init/001_schema.sql`

职责：

- 初始化数据库和表结构

注意：

- MySQL 官方镜像只会在数据目录第一次初始化时执行这个目录下的脚本
- 如果 `mysql_data` 卷已经存在，再修改 SQL 文件，不会自动重跑
- 如果已经有旧卷，想应用新表结构，需要手动执行 SQL 或清卷重建

### 3.7 Dockerfile

路径：

- `backend/Dockerfile`
- `frontend/Dockerfile`

职责：

- 后端构建使用 Maven 镜像，并带依赖预热和重试
- 前端构建使用 Node 镜像，并使用 `npmmirror` 与重试
- 两者都针对国内服务器构建成功率做了优化

这也是当前方案可以稳定在阿里云上构建的一个重要前提。

## 4. 当前生产方案为什么这样设计

### 4.1 为什么前后端不直接走容器服务名

理论上更常见的写法是：

- Nginx 代理到 `http://backend:8080`
- 后端 JDBC 连接到 `mysql:3306`

但这次线上实际出现了以下问题：

- Nginx 报 `Host is unreachable`
- 后端报 `No route to host`
- 后端健康检查返回 `DOWN`

这说明在当前阿里云机器上，容器桥接网络并不稳定，至少不能作为当前部署基线依赖。

因此，当前生产方案故意改为：

- `frontend -> 127.0.0.1:8080`
- `backend -> 127.0.0.1:3306`

这样做的收益是：

- 绕过不稳定的容器桥接路由
- 只依赖宿主机本地回环通信
- 排障路径更短
- 线上行为更容易验证

### 4.2 为什么 MySQL 只绑定到 `127.0.0.1`

当前配置：

```yaml
ports:
  - "127.0.0.1:3306:3306"
```

这意味着：

- MySQL 暴露给宿主机本地
- 不暴露给公网
- 后端可以通过 `127.0.0.1:3306` 访问

这比直接绑定 `3306:3306` 更安全。

### 4.3 为什么前后端使用 `host` 网络

当前配置里，`backend` 和 `frontend` 都使用了：

```yaml
network_mode: host
```

目的不是追求“性能极限”，而是为了稳定性：

- 让后端直接监听宿主机 `127.0.0.1:8080`
- 让前端 Nginx 直接访问宿主机 `127.0.0.1:8080`
- 避免再走桥接网络

这是当前线上环境经过故障验证后的结果。

### 4.4 为什么构建阶段也使用 `host` 网络

`docker-compose.aliyun.yml` 里，`backend` 和 `frontend` 的 `build` 块都使用了：

```yaml
build:
  network: host
```

它的目的不是影响运行时链路，而是为了让构建阶段下载依赖更稳定：

- Maven 依赖下载更稳定
- npm 依赖下载更稳定
- 在云服务器 DNS 不稳定时，构建成功率更高

配合以下仓库内已有优化：

- `backend/Dockerfile` 使用 Maven 阿里云镜像配置
- `frontend/Dockerfile` 使用 `npmmirror`
- 两边都带下载重试逻辑

## 5. 本次故障复盘

以下问题都是真实发生过的，后续部署要重点规避。

### 5.1 MySQL 启动失败：`MYSQL_USER="root"`

报错示例：

```text
MYSQL_USER="root", MYSQL_USER and MYSQL_PASSWORD are for configuring a regular user and cannot be used for the root user
```

原因：

- `MYSQL_USER` / `MYSQL_PASSWORD` 只能创建普通用户
- 不能把 `MYSQL_USER` 设成 `root`

正确做法：

- root 密码使用 `MYSQL_ROOT_PASSWORD`
- 普通业务用户使用：
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`

错误示例：

```env
MYSQL_USER=root
```

正确示例：

```env
MYSQL_ROOT_PASSWORD=...
MYSQL_USER=training_echo
MYSQL_PASSWORD=...
```

### 5.2 前端请求 502：`Host is unreachable`

报错示例：

```text
connect() failed (113: Host is unreachable) while connecting to upstream
```

出现阶段：

- 前端 Nginx 代理到 `backend:8080`

原因：

- 容器桥接网络不稳定
- Nginx 虽然能解析到后端容器 IP，但无法真正路由过去

最终修复：

- 生产环境改为 `proxy_pass http://127.0.0.1:8080`
- `frontend` 使用 `host` 网络

### 5.3 后端健康检查 `DOWN`

现象：

- `curl http://127.0.0.1:8080/api/actuator/health`
- 返回 `{"status":"DOWN"}`

含义：

- Spring Boot 进程已经起来了
- 但内部依赖还不健康
- 在本次场景里，本质上是数据库连接不通

### 5.4 注册接口 500

报错链路最终定位为：

```text
MyBatisSystemException
CannotGetJdbcConnectionException
Communications link failure
No route to host
```

说明：

- 请求已经成功到达后端
- 业务代码开始执行
- 后端在访问数据库时失败
- 根因依然是 `backend -> mysql` 网络不通

最终修复：

- `mysql` 绑定 `127.0.0.1:3306`
- `backend` 改用 `host` 网络
- `backend` 使用 `MYSQL_HOST=127.0.0.1`

### 5.5 Nginx 启动日志中的只读告警

日志示例：

```text
can not modify /etc/nginx/conf.d/default.conf (read-only file system?)
```

这不是故障。

原因：

- 生产环境把 `frontend/nginx.aliyun.conf` 以只读方式挂载进容器
- Nginx 官方入口脚本尝试改写默认配置文件时失败

只要 Nginx 后续正常启动，这条日志可以接受。

### 5.6 部署初期的 `Connection reset by peer`

报错示例：

```text
recv() failed (104: Connection reset by peer) while reading response header from upstream
```

这类错误通常出现在：

- 前端已经起来
- 后端容器正在启动或刚启动
- 浏览器恰好在后端尚未完全可用时发起请求

如果它只发生在部署刚完成后的短时间内，并且后续健康检查恢复正常，一般可以视为启动窗口内的瞬时现象。

如果它持续出现，就不能忽略，要继续检查：

- 后端是否重启
- 后端是否健康
- 后端是否还能连接数据库

## 6. 标准部署步骤

后续阿里云部署，请按下面流程操作。

### 6.1 服务器准备

要求：

- 已安装 Docker
- 已安装 Docker Compose 插件
- 安全组放行 `80`
- 项目代码已同步到服务器

建议额外检查：

```bash
docker -v
docker compose version
```

如果服务器历史上出现过依赖下载失败，例如：

- `Temporary failure in name resolution`
- `Unknown host repo.maven.apache.org`
- `Unknown host maven.aliyun.com`
- `npm ci` 下载依赖失败

建议额外为 Docker 守护进程配置 DNS：

```json
{
  "dns": ["223.5.5.5", "223.6.6.6", "119.29.29.29", "8.8.8.8", "1.1.1.1"]
}
```

路径：

- `/etc/docker/daemon.json`

修改后执行：

```bash
systemctl restart docker
```

### 6.2 准备环境变量

首次部署：

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
```

必须修改：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`
- `SERVER_HOST`

建议生成随机 JWT 密钥：

```bash
openssl rand -hex 32
```

### 6.3 启动或重建

推荐命令：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

说明：

- `--build` 确保镜像基于最新代码重建
- `--force-recreate` 确保配置变更真正落进容器

如果是做重大变更，建议先停掉旧容器：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml down --remove-orphans
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

### 6.4 验证部署结果

先查容器状态：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml ps
```

检查后端健康：

```bash
curl http://127.0.0.1:8080/api/actuator/health
curl http://127.0.0.1/api/actuator/health
```

理想结果：

```json
{"status":"UP"}
```

检查前端首页：

```bash
curl http://127.0.0.1/
```

检查日志：

```bash
docker logs --tail=100 echofit-mysql
docker logs --tail=100 echofit-backend
docker logs --tail=100 echofit-frontend
```

## 7. 后续更新部署建议

以后线上更新代码，建议统一使用下面的流程。

### 7.1 代码更新

```bash
git pull
```

### 7.2 配置检查

确认以下文件是否改动：

- `docker-compose.aliyun.yml`
- `frontend/nginx.aliyun.conf`
- `backend/src/main/resources/application-docker.yml`
- `deploy/aliyun.env`

### 7.3 重新部署

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

### 7.4 回归验证

至少验证：

- `/`
- `/login`
- `/api/actuator/health`
- 注册接口
- 登录接口

## 8. 本地与生产环境的区别

不要把本地配置和生产配置混用。

### 本地

参考文件：

- `docker-compose.local.yml`
- `frontend/nginx.conf`

特点：

- 使用标准 Docker bridge 网络
- 本地直接映射：
  - MySQL `3306`
  - 后端 `8080`
  - 前端 `8081`

### 生产

参考文件：

- `docker-compose.aliyun.yml`
- `frontend/nginx.aliyun.conf`

特点：

- `frontend` 使用 `host` 网络
- `backend` 使用 `host` 网络
- `mysql` 只绑定到 `127.0.0.1:3306`
- 前后端和数据库不依赖 bridge 网络互联

## 9. 数据库初始化注意事项

### 9.1 初始化脚本只在首次建库时执行

`docker/mysql/init/001_schema.sql` 只有在 MySQL 数据目录为空时才会自动执行。

这意味着：

- 第一次启动时，它会自动建库建表
- 如果 `mysql_data` 卷已经存在，再改 SQL 文件不会自动生效

### 9.2 修改环境变量不会重建旧库用户

如果第一次初始化后又改了：

- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

旧卷不会自动重置。

这时应该：

- 手动进 MySQL 修用户权限
- 或在确认无数据价值时删除数据卷重建

## 10. 常用排障命令

### 10.1 查看服务状态

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml ps
```

### 10.2 查看实时日志

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml logs -f
```

### 10.3 看后端健康

```bash
curl http://127.0.0.1:8080/api/actuator/health
curl http://127.0.0.1/api/actuator/health
```

### 10.4 测试 MySQL 本地监听

```bash
docker exec echofit-mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SHOW DATABASES;"
```

### 10.5 测试注册接口

```bash
curl -i -X POST http://127.0.0.1/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"probe@example.com","password":"12345678"}'
```

## 11. 后续部署规则

从现在开始，建议把下面这些规则当成部署约定。

### 规则 1

阿里云生产部署优先使用：

- `docker-compose.aliyun.yml`
- `frontend/nginx.aliyun.conf`

### 规则 2

不要在生产环境把 `MYSQL_USER` 设成 `root`。

### 规则 3

如果修改了 Docker、Nginx、后端 profile 或环境变量，不要只做 `docker restart`，要执行：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

### 规则 4

如果以后要尝试重新切回纯 bridge 网络部署，必须先在目标服务器上完成专项验证，不要直接替换当前稳定方案。

### 规则 5

当前这套生产配置已经过真实线上问题验证，可以作为后续部署的参考模板长期保留。

## 12. 建议的后续优化

当前部署已经可用，但后续仍建议逐步补齐：

- 域名
- HTTPS
- 反向代理访问日志归档
- 数据库定时备份
- 镜像版本固定与发布记录
- 更明确的应用启动探针与健康检查

## 13. 最终结论

这次部署的最终稳定结论是：

- 当前阿里云环境下，不应依赖 `frontend -> backend -> mysql` 的默认容器桥接互联作为生产基线
- 当前仓库中的生产方案已经改为“宿主机回环链路”
- 这套配置已经真实解决了：
  - MySQL 启动变量错误
  - Nginx 502
  - 后端健康检查 `DOWN`
  - 注册接口 500
  - 后端连 MySQL `No route to host`

后续部署 EchoFit，建议默认按当前生产文件执行，不要再退回旧方案，除非后续对目标环境做过充分验证。
