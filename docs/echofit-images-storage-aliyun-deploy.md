# EchoFit 图片、存储与阿里云部署说明

## 1. 训练图片现在能不能删

可以，当前项目已经支持用户在“修改训练”页面删除已上传图片。

当前删除链路是：

1. 前端编辑页会先加载这条训练记录已有的 `photos`。
2. 用户在“已保存照片”区域点右上角删除，只会把这张图片的 `photoId` 从 `keptPhotoIds` 里移除。
3. 保存修改时，前端会把：
   - 保留的旧图 `keptPhotoIds`
   - 新上传的图片 `photos`
   一起提交给后端。
4. 后端更新记录时，会把“不在 keptPhotoIds 里的旧图”标记删除，并在事务提交后删除物理文件。

结论：

- 现在“修改训练里删除图片”是支持的。
- 删除不是单独的图片删除接口，而是挂在“更新训练记录”这个接口里完成。
- 数据库里的图片记录是逻辑删除。
- 磁盘上的图片文件会被物理删除。

如果你后续还想支持“在训练详情页直接删图，不进入编辑页”，那才需要再补一个单独的删除接口。

## 2. 当前图片到底存在哪里

当前不是 OSS，也不是数据库 BLOB。

当前实现是：

- 图片元数据存 MySQL 的 `training_record_photo` 表。
- 图片文件本体存服务器磁盘目录。
- Docker 里只是通过挂载访问宿主机目录，不是存在容器临时层里。

具体结构：

- 后端默认图片根目录是 `./data/uploads/training-photos`
- 阿里云 compose 把宿主机 `./data/uploads` 挂到容器 `/app/data/uploads`
- 所以后端最终实际写入的是服务器项目目录下的 `data/uploads/training-photos/...`

可以把它理解成：

- MySQL：保存图片 ID、文件名、类型、大小、`storage_key`
- 宿主机磁盘：保存真正的图片文件
- Docker 容器：只是读写这个宿主机挂载目录

所以当前图片存储方式的准确说法是：

> 存在阿里云服务器宿主机磁盘上，通过 Docker bind mount 挂进后端容器；不是 OSS，也不是容器临时文件系统。

## 3. 当前阿里云部署结构

当前线上部署不是“纯容器互联”，而是“前后端走宿主机回环地址”：

- `frontend` 使用 `host` 网络
- `backend` 使用 `host` 网络
- `frontend` 代理到 `127.0.0.1:8080`
- `backend` 连接 `127.0.0.1:3306`
- `mysql` 和 `redis` 仍然是容器，但只把端口绑定到宿主机本地

这样做的结果是：

- 浏览器访问 `http://你的服务器`
- Nginx 转发到本机 `127.0.0.1:8080`
- Spring Boot 再访问本机 `127.0.0.1:3306` 和 `127.0.0.1:6379`

当前这套部署下：

- 数据库数据在 Docker named volume：`mysql_data`
- Redis 数据在 Docker named volume：`redis_data`
- 训练图片在宿主机目录：`./data/uploads`

## 4. 你现在最少还要配什么

### 必配

你至少要准备一份真正的 `deploy/aliyun.env`，并确认下面这些值：

- `SERVER_HOST`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

### 按功能决定是否必配

如果你要开放“邮箱验证码注册 / 修改密码验证码 / 邮件提醒”，还必须配置：

- `MAIL_ENABLED=true`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM`

注意：

- 你当前 `deploy/aliyun.env.example` 里是 `MAIL_ENABLED=false`
- 这会导致“发送注册验证码”接口不可用
- 如果你要让新用户自己注册，这一项实际上要开

### 当前配置里还要知道的两个事实

1. 你阿里云 compose 现在跑的是 `docker` profile，不是 `prod` profile。
2. `deploy/aliyun.env.example` 里出现了明文示例口令和 JWT secret，这种值不要继续当正式值使用，建议立刻更换。

另外，`FRONTEND_PORT` 这个环境变量当前没有在 `docker-compose.aliyun.yml` 里实际生效，可以先忽略。

## 5. 你现在要“全部可销毁、最快部署”，推荐怎么做

既然你明确说服务器上的现有内容都可以销毁，那最直接的方式就是做一次全量重建。

### 第一次或全量重建部署

```bash
cp deploy/aliyun.env.example deploy/aliyun.env
```

先把 `deploy/aliyun.env` 改成你自己的正式值，至少改掉：

- `SERVER_HOST`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

然后执行：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml down -v --remove-orphans
rm -rf data/uploads
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

说明：

- `down -v` 会删掉 `mysql_data` 和 `redis_data`
- 但不会删掉宿主机目录 `data/uploads`
- 所以如果你要“连图片一起清空”，还要手动删 `data/uploads`

### 部署后立即验证

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml ps
curl http://127.0.0.1:8080/api/actuator/health
curl http://127.0.0.1/
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml logs --tail=100 backend
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml logs --tail=100 frontend
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml logs --tail=100 mysql
```

健康检查返回 `{"status":"UP"}` 才算后端真正可用。

## 6. 项目上线后，正常重部署应该怎么做

上线后不要再默认使用 `down -v`，否则会把 MySQL 和 Redis 数据卷一起删掉。

正常更新建议这样：

```bash
git pull
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml up -d --build --force-recreate
```

这适合：

- 前端代码改动
- 后端代码改动
- Nginx 配置改动
- Spring 配置改动

如果只是重启容器，不涉及镜像和配置变化，才考虑：

```bash
docker compose --env-file deploy/aliyun.env -f docker-compose.aliyun.yml restart
```

但当前项目大多数正式更新，还是建议用 `up -d --build --force-recreate`。

## 7. 后续优化建议

### 部署层

1. 把 `deploy/aliyun.env.example` 里的明文敏感信息全部替换掉，不要把正式密钥放进仓库。
2. 给线上加域名和 HTTPS。
3. 把 `CORS_ALLOWED_ORIGINS` 改成可配置的完整地址，尤其是后续上 HTTPS 时，不要继续写死 `http://${SERVER_HOST}`。
4. 给 MySQL 做定时备份。
5. 把镜像构建前移到 CI，服务器改成 `pull + up`，这样重部署会更快。

### 存储层

1. 如果只是单机应用，当前“宿主机目录 + MySQL 元数据”方案够用。
2. 如果后面要扩容、多机部署、做 CDN、降低磁盘迁移成本，建议把训练图片迁到阿里云 OSS。
3. 如果迁 OSS，需要补：
   - OSS SDK
   - Bucket 配置
   - 上传逻辑改造
   - 下载 URL 或签名 URL 逻辑
   - 旧图片迁移脚本

### 业务层

1. 现在删图依赖“修改训练记录”提交；如果你要更细粒度交互，可以补一个单独删图接口。
2. 现在数据库里图片记录是逻辑删除；如果你要求更彻底的数据清理，可以再设计物理清理策略。

## 8. 最终结论

### 对你的 3 个问题，直接回答

1. 用户上传图片后，当前已经可以在“修改训练”里删除；前端和后端链路都已经打通。
2. 当前图片不是 OSS，也不是存在容器临时层；它是“元数据在 MySQL，文件在阿里云服务器宿主机磁盘，通过 Docker 挂载给后端使用”。
3. 你现在上阿里云，最快方式就是：
   - 准备 `deploy/aliyun.env`
   - 全量执行 `down -v --remove-orphans`
   - 手动删 `data/uploads`
   - 再执行 `up -d --build --force-recreate`

### 我对你当前部署的建议

- 如果你要开放注册，邮件配置不能继续关着。
- 如果项目准备正式上线，先把仓库里示例密钥全部轮换。
- 如果后面只是一台机器跑，当前图片存本机磁盘可以先不改。
- 如果后面要做稳定扩容，再把图片迁 OSS，不要现在提前复杂化。
