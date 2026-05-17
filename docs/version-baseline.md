# EchoFit 初始化版本基线

## 1. 目标

在不偏离现有产品与技术文档的前提下，先把前后端初始化到一套兼容、稳定、后续可扩展的版本组合上。

## 2. 前端版本

| 组件 | 版本 | 选择理由 |
| --- | --- | --- |
| Node.js | `>= 20.19.0` | Vite 7 官方要求至少 Node 20.19+ |
| Vite | `7.1.4` | 当前稳定线，且和内置 Node 24 兼容 |
| `@vitejs/plugin-react` | `5.0.2` | 与 Vite 7 配套 |
| TypeScript | `5.9.2` | 当前稳定版，类型系统成熟 |
| React | `18.3.1` | 生态最稳，避免 React 19 与第三方 peer 声明差异 |
| React DOM | `18.3.1` | 与 React 主版本对齐 |
| `@types/react` | `18.3.2` | 与 React 18 对齐 |
| `@types/react-dom` | `18.3.6` | 与 React DOM 18 对齐 |
| Ant Design Mobile | `5.40.0` | 稳定版，包含移动端安全区改进 |
| `antd-mobile-icons` | `0.3.0` | Ant Design Mobile 官方图标集 |
| `react-router-dom` | `6.30.1` | 保持现有文档和示例风格，不提前切 v7 导入方式 |
| Zustand | `5.0.8` | 轻量状态管理，符合项目需求 |
| dayjs | `1.11.18` | 轻量日期处理，适合近 7 天/月历场景 |
| `vite-plugin-pwa` | `1.0.3` | 与 Vite 5+ 兼容，后续可平滑做 PWA |

## 3. 后端版本

| 组件 | 版本 | 选择理由 |
| --- | --- | --- |
| Java | `21` | LTS，且符合现有后端方案文档 |
| Maven | `3.6.3+` | Spring Boot 官方支持基线 |
| Spring Boot | `3.5.14` | 当前 3.5 稳定线，兼容性强于直接上 4.x |
| MyBatis-Plus | `3.5.16` | 提供 `spring-boot3-starter`，直接对齐 Boot 3 |
| MySQL | `8.4.9` | LTS 版本，适合本地和服务器统一 |
| JJWT | `0.12.6` | Spring Security + JWT 常用稳定组合 |

## 4. 当前初始化范围

本次只做项目初始化，不做完整业务闭环：

1. 前端工程骨架与静态路由壳。
2. 后端 Maven、配置、公共响应类与安全基线。
3. MySQL 初始化 SQL 与 Docker Compose 本地骨架。
4. 顶层文档与环境说明。

## 5. 下一步

1. 完成 Stage 1 前端静态高保真页面。
2. 完成 Stage 2 后端认证、记录、回声和提醒 API。
3. 做 Stage 3 前后端主链路联调。
