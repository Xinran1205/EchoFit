# 私人训练记录 Web App：5 阶段 AI 开发 Step 文档

> 用途：后续每次让 AI 只开发一个阶段，避免一次性生成过多代码导致失控。  
> 项目前端是重点：以 **移动端体验、UI 一致性、记录流程丝滑** 为主线，后端只做稳定支撑。  
> 技术基线：前端使用 Vite + React + TypeScript + Ant Design Mobile；后端使用 Spring Boot + Spring MVC + MySQL + MyBatis-Plus + Docker + Nginx。

---

## 0. 总体开发原则

### 0.1 产品边界

这个项目是一个极简私人训练记录 Web App，不是训练计划 App、Apple Health 替代品、饮食 App、社交社区，也不是复杂动作库。

MVP 只围绕四件事：

1. 训练前快速查看近 7 天状态。
2. 训练后快速记录当天训练。
3. 新建记录成功后收到一次回声反馈。
4. 日志页按日期回看、补记、修改记录。

必须坚持：

- 首页只有两个核心区块：近 7 天状态、今天状态 + 记录入口。
- 底部导航只有：首页、日志。
- 记录页是独立全屏页。
- 回声只在新建记录成功后出现，编辑不触发。
- 日志页只做月历 + 选中日期记录卡片。
- 不做看板、不做趋势图、不做社交、不做动作库、不做复杂设置中心。

---

## 1. 五阶段总览

| 阶段 | 名称 | 重点 | 主要产出 |
|---|---|---|---|
| Stage 1 | 前端项目骨架 + UI 设计系统 + 静态高保真页面 | 前端 | Vite React 项目、Ant Design Mobile 接入、AppShell、主题、静态首页/日志/记录/回声页 |
| Stage 2 | 后端基础能力 + API Contract + Docker MySQL | 后端支撑 | Spring Boot 项目、MySQL 表、JWT 登录、核心 API、Docker Compose |
| Stage 3 | 前端核心业务闭环 | 前端核心 | 登录、首页摘要、记录页、回声页、日志页与真实 API 联通 |
| Stage 4 | 前端体验打磨 + PWA + 设置/提醒 | 前端体验 | PWA、添加到桌面、safe area、设置弹层、邮件提醒开关、Loading/Empty/Error |
| Stage 5 | 本地 Docker 全链路验证 + 阿里云部署准备 | 部署收口 | Nginx、前后端 Docker 联调、生产配置、部署清单、验收报告 |

建议开发比例：

```txt
前端体验与页面：55%
后端 API 与数据库：25%
联调与部署：20%
```

---

# Stage 1：前端项目骨架 + UI 设计系统 + 静态高保真页面

## 1.1 阶段目标

先把产品“长相”和“交互骨架”做出来。

本阶段不接后端，不做真实登录，不做真实数据，只用 mock data。  
目标是让项目在手机浏览器里看起来已经像一个完整、极简、统一的移动端 Web App。

---

## 1.2 为什么先做前端壳

这个项目的核心竞争力不是复杂后端，而是：

- 首页是否一眼能看懂近 7 天状态；
- 训练记录流程是否 30–60 秒完成；
- 日志页是否像翻训练日历；
- 回声页是否有安静的完成感；
- iPhone Safari 添加到桌面后是否像一个轻量 App。

所以第一阶段必须先锁定 UI/UX 风格，避免后面接口写完后才发现页面不好用。

---

## 1.3 技术任务

### 1.3.1 初始化前端项目

使用：

```txt
Vite
React
TypeScript
Ant Design Mobile
React Router
Zustand
dayjs
antd-mobile-icons
vite-plugin-pwa
```

安装依赖：

```bash
pnpm create vite training-echo-web --template react-ts
cd training-echo-web
pnpm add antd-mobile antd-mobile-icons react-router-dom zustand dayjs
pnpm add -D vite-plugin-pwa
```

### 1.3.2 建立目录结构

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  pages/
    HomePage/
    LogPage/
    RecordPage/
    EchoPage/
    LoginPage/

  components/
    app/
      AppShell.tsx
      AppPage.tsx
      AppCard.tsx
      PageHeader.tsx
      BottomSubmitBar.tsx

    training/
      TrainingPartSelector.tsx
      TrainingStatusSelector.tsx
      DurationPickerField.tsx
      WeightPickerField.tsx
      TrainingRecordCard.tsx

    calendar/
      MonthTrainingCalendar.tsx
      CalendarDayCell.tsx

    echo/
      EchoSummaryCard.tsx
      EchoMessagePanel.tsx
      FutureMessageSheet.tsx

    settings/
      SettingsSheet.tsx

  features/
    training/
      training.types.ts
      training.mock.ts
      training.utils.ts

    echo/
      echo.types.ts
      echo.mock.ts

    auth/
      auth.types.ts
      auth.mock.ts

  styles/
    tokens.css
    global.css

  utils/
    date.ts
```

### 1.3.3 建立全局设计系统

必须创建：

```txt
src/styles/tokens.css
src/styles/global.css
```

主题关键词：

```txt
浅灰背景
白色卡片
大圆角
少阴影
系统字体
克制蓝色主色
按钮高度统一
页面横向间距统一
移动端优先
```

必须处理：

- `100dvh`
- `env(safe-area-inset-bottom)`
- `-webkit-tap-highlight-color: transparent`
- 固定底部 TabBar 不遮挡 Home Indicator
- 固定底部提交按钮不遮挡 Home Indicator

### 1.3.4 建立 AppShell

AppShell 负责：

- 页面背景；
- 底部 TabBar；
- safe area；
- 桌面端最大宽度；
- 判断哪些页面显示 TabBar。

底部 TabBar 只允许：

```txt
首页
日志
```

记录页、回声页、登录页不显示底部 TabBar。

### 1.3.5 静态页面

本阶段必须完成以下静态页面：

#### 首页

内容：

```txt
今天
日期/星期

近 7 天
- 训练次数
- 累计训练时长
- 部位分布

今天
- 今天还没有训练记录 / 今天的训练已经记下来了
- 记录今天训练 / 今日已记录
```

要求：

- 只有两个核心卡片。
- 不出现趋势图。
- 不出现最近记录列表。
- 不出现看板感 UI。

#### 训练记录页

内容：

```txt
记录训练

训练日期
今天 / 指定日期，只读

今天练了什么？
Selector multiple

训练时长
Picker

今日状态
Selector single

体重，可选
Picker

备注，可选
TextArea

底部固定按钮：保存记录
```

要求：

- 核心字段不用键盘。
- 日期只读。
- 底部按钮固定。
- 页面是全屏页，不是弹窗。

#### 回声页

内容：

```txt
今天已记下

训练摘要
回声文案

完成
给未来训练日的自己留一句话
```

要求：

- 自定义完成页，不用 Toast 替代。
- 回声文案居中或卡片化突出。
- 不做夸张动画。
- 给未来自己的话用 bottom sheet。

#### 日志页

内容：

```txt
日志
月份切换
月历
选中日期记录卡片 / 空状态卡片
```

要求：

- 自定义 MonthTrainingCalendar。
- 默认选中今天。
- 有记录日期高亮或显示小圆点。
- 点击日期后更新下方卡片。
- 不做趋势图、不做筛选、不做最近记录列表。

#### 登录页

内容：

```txt
邮箱
密码
登录
注册入口
```

要求：

- 简单可用。
- 不做手机号。
- 不做短信验证码。

---

## 1.4 本阶段禁止事项

不要做：

- 后端联调；
- 真实登录；
- 数据库；
- Redux；
- Tailwind 全量设计系统；
- 桌面端 antd；
- 大型图表库；
- 复杂 Calendar 库；
- 花哨动画；
- 看板页；
- 我的页；
- 复杂设置页。

---

## 1.5 验收标准

### UI 验收

- [ ] 首页只有两个核心区块。
- [ ] 页面整体风格统一。
- [ ] 卡片圆角、间距、按钮风格统一。
- [ ] iPhone Safari 下无横向滚动。
- [ ] 底部 TabBar 不遮挡 Home Indicator。
- [ ] 记录页底部按钮不遮挡 Home Indicator。
- [ ] 回声页看起来像完成页，不像弹窗。

### 交互验收

- [ ] 首页点击“记录今天训练”进入记录页。
- [ ] 日志点击某天可以切换下方卡片。
- [ ] 记录页 Picker/Selector 能正常打开。
- [ ] 回声页可打开“给未来自己的话”bottom sheet。
- [ ] 页面之间路由正常。

### 代码验收

- [ ] TypeScript 无错误。
- [ ] `pnpm build` 成功。
- [ ] 组件拆分清晰。
- [ ] 页面没有大量重复样式。
- [ ] mock data 集中放置，不散落页面。

---

## 1.6 给 AI 的阶段开发 Prompt

```txt
你现在只开发 Stage 1：前端项目骨架 + UI 设计系统 + 静态高保真页面。

请严格遵守：
1. 前端使用 Vite + React + TypeScript + Ant Design Mobile。
2. 本阶段不接后端，只使用 mock data。
3. 首页只做近 7 天状态和今天记录入口。
4. 日志页只做月历和选中日期记录卡片。
5. 记录页是独立全屏页，核心输入用 Selector / Picker，不要手动输入。
6. 回声页是独立完成页，不用 Toast 替代。
7. 底部导航只有首页和日志。
8. 不引入 Tailwind、不引入桌面端 antd、不引入复杂图表库。
9. 必须保证移动端优先、风格统一、极简、美观。

请先给出你要创建/修改的文件列表，然后实现代码。完成后给出运行命令、验收清单和已知问题。
```

---

# Stage 2：后端基础能力 + API Contract + Docker MySQL

## 2.1 阶段目标

搭建简单、稳定、可本地 Docker 运行的后端。

本阶段重点不是把后端做复杂，而是完成前端需要的最小 API，并确保接口结构稳定，方便 Stage 3 前端接入。

---

## 2.2 技术基线

后端版本：

```txt
Java 21 LTS
Spring Boot 3.5.14
Spring MVC
MyBatis-Plus 3.5.16 boot3 starter
MySQL 8.4.9
Lombok
Spring Security + JWT
Spring Scheduler
Spring Mail
Docker Compose
```

后端架构：

```txt
单体后端
REST API
MySQL 持久化
Docker Compose 本地运行
```

不做：

```txt
微服务
Redis
MQ
Spring Cloud
复杂 RBAC
管理后台
Kubernetes
```

---

## 2.3 后端任务

### 2.3.1 初始化 Spring Boot 项目

包名建议：

```txt
com.example.trainingecho
```

目录结构：

```txt
common/
config/
auth/
user/
training/
echo/
reminder/
mail/
```

### 2.3.2 建立数据库表

必须建表：

```txt
app_user
training_record
echo_message
echo_history
reminder_config
```

核心规则：

- 每位用户每天最多一条训练记录。
- 训练部位 MVP 用 JSON 存储。
- 体重并入训练记录。
- 回声内容单独存。
- 邮件提醒配置单独存。
- 所有用户数据必须按 user_id 隔离。

### 2.3.3 实现认证

接口：

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

要求：

- 邮箱 + 密码。
- 密码 BCrypt 加密。
- JWT 鉴权。
- 前端 Bearer Token。
- 不做手机号。
- 不做短信验证码。

### 2.3.4 实现首页摘要

接口：

```txt
GET /api/home/summary
```

返回：

```txt
today
todayRecorded
last7Days.trainingDays
last7Days.totalDurationMinutes
last7Days.partCounts
```

统计口径：

- 近 7 天训练次数 = 近 7 天有记录的天数。
- 近 7 天累计训练时长 = duration_minutes 总和。
- 部位分布 = parts_json 里各部位出现次数。

### 2.3.5 实现训练记录 API

接口：

```txt
POST /api/training-records
PUT  /api/training-records/{id}
GET  /api/training-records/by-date?date=YYYY-MM-DD
GET  /api/training-records/month?month=YYYY-MM
GET  /api/training-records/latest-weight
```

规则：

- 新建今天记录和补记历史记录都走 POST。
- 同一天已有记录则 POST 失败。
- 编辑记录不允许修改日期。
- 编辑记录不触发回声。
- 新建记录成功后触发回声。
- 只能访问自己的记录。

### 2.3.6 实现回声 API

接口：

```txt
GET  /api/echo/by-record/{recordId}
POST /api/echo/future-message
```

规则：

- 回声在新建记录成功后生成。
- 保存未来话最多 50 字。
- 每次回声后最多保存 1 条未来话。
- 未来话、事实反馈、系统默认文案按策略生成。

### 2.3.7 实现提醒配置 API

接口：

```txt
GET /api/reminder/config
PUT /api/reminder/config
```

规则：

- 默认开启。
- 固定每天 20:00。
- MVP 只支持开关。
- 本阶段可以先不真的发送邮件，只实现配置和 NoopEmailSender。

### 2.3.8 Docker Compose

必须支持：

```txt
docker compose -f docker-compose.local.yml up -d --build
```

容器：

```txt
mysql
backend
```

必须能访问：

```txt
http://localhost:8080/api/actuator/health
```

---

## 2.4 API Contract 文档

本阶段必须输出：

```txt
docs/api-contract.md
```

内容至少包含：

- 通用返回结构；
- 认证接口；
- 首页摘要接口；
- 训练记录接口；
- 回声接口；
- 提醒配置接口；
- 枚举值；
- 错误码；
- 字段类型；
- 前端注意事项。

特别注意：

前端 TypeScript 中，后端 `BIGINT` ID 建议当作 `string` 使用，避免 JS number 精度问题。

---

## 2.5 本阶段禁止事项

不要做：

- 前端页面大改；
- 复杂权限；
- Redis；
- 邮件真实发送强依赖；
- 管理后台；
- 删除训练记录；
- 自定义提醒时间；
- 深色模式；
- 数据报表。

---

## 2.6 验收标准

### 后端验收

- [ ] Spring Boot 启动成功。
- [ ] Docker MySQL 启动成功。
- [ ] `/api/actuator/health` 返回 UP。
- [ ] 注册成功。
- [ ] 登录成功并返回 token。
- [ ] `/api/auth/me` 能识别当前用户。
- [ ] 首页摘要接口可用。
- [ ] 新建训练记录成功。
- [ ] 同一天重复新建失败。
- [ ] 编辑记录成功且不触发新回声。
- [ ] 按日期查询成功。
- [ ] 按月份查询成功。
- [ ] 新建记录后能查询回声。
- [ ] 保存未来话成功。
- [ ] 提醒配置查询和更新成功。

### 工程验收

- [ ] `mvn test` 或至少 `mvn package -DskipTests` 成功。
- [ ] Docker Compose 一键启动成功。
- [ ] 数据库初始化脚本可重复使用。
- [ ] application-local/docker/prod 配置清晰。
- [ ] API Contract 与实际返回一致。

---

## 2.7 给 AI 的阶段开发 Prompt

```txt
你现在只开发 Stage 2：后端基础能力 + API Contract + Docker MySQL。

请严格遵守：
1. 使用 Java 21、Spring Boot 3.5.14、Spring MVC、MyBatis-Plus 3.5.16 boot3 starter、MySQL 8.4.9、Lombok、Docker Compose。
2. 后端是简单单体，不做微服务、不做 Redis、不做 MQ、不做管理后台。
3. 实现邮箱注册/登录/JWT、首页摘要、训练记录、回声、提醒配置这些 MVP API。
4. 每个用户每天最多一条训练记录。
5. 新建记录触发回声，编辑记录不触发回声。
6. 所有数据必须按当前用户隔离。
7. 本阶段邮件发送可以用 NoopEmailSender，不强制真实发邮件。
8. 必须输出 docs/api-contract.md，保证 Stage 3 前端接入。
9. 必须提供 docker-compose.local.yml 和 MySQL 初始化 SQL。

请先给出文件列表和后端模块设计，然后实现。完成后给出 curl 测试命令和验收清单。
```

---

# Stage 3：前端核心业务闭环

## 3.1 阶段目标

这是整个项目最重要的阶段。

目标是把 Stage 1 的静态前端接入 Stage 2 的真实 API，形成完整 MVP 主链路：

```txt
注册/登录
→ 首页看近 7 天状态
→ 记录今天训练
→ 新建成功进入回声页
→ 可选写给未来自己的话
→ 返回首页/日志
→ 日志按月查看
→ 补记/编辑某天记录
```

---

## 3.2 前端任务

### 3.2.1 API 请求层

实现：

```txt
src/utils/request.ts
src/features/auth/auth.api.ts
src/features/training/training.api.ts
src/features/echo/echo.api.ts
src/features/reminder/reminder.api.ts
```

要求：

- 统一读取 `VITE_API_BASE_URL`。
- 自动携带 `Authorization: Bearer <token>`。
- 统一处理 `{ code, message, data }`。
- 401 时跳转登录页。
- 请求失败保留页面状态，不乱清空表单。

### 3.2.2 Auth 状态

实现：

```txt
src/features/auth/auth.store.ts
```

功能：

- 保存 token；
- 保存当前用户；
- 登录后跳首页；
- 退出后清空 token；
- 刷新页面后尝试 `/auth/me` 恢复用户；
- 未登录访问业务页跳登录。

### 3.2.3 登录/注册页

要求：

- 邮箱 + 密码。
- 登录和注册可以一个页面切换。
- 错误提示清晰。
- 按钮 loading。
- 不做短信、不做手机号。

### 3.2.4 首页接入真实数据

接口：

```txt
GET /api/home/summary
```

要求：

- 加载态；
- 空数据态；
- 今日已记录态；
- 今日未记录态；
- 训练时长格式化为 X 小时 Y 分钟；
- 部位分布按固定顺序展示；
- 点击记录按钮进入 `/record/new?date=today&source=home`。

### 3.2.5 记录页接入真实数据

模式：

```txt
新建今天记录
补记某天记录
编辑已有记录
```

接口：

```txt
POST /api/training-records
PUT /api/training-records/{id}
GET /api/training-records/by-date
GET /api/training-records/latest-weight
```

要求：

- 新建/补记成功后进入回声页。
- 编辑成功后回到日志页。
- 编辑不进入回声页。
- 日期只读。
- 部位至少选 1 个。
- 时长 5–300 分钟，步长 5。
- 状态必选。
- 体重可选，默认上次体重。
- 保存按钮 loading，禁止重复提交。
- 保存失败保留表单。

### 3.2.6 回声页接入真实数据

接口：

```txt
GET /api/echo/by-record/{recordId}
POST /api/echo/future-message
```

要求：

- 展示训练摘要。
- 展示回声内容。
- 给未来自己的话用 bottom sheet。
- 输入最多 50 字。
- 保存成功后关闭 sheet。
- 完成按钮根据 source 返回首页或日志。

### 3.2.7 日志页接入真实数据

接口：

```txt
GET /api/training-records/month?month=YYYY-MM
GET /api/training-records/by-date?date=YYYY-MM-DD
```

要求：

- 默认选中今天。
- 月份切换后加载当月记录。
- 有记录日期高亮。
- 点击日期更新下方卡片。
- 有记录显示修改按钮。
- 无记录显示补记按钮。
- 修改进入编辑态。
- 补记进入新建态，日期固定。

---

## 3.3 本阶段 UI/UX 重点

必须重点打磨：

1. 首页加载后是否一眼看懂。
2. 记录页是否能 30–60 秒完成。
3. Picker/Selector 是否比手动输入更顺。
4. 新建保存后是否自然进入回声页。
5. 日志页点击日期是否反馈清晰。
6. 编辑记录不会误触发回声。
7. 错误状态是否保留用户输入。

---

## 3.4 本阶段禁止事项

不要做：

- PWA 深度配置；
- 阿里云部署；
- 邮件真实发送；
- 趋势图；
- 看板；
- 删除记录；
- 自定义提醒时间；
- 复杂动画；
- 引入新 UI 库。

---

## 3.5 验收标准

### 主链路验收

- [ ] 注册成功后进入首页。
- [ ] 登录成功后进入首页。
- [ ] 首页显示近 7 天训练次数、累计时长、部位分布。
- [ ] 未记录时可以进入记录页。
- [ ] 新建记录成功后进入回声页。
- [ ] 回声页能保存未来话。
- [ ] 回声完成后返回首页。
- [ ] 首页变成今日已记录状态。
- [ ] 日志页当月日期高亮正确。
- [ ] 日志页可补记历史日期。
- [ ] 日志页可编辑已有记录。
- [ ] 编辑已有记录不进入回声页。

### 前端质量验收

- [ ] `pnpm build` 成功。
- [ ] TypeScript 无明显 any 滥用。
- [ ] API 类型定义清楚。
- [ ] loading/error/empty 状态齐全。
- [ ] iPhone Safari 可正常操作。
- [ ] 没有页面横向滚动。
- [ ] 表单保存失败不清空。

---

## 3.6 给 AI 的阶段开发 Prompt

```txt
你现在只开发 Stage 3：前端核心业务闭环。

请严格遵守：
1. 不重做 Stage 1 的 UI 风格，只在现有设计系统上接入真实 API。
2. 前端必须通过 VITE_API_BASE_URL 访问后端。
3. 实现 auth、home summary、training records、echo、reminder 的 API 封装。
4. 首页必须显示真实近 7 天状态。
5. 记录页支持新建、补记、编辑三种模式。
6. 新建/补记成功后进入回声页，编辑成功后回日志页，不触发回声。
7. 日志页按月份加载记录，点击日期显示当天记录或空状态。
8. 所有保存操作必须有 loading，失败时保留输入。
9. 不引入新 UI 库，不做看板、不做趋势图、不做复杂动画。
10. 前端体验是重点，代码要保持组件清晰、类型清晰。

请先列出要修改的前端文件和 API 类型，然后实现。完成后给出本地联调步骤、测试账号流程和验收清单。
```

---

# Stage 4：前端体验打磨 + PWA + 设置/提醒

## 4.1 阶段目标

在核心功能可用后，把它打磨成真正适合添加到桌面的移动端 PWA。

本阶段重点是体验细节，而不是增加功能。

---

## 4.2 任务清单

### 4.2.1 PWA 配置

实现：

```txt
manifest
apple-touch-icon
theme-color
viewport-fit=cover
vite-plugin-pwa
```

要求：

- 添加到 iPhone 主屏幕后图标正确。
- 启动后没有明显网页感。
- 底部 TabBar 和底部按钮适配 safe area。
- 页面背景和启动背景一致。

### 4.2.2 SettingsSheet

首页右上角设置入口。

内容：

```txt
账号信息
邮件提醒开关
退出登录
```

要求：

- 用 Ant Design Mobile Popup。
- 不做单独“我的”页。
- 邮件提醒只支持开关。
- 退出登录需要确认。

### 4.2.3 邮件提醒前端接入

接口：

```txt
GET /api/reminder/config
PUT /api/reminder/config
```

要求：

- 默认显示当前开关。
- 切换时 loading 或禁用重复点击。
- 失败时恢复原状态并提示。
- 文案保持克制。

### 4.2.4 细节状态补齐

补齐：

- Skeleton；
- Empty；
- Toast；
- 网络错误；
- 401 过期；
- 表单放弃确认；
- 保存中禁止重复提交；
- 长备注布局；
- 体重为空状态；
- 当月无记录状态。

### 4.2.5 动效轻打磨

只做轻动效：

- 页面轻微 fade-in。
- 按钮 active scale。
- 回声文字轻微出现。
- 月份切换轻微过渡。
- Popup 使用 Ant Design Mobile 默认动效。

不要做复杂动画库和花哨效果。

---

## 4.3 真机测试重点

必须在 iPhone Safari 测试：

- 添加到主屏幕。
- 登录状态刷新恢复。
- Picker 是否正常。
- Popup 是否正常。
- 键盘弹出时备注区域是否可用。
- 底部按钮是否被 Home Indicator 遮挡。
- 横屏是否至少不崩。
- 弱网下 loading 是否清楚。
- 返回手势是否符合预期。

---

## 4.4 本阶段禁止事项

不要做：

- 新功能扩张；
- 趋势图；
- 深色模式，除非所有页面都能一致完成；
- 邮件时间自定义；
- 删除记录；
- 推送通知；
- 微信登录；
- 支付；
- 管理后台。

---

## 4.5 验收标准

- [ ] iPhone Safari 添加到主屏幕后图标正确。
- [ ] PWA 启动后页面背景正常。
- [ ] 首页设置入口可用。
- [ ] 邮件提醒开关可用。
- [ ] 退出登录可用。
- [ ] 所有主要页面有 loading/empty/error 状态。
- [ ] 网络错误不导致页面崩溃。
- [ ] 保存失败不清空表单。
- [ ] 底部导航和底部按钮不遮挡。
- [ ] 页面整体风格仍然统一、极简。

---

## 4.6 给 AI 的阶段开发 Prompt

```txt
你现在只开发 Stage 4：前端体验打磨 + PWA + 设置/提醒。

请严格遵守：
1. 不新增偏离 MVP 的功能。
2. 重点打磨 iPhone Safari 和添加到主屏幕后的体验。
3. 完成 PWA manifest、apple-touch-icon、theme-color、viewport-fit=cover、safe area。
4. 首页右上角实现 SettingsSheet，只包含账号信息、邮件提醒开关、退出登录。
5. 邮件提醒只支持开关，不支持自定义时间。
6. 补齐 loading、empty、error、401、保存失败、表单放弃确认等体验。
7. 动效保持克制，不引入大型动画库。
8. 不做看板、趋势图、深色模式、删除记录、推送通知。

请先列出体验问题清单和要修改的文件，然后实现。完成后给出 iPhone Safari 真机验收清单。
```

---

# Stage 5：本地 Docker 全链路验证 + 阿里云部署准备

## 5.1 阶段目标

把项目从“本地开发可用”推进到“可部署、可备份、可长期自用”。

本阶段不再大改业务功能，重点是：

```txt
构建
容器
Nginx
环境变量
HTTPS 准备
数据库备份
最终验收
```

---

## 5.2 本地 Docker 全链路

目标：

```txt
mysql
backend
frontend build
nginx
```

本地通过 Nginx 访问：

```txt
http://localhost:8081
```

API 代理：

```txt
/api/ -> backend:8080/api/
```

要求：

- 前端生产构建成功。
- 后端 Docker 镜像构建成功。
- MySQL 初始化成功。
- Nginx 能服务前端 SPA。
- Nginx 能代理后端 API。
- 注册/登录/记录/回声/日志全链路可用。

---

## 5.3 生产部署准备

生产路径建议：

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

准备：

- 阿里云 ECS；
- Docker；
- Docker Compose v2；
- Nginx 容器；
- MySQL 容器；
- 后端容器；
- 域名；
- 80/443 安全组；
- HTTPS 证书；
- `.env` 环境变量。

---

## 5.4 Nginx 规则

必须支持：

```txt
/         前端 SPA
/api/     后端 API
/assets/  长缓存
```

SPA 必须：

```txt
try_files $uri $uri/ /index.html;
```

---

## 5.5 安全与备份

必须完成：

- 生产 JWT_SECRET 改成强随机字符串。
- 生产 MySQL 密码不能用默认。
- CORS 只允许正式域名。
- 后端不暴露数据库端口到公网。
- 服务器开放 80/443。
- HTTPS 尽快配置。
- MySQL 至少每周备份一次。

---

## 5.6 最终验收

### 功能验收

- [ ] 注册。
- [ ] 登录。
- [ ] 首页摘要。
- [ ] 新建训练记录。
- [ ] 重复记录失败。
- [ ] 回声显示。
- [ ] 保存未来话。
- [ ] 日志月历。
- [ ] 补记。
- [ ] 编辑。
- [ ] 邮件提醒开关。
- [ ] 退出登录。

### 部署验收

- [ ] Docker Compose 本地全链路正常。
- [ ] Nginx 访问前端正常。
- [ ] Nginx 代理 API 正常。
- [ ] 阿里云服务器容器启动正常。
- [ ] 域名访问正常。
- [ ] HTTPS 正常。
- [ ] 数据库备份命令可用。

### 移动端验收

- [ ] iPhone Safari 正常。
- [ ] 添加到主屏幕后正常。
- [ ] PWA 图标正确。
- [ ] 底部 safe area 正常。
- [ ] Picker/Popup 正常。
- [ ] 页面无横向滚动。

---

## 5.7 给 AI 的阶段开发 Prompt

```txt
你现在只开发 Stage 5：本地 Docker 全链路验证 + 阿里云部署准备。

请严格遵守：
1. 不再大改业务功能和 UI。
2. 目标是让前端、后端、MySQL、Nginx 通过 Docker Compose 本地全链路跑通。
3. 准备生产部署文件：docker-compose.prod.yml、nginx.conf、.env.example、部署 README。
4. Nginx 需要服务前端 SPA，并把 /api/ 代理到后端。
5. 生产环境必须注意 JWT_SECRET、MySQL 密码、CORS、HTTPS、数据库备份。
6. 不引入 Kubernetes、不引入复杂 CI/CD、不引入 Redis。
7. 完成后给出从零部署到阿里云 ECS 的步骤和最终验收清单。

请先列出部署文件和本地验证命令，然后实现。完成后给出部署步骤、回滚方案、备份方案和验收清单。
```

---

# 6. 每阶段结束时必须产出的内容

每个阶段结束时，AI 必须输出：

```txt
1. 完成了什么
2. 修改/新增了哪些文件
3. 如何运行
4. 如何测试
5. 验收清单
6. 已知问题
7. 下一阶段建议
```

每个阶段结束建议创建一次 Git commit：

```bash
git add .
git commit -m "stage-1 frontend shell and design system"
git commit -m "stage-2 backend api and docker mysql"
git commit -m "stage-3 frontend core flow integration"
git commit -m "stage-4 pwa and ux polish"
git commit -m "stage-5 docker deployment"
```

---

# 7. 最重要的开发提醒

这个项目最容易失败的地方不是技术，而是范围失控。

请始终记住：

```txt
首页不是 Dashboard
日志不是报表
记录页不是复杂训练日志
回声不是鸡汤弹窗
设置不是个人中心
后端不是微服务
部署不是 Kubernetes
```

真正要打磨的是：

```txt
打开首页，一眼知道最近练得怎么样。
练完之后，30–60 秒记完。
保存之后，看到一次安静的回声。
想回看时，像翻日历一样点一天。
```
