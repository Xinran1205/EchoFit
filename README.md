# EchoFit

EchoFit 是一个移动端优先的私人训练记录 Web App。当前仓库已经根据现有产品、前端、后端和阶段规划文档，初始化了前后端工程骨架，后续按文档约定分阶段推进。

## 当前结构

```text
docs/                        版本与初始化说明
frontend/                    Vite + React + TypeScript + Ant Design Mobile
backend/                     Spring Boot + MyBatis-Plus + MySQL
docker/mysql/init/           本地 MySQL 初始化 SQL
docker-compose.local.yml     本地后端 + MySQL 联调骨架
```

## 版本基线

- 前端：`Vite 7.1.4`、`React 18.3.1`、`Ant Design Mobile 5.40.0`、`React Router DOM 6.30.1`
- 后端：`Java 21`、`Spring Boot 3.5.14`、`MyBatis-Plus 3.5.16`、`MySQL 8.4.9`

详细版本选择原因见 [docs/version-baseline.md](/D:/EchoFit/docs/version-baseline.md)。

## 说明

- 当前 shell 环境没有直接可用的 `npm`、`pnpm`、`java`、`mvn`，所以这次先手工搭建了可落地的工程骨架与配置文件。
- 当前线程内置 Node 运行时版本为 `v24.14.0`，满足 `Vite 7` 的 Node 要求。
- 下一步按既定阶段继续做 Stage 1 静态高保真前端和 Stage 2 后端核心 API。

