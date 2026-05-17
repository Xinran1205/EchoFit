# 阿里云 Docker 部署

## 目标

- 公网访问地址：`http://118.178.144.106`
- 前端和 API 同源访问：浏览器只访问一个地址
- 一条 Compose 命令启动 `mysql`、`backend`、`frontend`

## 你需要准备

- 阿里云安全组放行 `80`
- 服务器已安装 Docker 和 Compose 插件
- 项目代码已拉到服务器

如果后续要启用邮件提醒，再补 SMTP 配置；当前可以先保持 `MAIL_ENABLED=false`。

## 第一步：准备环境变量

在项目根目录执行：

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
```

然后编辑 `deploy/aliyun.env`，至少改掉这 3 项：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

`JWT_SECRET` 建议使用至少 32 字节随机字符串，例如：

```bash
openssl rand -hex 32
```

## 第二步：启动项目

在项目根目录执行：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build
```

## 第三步：检查状态

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml ps
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml logs -f
```

## 停止项目

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml down
```

## 当前这版配置做了什么

- 前端默认请求 `/api`
- `frontend/nginx.conf` 把 `/api/*` 代理到 `backend:8080`
- 浏览器访问 `http://118.178.144.106` 时，不再直接请求 `localhost:8080`
- 生产 Compose 不再对公网暴露 MySQL 和后端端口
- 后端 Maven 构建使用阿里云 Maven 镜像，提高阿里云服务器构建成功率

## 访问方式

- 前端：`http://118.178.144.106`
- API：`http://118.178.144.106/api/...`

## 说明

当前可以直接用 IP 跑通，但公网正式使用仍建议尽快补域名和 HTTPS。
