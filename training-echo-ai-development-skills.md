# 私人训练记录 Web App：AI 开发 Skills 文档

> 用途：给后续每次 AI 开发使用的协作规范、提示词模板、代码质量标准、UI/UX 验收标准和调试方法。  
> 目标：让 AI 每次只开发一个阶段，稳定推进，不乱扩功能，不破坏前端体验。

---

## 1. AI 协作总原则

### 1.1 每次只开发一个阶段

必须遵守：

```txt
一次只做一个 Stage
一次只解决一个清晰目标
一次只修改和目标相关的文件
```

不要让 AI 一次性做：

```txt
前端 + 后端 + 部署 + 重构 + UI 改版 + 新功能
```

否则非常容易：

- 代码失控；
- UI 风格变乱；
- 接口和前端类型不一致；
- 旧功能被改坏；
- 项目范围膨胀。

---

## 2. AI 每次开发前必须输入的上下文

每次找 AI 开发时，至少给它以下内容：

```txt
1. 当前要开发的 Stage 编号和名称
2. 当前项目技术栈
3. 项目不可变产品边界
4. 当前已有目录结构
5. 当前要实现的具体功能
6. 不允许做什么
7. 验收标准
8. 报错日志或截图，如果是修 bug
```

推荐开头：

```txt
你现在只开发 Stage X，不要跨阶段。
请先阅读以下项目规则，然后只实现本阶段目标。
```

---

## 3. 项目不可变规则

这些规则每次都要提醒 AI。

### 3.1 产品规则

```txt
这是一个私人训练记录 Web App。
不是训练计划 App。
不是饮食管理 App。
不是社交 App。
不是复杂动作库。
不是数据看板。
```

### 3.2 信息架构规则

```txt
底部导航只有：首页、日志。
记录不是 Tab，是首页动作入口。
设置不是独立“我的”页，只在首页右上角轻入口。
```

### 3.3 首页规则

```txt
首页只有两个核心区块：
1. 近 7 天状态总览
2. 今天状态 + 记录入口
```

不允许 AI 增加：

```txt
趋势图
最近记录列表
排行榜
连续打卡
周报卡片
复杂 Dashboard
```

### 3.4 记录页规则

```txt
记录页是独立全屏页。
核心输入优先用 Selector / Picker。
训练日期只读，不允许随意切换。
提交按钮固定底部。
新建和编辑共用结构。
```

### 3.5 回声规则

```txt
只有新建记录成功后触发回声。
补记也算新建，会触发回声。
编辑已有记录不触发回声。
回声页是独立完成页，不是 Toast。
```

### 3.6 日志页规则

```txt
日志页只做：月历 + 选中日期记录卡片。
点击日期后下方卡片更新。
有记录可修改。
无记录可补记。
```

不允许 AI 增加：

```txt
趋势图
筛选器
最近记录列表
表格模式
看板摘要
```

---

## 4. 前端技术 Skills

前端是本项目重点。

### 4.1 前端技术栈

固定使用：

```txt
Vite
React
TypeScript
Ant Design Mobile
CSS Variables
CSS Modules / 普通 CSS
React Router
Zustand
dayjs
vite-plugin-pwa
antd-mobile-icons
```

不建议引入：

```txt
桌面端 antd
Tailwind 全量设计系统
Redux
大型动画库
大型图表库
复杂 Calendar 库
```

---

## 5. 前端 UI/UX Skills

### 5.1 视觉关键词

```txt
极简
克制
移动端优先
浅灰背景
白色卡片
大圆角
少阴影
少颜色
大按钮
少手输
App 感
```

### 5.2 页面布局规则

每个页面都应使用：

```txt
AppShell
AppPage
AppCard
PageHeader
```

统一：

- 页面背景；
- 页面横向间距；
- 卡片圆角；
- 按钮高度；
- 字体；
- safe area；
- 最大宽度。

### 5.3 Ant Design Mobile 使用规则

优先使用：

```txt
Button
TabBar
NavBar
Form
Selector
Picker
Popup
Switch
TextArea
Toast
Dialog
Empty
Skeleton
SpinLoading
```

不要直接使用原生：

```txt
checkbox
radio
select
alert
confirm
```

除非有明确理由。

### 5.4 记录页输入规则

| 字段 | 交互 |
|---|---|
| 训练部位 | `Selector multiple` |
| 训练状态 | `Selector single` |
| 训练时长 | `Picker` |
| 体重 | `Picker` |
| 备注 | `TextArea`，放最后 |

原则：

```txt
让用户尽量点选，不要打字。
```

### 5.5 移动端细节规则

必须注意：

- 点击目标至少 44px。
- 底部按钮处理 safe area。
- TabBar 处理 safe area。
- 不出现横向滚动。
- 页面不要过度挤压。
- 表单保存失败不清空。
- 键盘弹出不遮挡备注输入。
- Popup/Picker 在 iPhone Safari 测试。

---

## 6. 前端代码 Skills

### 6.1 类型优先

所有核心对象必须有类型：

```txt
User
TrainingRecord
TrainingPart
TrainingMood
HomeSummary
EchoResponse
ReminderConfig
ApiResponse<T>
```

注意：

后端 BIGINT ID 前端建议使用 `string`，不要用 `number`。

### 6.2 组件封装

不要在页面里直接堆大量 Ant Design Mobile 组件。  
必须封装业务组件：

```txt
AppCard
BottomSubmitBar
TrainingPartSelector
TrainingStatusSelector
DurationPickerField
WeightPickerField
TrainingRecordCard
MonthTrainingCalendar
EchoMessagePanel
FutureMessageSheet
SettingsSheet
```

### 6.3 API 封装

推荐结构：

```txt
utils/request.ts
features/auth/auth.api.ts
features/training/training.api.ts
features/echo/echo.api.ts
features/reminder/reminder.api.ts
```

`request.ts` 要负责：

- baseURL；
- token；
- 统一响应；
- 统一错误；
- 401 处理。

### 6.4 状态管理

Zustand 只用于：

```txt
auth store
少量 UI store
必要的草稿状态
```

不要把所有接口数据都塞进 Zustand。  
页面服务端数据可以先本地 state + useEffect。

---

## 7. 后端技术 Skills

### 7.1 后端技术栈

固定使用：

```txt
Java 21
Spring Boot 3.5.14
Spring MVC
MyBatis-Plus 3.5.16 boot3 starter
MySQL 8.4.9
Lombok
Spring Security + JWT
Spring Scheduler
Spring Mail
Docker Compose
Nginx
```

### 7.2 后端分层

推荐：

```txt
controller
service
mapper
entity
dto
config
common
```

不要搞复杂 DDD。  
不要引入微服务。

### 7.3 后端业务规则

必须强制：

- 每位用户每天最多一条训练记录。
- 所有查询必须按 user_id 隔离。
- 新建记录触发回声。
- 编辑记录不触发回声。
- 训练日期编辑时不能修改。
- 未来话最多 50 字。
- 邮件提醒只支持开关，固定 20:00。
- 密码必须 BCrypt。
- JWT 不能无限期。

### 7.4 后端接口风格

统一返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

接口：

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

### 7.5 数据库 Skills

核心表：

```txt
app_user
training_record
echo_message
echo_history
reminder_config
```

注意：

- `parts_json` MVP 用 JSON 存储。
- `duration_minutes` 用 INT。
- `weight_kg` 用 DECIMAL。
- 日期用 DATE。
- `created_at` / `updated_at` 统一。
- 逻辑删除用 `deleted`。
- 唯一约束保证每天一条记录。

---

## 8. API Contract Skills

### 8.1 前后端对齐原则

前后端必须保持：

```txt
枚举值一致
字段命名一致
日期格式一致
错误结构一致
ID 类型一致
```

### 8.2 日期格式

统一：

```txt
date: YYYY-MM-DD
month: YYYY-MM
datetime: ISO string 或 yyyy-MM-dd HH:mm:ss
```

### 8.3 枚举值

训练部位：

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

训练状态：

```txt
effective
normal
tired_but_done
recovery
light
```

### 8.4 接口错误处理

前端必须处理：

- 400 参数错误；
- 401 未登录 / token 过期；
- 409 同一天重复记录；
- 500 服务端异常；
- 网络错误。

---

## 9. Debug Skills

### 9.1 前端常见问题

#### 问题：页面底部被 iPhone Home Indicator 遮挡

检查：

```css
padding-bottom: env(safe-area-inset-bottom);
viewport-fit=cover
```

#### 问题：页面有横向滚动

检查：

- 是否有固定宽度元素；
- 是否有超长文本；
- 是否有 grid gap 超出；
- 是否 body width 超过 100%。

#### 问题：Picker 不弹出

检查：

- 是否正确使用 Ant Design Mobile Picker render props；
- 是否被上层 z-index 遮挡；
- 是否在移动端 Safari 测试。

#### 问题：登录后刷新丢状态

检查：

- token 是否保存；
- App 启动时是否调用 `/auth/me`；
- 401 时是否清理 token。

### 9.2 后端常见问题

#### 问题：CORS 报错

检查：

- `CORS_ALLOWED_ORIGINS` 是否包含前端地址；
- 是否允许 Authorization header；
- OPTIONS 预检是否放行。

#### 问题：JWT 验证失败

检查：

- 前端是否加 `Bearer `;
- JWT_SECRET 是否一致；
- token 是否过期；
- filter 是否跳过 `/auth/login` 和 `/auth/register`。

#### 问题：重复新建记录没拦住

检查：

- 数据库唯一索引；
- service 层是否先查重；
- 并发时是否捕获唯一索引异常。

#### 问题：MySQL 容器启动失败

检查：

- volume 里是否已有旧数据；
- root 密码是否变更；
- init SQL 是否只在第一次启动执行；
- 端口 3306 是否被占用。

---

## 10. AI Prompt 模板

### 10.1 新阶段开发模板

```txt
你现在只开发 Stage X：{阶段名称}。

项目背景：
这是一个移动端优先的私人训练记录 Web App，核心是训练前看近 7 天状态，训练后快速记录，新建记录后看到回声，日志页按月历回看/补记/修改。

当前技术栈：
前端：Vite + React + TypeScript + Ant Design Mobile + CSS Variables + React Router + Zustand + dayjs + vite-plugin-pwa。
后端：Java 21 + Spring Boot 3.5.14 + Spring MVC + MyBatis-Plus 3.5.16 + MySQL 8.4.9 + Docker + Nginx。

本阶段目标：
{写清楚只做什么}

必须遵守：
1. 不跨阶段。
2. 不新增偏离 MVP 的功能。
3. 前端体验优先。
4. 保持 UI 风格统一。
5. 不引入未批准的新技术。
6. 保持代码可运行、可测试。

禁止事项：
{列出本阶段禁止做什么}

请先输出：
1. 你理解的目标。
2. 你计划新增/修改的文件。
3. 可能风险。
然后再给出代码。
最后输出运行命令和验收清单。
```

### 10.2 Bug 修复模板

```txt
现在只修这个 bug，不做重构，不新增功能。

现象：
{描述 bug}

复现步骤：
1. ...
2. ...
3. ...

期望：
{期望结果}

实际：
{实际结果}

相关代码/日志：
{贴代码或日志}

请你：
1. 先判断最可能原因。
2. 列出需要检查的文件。
3. 给出最小修改方案。
4. 修改后说明如何验证。
```

### 10.3 UI 打磨模板

```txt
现在只打磨这个页面的 UI/UX，不改业务逻辑。

页面：
{页面名}

当前问题：
{比如间距乱、按钮不明显、移动端拥挤、记录流程不顺}

必须保持：
1. Ant Design Mobile。
2. 统一浅灰背景、白色卡片、大圆角。
3. 不新增复杂功能。
4. 不破坏已有 API。
5. iPhone Safari 优先。

请你给出：
1. UI 问题诊断。
2. 修改方案。
3. 具体代码。
4. 移动端验收清单。
```

### 10.4 Code Review 模板

```txt
请你只做 code review，不改代码。

重点检查：
1. 是否符合本项目产品边界。
2. 是否保持前端 UI/UX 风格统一。
3. 是否引入了不必要复杂度。
4. 是否破坏了首页/记录页/回声页/日志页规则。
5. TypeScript 类型是否合理。
6. API 错误处理是否完整。
7. 移动端 safe area 是否处理。
8. 后端是否按 user_id 隔离数据。
9. 新建/编辑记录是否正确触发/不触发回声。

请按 P0/P1/P2 给出问题清单。
```

---

## 11. 每阶段验收 Prompt

每个阶段写完后，用这个问 AI：

```txt
请你根据本阶段 Step 文档做一次验收。

要求：
1. 逐条对照验收清单。
2. 标记：已完成 / 部分完成 / 未完成。
3. 对未完成项说明原因。
4. 给出最小补齐方案。
5. 不要提出偏离 MVP 的新功能。
```

---

## 12. Git Skills

每阶段至少一个 commit：

```bash
git add .
git commit -m "stage-1 frontend shell and design system"
git commit -m "stage-2 backend api and docker mysql"
git commit -m "stage-3 frontend core flow integration"
git commit -m "stage-4 pwa and ux polish"
git commit -m "stage-5 docker deployment"
```

建议每次 AI 大改前先提交当前可运行版本：

```bash
git status
git add .
git commit -m "checkpoint before ai changes"
```

这样 AI 改坏了可以回滚。

---

## 13. 质量红线

以下情况必须让 AI 停下来修：

### 13.1 产品红线

- 首页变成 Dashboard。
- 日志页变成复杂列表/报表。
- 回声变成 Toast。
- 记录页加入动作库/组数/重量。
- 增加社交、排行榜、打卡系统。
- 增加复杂设置页。

### 13.2 前端红线

- 引入桌面端 antd。
- 引入 Tailwind 后导致双设计系统。
- 页面间距、圆角、按钮风格不一致。
- iPhone Safari 出现横向滚动。
- 底部按钮被 Home Indicator 遮挡。
- 保存失败清空用户输入。
- 表单字段大量手输。

### 13.3 后端红线

- 密码明文存储。
- 不按 user_id 隔离数据。
- 编辑记录触发回声。
- 同一天可以创建多条记录。
- 生产 CORS 放开 `*`。
- JWT_SECRET 使用默认值。
- 数据库端口直接暴露公网。

---

## 14. 最终 Definition of Done

整个 MVP 完成时，必须满足：

```txt
用户可以邮箱注册/登录。
首页能看近 7 天训练状态。
用户可以 30–60 秒内完成训练记录。
新建记录后一定进入回声页。
用户可以写一句给未来自己的话。
日志页可以按月历查看、补记、修改。
编辑记录不触发回声。
邮件提醒开关可用。
iPhone Safari 可用。
添加到主屏幕后体验正常。
本地 Docker 全链路可跑通。
阿里云部署方案可执行。
```

---

## 15. 最重要的一句话

后续所有 AI 开发都要围绕这句话：

```txt
不要把它做成复杂健身系统，要把它做成一个极简、安静、顺手、移动端体验很好的私人训练记录空间。
```
