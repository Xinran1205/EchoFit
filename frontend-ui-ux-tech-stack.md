# 私人训练记录 Web App 前端 + UI/UX 技术栈方案

> 目标：基于 **Ant Design Mobile** 做一个移动端优先、风格一致、美观、极简、丝滑、易用的训练记录 PWA。  
> 重点不是“像素级仿 iOS”，而是：**成熟 Web 控件 + App 化布局 + 克制统一的视觉系统 + 低摩擦训练记录流程**。

---

## 1. 产品 UI/UX 总原则

本项目的前端设计目标：

1. **移动端优先**
   - 优先适配 iPhone Safari。
   - 用户最终会通过“添加到主屏幕”方式使用，因此整体要接近轻量 App。
   - 桌面端只做兼容，不作为主要体验对象。

2. **极简**
   - 首页只保留“近 7 天状态”和“今天记录入口”。
   - 日志页只保留“月历 + 选中日期记录卡片”。
   - 不做复杂看板、趋势图、动作库、社交元素。

3. **少手输**
   - 训练部位：多选按钮。
   - 状态：单选按钮。
   - 训练时长：Picker。
   - 体重：Picker。
   - 备注：最后才提供少量手输。

4. **交互稳定**
   - 能用成熟组件就不用自己造轮子。
   - 复杂移动端控件优先用 Ant Design Mobile：`Picker`、`Popup`、`Selector`、`Form`、`TabBar` 等。
   - 自定义部分只做业务风格封装，不重写底层交互。

5. **情绪克制**
   - 回声反馈是产品的情绪核心，但不能鸡汤化、弹窗化、营销化。
   - 回声页应该像一个安静的完成页，而不是系统提示框。

---

## 2. 推荐技术栈

### 2.1 核心技术栈

| 类型 | 选择 | 说明 |
|---|---|---|
| 构建工具 | Vite | 轻量、启动快、适合 SPA/PWA |
| 前端框架 | React | 组件化开发，生态成熟 |
| 类型系统 | TypeScript | 保证训练记录、回声、用户配置等数据结构清晰 |
| UI 组件库 | Ant Design Mobile | 移动端 Web App 组件库，适合本项目 |
| 样式方案 | CSS Variables + CSS Modules / 普通 CSS | 保持简单，避免 Tailwind 与组件库双设计系统冲突 |
| 路由 | React Router | 管理首页、日志、记录页、回声页、登录页 |
| 状态管理 | Zustand | 轻量，适合登录态、用户配置、局部 UI 状态 |
| 日期处理 | dayjs | 处理近 7 天、月份切换、日期格式化 |
| PWA | vite-plugin-pwa | 生成 manifest、注册 service worker、支持添加到桌面 |
| 请求层 | fetch 封装 / axios 二选一 | MVP 推荐先用 fetch 封装，够轻 |
| 表单校验 | Ant Design Mobile Form 自带校验 + TypeScript | MVP 不额外引入复杂 schema 库 |
| 图标 | antd-mobile-icons | 保持和 Ant Design Mobile 风格统一 |
| 测试 | Vitest + React Testing Library，可后置 | MVP 初期可先保证类型、lint、核心工具函数测试 |

---

## 3. 为什么选 Ant Design Mobile

Ant Design Mobile 的定位就是移动端 Web App 组件库，适合：

- 移动端表单；
- Picker；
- Popup / Bottom Sheet；
- Selector；
- TabBar；
- Switch；
- Toast；
- Dialog；
- NavBar；
- Button；
- TextArea；
- List；
- Empty。

本项目不建议使用桌面端 Ant Design 的 `antd` 作为主 UI 库。  
原因是：训练记录产品是移动端优先，用户操作以点击、选择、滑动、底部弹层为主，Ant Design Mobile 更贴近使用场景。

---

## 4. 不推荐的方案

### 4.1 不推荐 Tailwind 作为主样式系统

不是 Tailwind 不好，而是本项目已经选择 Ant Design Mobile。

如果同时使用：

- Ant Design Mobile 的 CSS Variables；
- Tailwind 的 utility class；
- 自己的业务样式；

很容易形成三套视觉规则，最后导致风格不统一。

推荐策略：

```txt
Ant Design Mobile 负责控件基础体验
CSS Variables 负责全局主题
CSS Modules / 普通 CSS 负责业务页面布局和少量定制
```

### 4.2 不推荐重度 Framer Motion / Motion

这个项目需要“丝滑”，但不需要“花哨”。

Ant Design Mobile 自带很多移动端动效，例如 Picker、Popup、Swiper 等。  
MVP 阶段不建议额外引入大型动效库。

只需要自己补充：

- 按钮点击反馈；
- 页面轻微 fade/slide；
- 回声文字出现动画；
- 月份切换轻微滑动感。

这些用 CSS transition 基本够用。

### 4.3 不推荐用桌面端复杂 Calendar

日志页的月历非常简单：

- 当前月份；
- 左右切换月份；
- 有记录日期高亮；
- 今天特殊状态；
- 选中日期状态。

这个月历建议自己写一个小组件，不要引入完整桌面端 Calendar。  
原因是完整 Calendar 通常较重，而且视觉容易偏后台系统。

---

## 5. 项目依赖建议

### 5.1 初始化

```bash
npm create vite@latest training-echo-web -- --template react-ts
cd training-echo-web
npm install
```

也可以使用 pnpm：

```bash
pnpm create vite training-echo-web --template react-ts
cd training-echo-web
pnpm install
```

### 5.2 安装核心依赖

```bash
npm install antd-mobile antd-mobile-icons react-router-dom zustand dayjs
npm install -D vite-plugin-pwa
```

或 pnpm：

```bash
pnpm add antd-mobile antd-mobile-icons react-router-dom zustand dayjs
pnpm add -D vite-plugin-pwa
```

### 5.3 可选依赖

MVP 初期不建议安装太多包。

可选：

```bash
npm install clsx
```

用途：拼接 className。

如果后续需要请求层，也可以选：

```bash
npm install axios
```

但 MVP 推荐先封装原生 `fetch`，避免依赖过多。

---

## 6. 全局 UI 风格定义

### 6.1 风格关键词

```txt
柔和
克制
私密
干净
移动端 App 感
轻卡片
少阴影
少颜色
少跳转
少输入
```

### 6.2 视觉参考方向

不是严格模仿某个 App，而是组合以下感觉：

```txt
Apple Health 的克制
iOS 设置页的清晰分组
Notion 的干净
Ant Design Mobile 的稳定控件
私人日历的安静感
```

---

## 7. 设计 Token

建议建立一个 `src/styles/tokens.css`。

```css
:root:root {
  /* Ant Design Mobile theme */
  --adm-color-primary: #2563eb;
  --adm-color-success: #16a34a;
  --adm-color-warning: #f59e0b;
  --adm-color-danger: #ef4444;

  --adm-color-text: #111827;
  --adm-color-text-secondary: #6b7280;
  --adm-color-weak: #9ca3af;
  --adm-color-light: #d1d5db;
  --adm-color-border: rgba(17, 24, 39, 0.08);
  --adm-color-box: #f3f4f6;
  --adm-color-background: #ffffff;

  --adm-font-family:
    -apple-system,
    BlinkMacSystemFont,
    "SF Pro Text",
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;

  /* App custom theme */
  --app-bg: #f6f7f9;
  --app-card-bg: #ffffff;
  --app-text-main: #111827;
  --app-text-sub: #6b7280;
  --app-text-muted: #9ca3af;
  --app-border: rgba(17, 24, 39, 0.08);

  --app-primary: #2563eb;
  --app-primary-soft: #eff6ff;
  --app-success: #16a34a;
  --app-success-soft: #ecfdf5;
  --app-warning: #f59e0b;
  --app-warning-soft: #fffbeb;

  --app-radius-card: 20px;
  --app-radius-button: 14px;
  --app-radius-pill: 999px;

  --app-page-x: 16px;
  --app-section-gap: 14px;
  --app-card-padding: 16px;

  --app-shadow-card: 0 8px 24px rgba(15, 23, 42, 0.04);
  --app-tab-height: 56px;
}
```

说明：

- `:root:root` 是为了提高 CSS Variables 覆盖优先级。
- 主色不要太亮，建议用沉稳蓝。
- 部位标签不要五颜六色，统一用浅蓝/浅灰即可。
- 卡片圆角统一 20px。
- 按钮圆角统一 14px。
- 页面横向间距统一 16px。

---

## 8. 全局样式

建议建立 `src/styles/global.css`。

```css
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html,
body,
#root {
  margin: 0;
  width: 100%;
  min-height: 100%;
  background: var(--app-bg);
  color: var(--app-text-main);
  font-family: var(--adm-font-family);
}

body {
  overscroll-behavior-y: none;
}

button,
input,
textarea,
select {
  font-family: inherit;
}

.app-shell {
  min-height: 100dvh;
  background: var(--app-bg);
}

.app-page {
  min-height: 100dvh;
  padding: calc(12px + env(safe-area-inset-top)) var(--app-page-x)
    calc(80px + env(safe-area-inset-bottom));
}

.app-page-inner {
  max-width: 480px;
  margin: 0 auto;
}

.app-card {
  background: var(--app-card-bg);
  border-radius: var(--app-radius-card);
  padding: var(--app-card-padding);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-card);
}

.app-section {
  margin-top: var(--app-section-gap);
}

.app-muted {
  color: var(--app-text-sub);
}

.app-fixed-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
  background: rgba(246, 247, 249, 0.86);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--app-border);
}
```

关键点：

- 使用 `100dvh`，比传统 `100vh` 更适合移动端浏览器动态地址栏。
- 使用 `env(safe-area-inset-bottom)` 处理 iPhone 底部安全区域。
- 桌面端最大宽度 `480px`，避免页面在大屏上过宽。

---

## 9. 页面级 UX 规范

### 9.1 首页

首页目标：

```txt
训练前：快速知道最近练得怎么样
训练后：快速记录今天训练
```

页面结构：

```txt
今天
5月12日 周二

[近 7 天状态卡片]
- 训练次数
- 累计时长
- 部位分布

[今天状态卡片]
- 今天是否已记录
- 记录今天训练 / 今日已记录
```

推荐组件：

| 区块 | 组件 |
|---|---|
| 顶部标题 | 自定义 `PageHeader` |
| 状态卡片 | 自定义 `AppCard` |
| 部位标签 | 自定义 `PartPill` |
| 主按钮 | Ant Design Mobile `Button` |
| 设置入口 | Ant Design Mobile `Popup` / `Dialog` |

首页规则：

1. 不放趋势图。
2. 不放最近记录列表。
3. 不放复杂数据看板。
4. 今日已记录后，首页按钮置灰或显示完成状态。
5. 编辑今日记录统一从日志页进入，不在首页放编辑入口。

---

### 9.2 训练记录页

页面目标：

```txt
30–60 秒内完成一次训练记录
```

入口：

1. 首页：新建今天记录。
2. 日志页无记录日期：补记该天。
3. 日志页已有记录日期：编辑该天。

页面结构：

```txt
记录训练

训练日期
今天，5月12日 周二

今天练了什么？
[胸] [背] [肩] [腿]
[手臂] [核心] [有氧] [拉伸]

训练时长
60 分钟 >

今日状态
[很有效]
[正常发挥]
[有点累但坚持了]
[恢复训练]
[轻松活动一下]

体重，可选
70.5 kg >

备注，可选
今天卧推状态不错

底部固定按钮：
[保存记录]
```

推荐组件：

| 字段 | 组件 |
|---|---|
| 表单结构 | `Form` |
| 部位多选 | `Selector multiple` |
| 状态单选 | `Selector` |
| 时长选择 | `Picker` |
| 体重选择 | `Picker` |
| 备注 | `TextArea` |
| 底部保存 | `Button` + 自定义 `BottomSubmitBar` |

交互规则：

1. 日期固定，不允许在记录页随意切换日期。
2. 部位至少选择 1 个。
3. 时长必填，默认值建议为上次时长或 60 分钟。
4. 状态必填，默认可为空，引导用户主动选择。
5. 体重可选，默认显示上次体重。
6. 备注可选，最多建议 100 字以内。
7. 新建成功后进入回声页。
8. 编辑成功后返回日志页，不触发回声。

---

### 9.3 回声反馈页

页面目标：

```txt
给用户一次安静的完成感
```

页面结构：

```txt
✓

今天已记下

胸 / 背
60 分钟 · 正常发挥

“这是你近 7 天里的第 4 次训练。”

[完成]

给未来训练日的自己留一句话
```

推荐组件：

| 区块 | 组件 |
|---|---|
| 完成图标 | 自定义圆形 icon |
| 摘要卡片 | 自定义 `EchoSummaryCard` |
| 回声文字 | 自定义 `EchoMessage` |
| 完成按钮 | `Button` |
| 留一句话 | `Popup` + `TextArea` |

交互规则：

1. 只在新建记录成功后出现。
2. 编辑已有记录不触发回声。
3. 不用 Toast 替代回声页。
4. 不使用夸张动效。
5. “给未来自己的话”作为附加动作，不阻塞主流程。
6. 点击“完成”返回首页或日志，取决于来源页面。

---

### 9.4 给未来自己的话

推荐用 `Popup` 实现底部弹层。

结构：

```txt
给未来训练日的自己留一句话

[最多 50 字输入框]

[保存]
跳过
```

推荐组件：

| 字段 | 组件 |
|---|---|
| 弹层 | `Popup position="bottom"` |
| 输入 | `TextArea` |
| 字数限制 | `TextArea maxLength={50}` |
| 操作 | `Button` |

交互规则：

1. 每次回声后最多写 1 条。
2. 可跳过。
3. 成功保存后关闭弹层，不要再跳复杂页面。
4. 不做“未来话列表”。
5. 不做社交分享。

---

### 9.5 日志页

页面目标：

```txt
像翻训练日历一样查看、补记、修改
```

页面结构：

```txt
日志

< 2026年5月 >

一 二 三 四 五 六 日
      1  2  3
4  5  6  7  8  9 10
...

[选中日期记录卡片 / 空状态卡片]
```

推荐实现：

| 区块 | 组件 |
|---|---|
| 顶部标题 | 自定义 `PageHeader` |
| 月份切换 | 自定义按钮 |
| 月历 | 自定义 `MonthTrainingCalendar` |
| 有记录日期 | 自定义日期 cell 样式 |
| 当天记录 | 自定义 `TrainingRecordCard` |
| 空状态 | Ant Design Mobile `Empty` 或自定义空卡片 |
| 修改/补记按钮 | `Button` |

为什么月历建议自定义：

- 这个项目只需要单月视图。
- 只需要高亮有记录日期、今天、选中日期。
- 不需要复杂范围选择、年份面板、价格日历、日程系统。
- 自定义组件更轻、更好控样式。

交互规则：

1. 默认选中今天。
2. 点击日期后，下方卡片即时更新。
3. 有记录：显示记录卡片 + 修改按钮。
4. 无记录：显示空状态卡片 + 补记按钮。
5. 左右切换月份。
6. 可选：支持左右滑动切换月份，但不是 MVP 必须项。

---

### 9.6 设置入口

不做单独“我的”页。

首页右上角放一个轻入口。

推荐用 `Popup` 或 `Dialog`：

```txt
账号

wxr@example.com

邮件提醒
[开关]

退出登录
```

推荐组件：

| 功能 | 组件 |
|---|---|
| 设置弹层 | `Popup` |
| 邮件提醒 | `Switch` |
| 退出登录 | `Button` / `List.Item` |
| 账号信息 | `List` |

---

## 10. Ant Design Mobile 组件使用映射

| 产品场景 | 推荐组件 |
|---|---|
| 底部导航：首页 / 日志 | `TabBar` |
| 顶部返回栏 | `NavBar` |
| 主按钮 | `Button` |
| 表单 | `Form` |
| 部位多选 | `Selector multiple` |
| 状态单选 | `Selector` |
| 时长选择 | `Picker` |
| 体重选择 | `Picker` |
| 日期选择，如登录后特殊场景 | `DatePicker`，但 MVP 记录页日期固定 |
| 备注 | `TextArea` |
| 设置弹层 | `Popup` |
| 确认退出 | `Dialog` |
| 邮件提醒开关 | `Switch` |
| 轻提示 | `Toast`，仅用于保存成功/失败等短反馈 |
| 空状态 | `Empty` 或自定义空卡片 |
| 加载状态 | `Skeleton` / `SpinLoading` |
| 滑动切换月份，可选 | 自定义手势或 `Swiper` |

---

## 11. 交互细节规范

### 11.1 点击反馈

所有可点击元素需要有明确反馈。

建议：

```css
.pressable {
  transition:
    transform 120ms ease,
    opacity 120ms ease,
    background-color 120ms ease;
}

.pressable:active {
  transform: scale(0.98);
  opacity: 0.82;
}
```

适用：

- 首页卡片按钮；
- 部位标签；
- 状态选择；
- 月历日期；
- 日志记录卡片；
- 设置入口。

---

### 11.2 页面转场

MVP 可以先不做复杂路由动画。

建议最小动效：

```css
.page-enter {
  animation: page-fade-in 180ms ease-out;
}

@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

不要做：

- 大幅左右滑动；
- 复杂弹跳；
- 卡片逐个飞入；
- 过度 loading 动画。

---

### 11.3 保存反馈

保存训练记录时：

1. 保存按钮进入 loading。
2. 禁止重复提交。
3. 成功后：
   - 新建：进入回声页；
   - 编辑：返回日志页；
4. 失败时：
   - 使用 `Toast.show({ content: '保存失败，请稍后再试' })`；
   - 保留表单内容，不要清空。

---

### 11.4 空状态

空状态文案要轻，不要制造压力。

首页未记录：

```txt
今天还没有训练记录
```

日志某天无记录：

```txt
这一天还没有训练记录
```

补记按钮：

```txt
补记这天训练
```

不要写：

```txt
你今天偷懒了
你已经很久没练了
快去训练
```

---

### 11.5 Toast 使用原则

Toast 只用于短反馈：

- 保存失败；
- 网络异常；
- 已复制；
- 已保存未来话。

不要用 Toast 承载重要信息。  
尤其是回声反馈，必须是独立页面，而不是 Toast。

---

### 11.6 Dialog 使用原则

Dialog 只用于强确认：

- 退出登录；
- 放弃未保存记录；
- 删除记录，如果后续支持删除。

MVP 不建议频繁弹 Dialog。

---

## 12. 组件封装建议

即使用 Ant Design Mobile，也不要在页面里直接到处堆组件。  
建议封装一层业务组件，保证风格统一。

```txt
src/components/
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
```

### 12.1 AppCard

统一卡片风格。

```tsx
type AppCardProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function AppCard({ children, className, onClick }: AppCardProps) {
  return (
    <div
      className={['app-card', onClick ? 'pressable' : '', className]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
```

### 12.2 BottomSubmitBar

所有固定底部提交按钮都用它。

```tsx
import { Button } from 'antd-mobile'

type BottomSubmitBarProps = {
  text: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}

export function BottomSubmitBar({
  text,
  loading,
  disabled,
  onClick,
}: BottomSubmitBarProps) {
  return (
    <div className="app-fixed-bottom">
      <div className="app-page-inner">
        <Button
          block
          color="primary"
          size="large"
          loading={loading}
          disabled={disabled}
          onClick={onClick}
          style={{ borderRadius: 14 }}
        >
          {text}
        </Button>
      </div>
    </div>
  )
}
```

### 12.3 TrainingPartSelector

训练部位统一用 Selector。

```tsx
import { Selector } from 'antd-mobile'

const PART_OPTIONS = [
  { label: '胸', value: 'chest' },
  { label: '背', value: 'back' },
  { label: '肩', value: 'shoulder' },
  { label: '腿', value: 'legs' },
  { label: '手臂', value: 'arms' },
  { label: '核心', value: 'core' },
  { label: '有氧', value: 'cardio' },
  { label: '拉伸', value: 'stretch' },
]

type Props = {
  value: string[]
  onChange: (value: string[]) => void
}

export function TrainingPartSelector({ value, onChange }: Props) {
  return (
    <Selector
      multiple
      columns={4}
      options={PART_OPTIONS}
      value={value}
      onChange={onChange}
      style={{
        '--border-radius': '999px',
        '--padding': '9px 12px',
        '--checked-color': 'var(--app-primary-soft)',
        '--checked-text-color': 'var(--app-primary)',
        '--color': '#f3f4f6',
      } as React.CSSProperties}
    />
  )
}
```

### 12.4 DurationPickerField

训练时长不要手输，用 Picker。

```tsx
import { Picker } from 'antd-mobile'

const durationColumns = [
  Array.from({ length: 60 }, (_, index) => {
    const value = String((index + 1) * 5)
    return {
      label: `${value} 分钟`,
      value,
    }
  }),
]

type Props = {
  value?: number
  onChange: (value: number) => void
}

export function DurationPickerField({ value, onChange }: Props) {
  return (
    <Picker
      columns={durationColumns}
      value={value ? [String(value)] : []}
      onConfirm={(val) => {
        const next = Number(val[0])
        if (!Number.isNaN(next)) onChange(next)
      }}
      title="选择训练时长"
    >
      {(items, actions) => (
        <div className="picker-field pressable" onClick={actions.open}>
          <span>训练时长</span>
          <strong>{value ? `${value} 分钟` : '请选择'}</strong>
        </div>
      )}
    </Picker>
  )
}
```

---

## 13. 目录结构建议

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx

  pages/
    HomePage/
      HomePage.tsx
      HomePage.css

    LogPage/
      LogPage.tsx
      LogPage.css

    RecordPage/
      RecordPage.tsx
      RecordPage.css

    EchoPage/
      EchoPage.tsx
      EchoPage.css

    LoginPage/
      LoginPage.tsx

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
      training.api.ts
      training.utils.ts
      training.store.ts

    echo/
      echo.types.ts
      echo.api.ts
      echo.utils.ts

    auth/
      auth.types.ts
      auth.api.ts
      auth.store.ts

    reminder/
      reminder.types.ts
      reminder.api.ts

  styles/
    tokens.css
    global.css

  utils/
    date.ts
    request.ts
```

---

## 14. 路由设计

推荐路径：

```txt
/login
/home
/log
/record/new?date=2026-05-12&source=home
/record/edit/:recordId
/echo/:recordId?source=home
```

也可以更简化：

```txt
/
/log
/record
/echo
/login
```

MVP 推荐：

| 页面 | 路由 |
|---|---|
| 首页 | `/` |
| 日志 | `/log` |
| 新建/补记记录 | `/record/new?date=YYYY-MM-DD&source=home/log` |
| 编辑记录 | `/record/edit/:recordId` |
| 回声反馈 | `/echo/:recordId?source=home/log` |
| 登录 | `/login` |

规则：

1. 首页和日志显示底部 TabBar。
2. 记录页和回声页隐藏底部 TabBar。
3. 记录页通过 query 参数接收固定日期。
4. 回声页通过 source 决定“完成”后返回首页还是日志。

---

## 15. AppShell 设计

`AppShell` 负责：

- 页面背景；
- 底部导航；
- safe area；
- 桌面端居中；
- 判断哪些页面显示 TabBar。

示意：

```tsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import {
  AppOutline,
  CalendarOutline,
} from 'antd-mobile-icons'

const tabs = [
  {
    key: '/',
    title: '首页',
    icon: <AppOutline />,
  },
  {
    key: '/log',
    title: '日志',
    icon: <CalendarOutline />,
  },
]

const tabVisiblePaths = ['/', '/log']

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const showTabBar = tabVisiblePaths.includes(location.pathname)

  return (
    <div className="app-shell">
      <Outlet />

      {showTabBar && (
        <div className="app-tabbar">
          <div className="app-page-inner">
            <TabBar
              activeKey={location.pathname}
              onChange={(key) => navigate(key)}
              safeArea
            >
              {tabs.map((item) => (
                <TabBar.Item
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                />
              ))}
            </TabBar>
          </div>
        </div>
      )}
    </div>
  )
}
```

CSS：

```css
.app-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: calc(var(--app-tab-height) + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--app-border);
  z-index: 100;
}
```

---

## 16. PWA 配置

### 16.1 index.html

```html
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />

  <title>回声训练</title>
  <meta
    name="description"
    content="一个极简、私密的训练记录空间"
  />

  <meta name="theme-color" content="#f6f7f9" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="回声训练" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />

  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
</head>
```

### 16.2 vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: '回声训练',
        short_name: '训练',
        description: '一个极简、私密的训练记录空间',
        theme_color: '#f6f7f9',
        background_color: '#f6f7f9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
```

### 16.3 PWA 注意点

1. 必须准备：
   - `favicon.ico`
   - `apple-touch-icon.png`
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `pwa-512x512-maskable.png`

2. iOS Safari 添加到桌面后，体验是否像 App，很大程度取决于：
   - `display: standalone`
   - `apple-mobile-web-app-capable`
   - `apple-touch-icon`
   - `viewport-fit=cover`
   - safe area 处理
   - 底部导航不要被 Home Indicator 遮挡

3. MVP 的邮件提醒是服务端邮件，不依赖 PWA 推送。  
   不要把 PWA Push Notification 作为 MVP 必做。

---

## 17. 数据类型建议

### 17.1 训练部位

```ts
export type TrainingPart =
  | 'chest'
  | 'back'
  | 'shoulder'
  | 'legs'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'stretch'
```

### 17.2 训练状态

```ts
export type TrainingMood =
  | 'effective'
  | 'normal'
  | 'tired_but_done'
  | 'recovery'
  | 'light'
```

### 17.3 训练记录

```ts
export type TrainingRecord = {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  parts: TrainingPart[]
  durationMinutes: number
  mood: TrainingMood
  weightKg?: number
  note?: string
  futureMessageId?: string
  createdAt: string
  updatedAt: string
}
```

### 17.4 回声内容

```ts
export type EchoMessage = {
  id: string
  userId: string
  source: 'future_message' | 'fact' | 'system'
  content: string
  relatedRecordId?: string
  createdAt: string
  usedAt?: string
}
```

---

## 18. 前端状态划分

### 18.1 服务端状态

这些数据来自后端：

- 用户信息；
- 训练记录；
- 回声内容；
- 邮件提醒配置。

MVP 初期可以用普通 API 请求 + 页面局部状态。  
如果后续页面数据复杂，再考虑引入 TanStack Query。

### 18.2 客户端状态

这些适合 Zustand：

- 登录态缓存；
- 设置弹层是否打开；
- 回声页来源；
- 表单临时草稿；
- 当前日志选中的月份和日期。

### 18.3 不要过早引入复杂状态管理

MVP 不需要 Redux。  
这个产品的数据关系非常简单，Redux 会让工程变重。

---

## 19. API 请求封装建议

`src/utils/request.ts`

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

type RequestOptions = RequestInit & {
  auth?: boolean
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  headers.set('Content-Type', 'application/json')

  if (options.auth) {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}
```

---

## 20. 性能与丝滑体验要求

### 20.1 首屏

首页首屏只加载：

- 用户今天记录状态；
- 近 7 天统计；
- 基础用户信息。

不要在首页加载：

- 全部历史记录；
- 所有回声内容；
- 复杂统计；
- 大型图表库。

### 20.2 日志页

日志页按月份加载记录。

```txt
GET /records?month=2026-05
```

不要一次性拉取全部历史训练记录。

### 20.3 记录页

记录页只需要：

- 当前日期；
- 上次体重；
- 如果编辑，则拉取对应记录。

### 20.4 回声页

回声页只需要：

- 当前记录摘要；
- 本次生成的回声。

---

## 21. 可访问性与可用性

虽然是个人项目，也建议保持基本可用性：

1. 点击目标不小于 44px。
2. 按钮文案明确，不用抽象图标代替文字。
3. 颜色不能作为唯一信息来源，例如有记录日期除了颜色，也可以有小圆点。
4. 表单错误要出现在对应字段附近。
5. 保存中按钮显示 loading。
6. 网络失败后保留用户输入。
7. 备注输入不要自动聚焦，避免进入页面就弹键盘。

---

## 22. 文案风格

文案要短、轻、克制。

### 22.1 首页

```txt
近 7 天
今天
今天还没有训练记录
今天的训练已经记下来了
记录今天训练
```

### 22.2 日志

```txt
这一天还没有训练记录
补记这天训练
修改这天记录
```

### 22.3 回声

```txt
今天已记下
给未来训练日的自己留一句话
完成
```

### 22.4 错误提示

```txt
请选择训练部位
请选择训练时长
请选择今日状态
保存失败，请稍后再试
网络异常，请检查连接
```

不要写得太“产品经理味”，也不要过度鼓励。

---

## 23. MVP 落地优先级

### P0：必须完成

- Vite + React + TS 项目初始化；
- Ant Design Mobile 接入；
- 全局主题变量；
- AppShell + 底部 TabBar；
- 首页；
- 记录页；
- 回声页；
- 日志页；
- PWA manifest；
- iPhone Safari 真机测试；
- safe area 适配。

### P1：体验增强

- 保存 loading；
- 空状态卡片；
- 页面轻微入场动画；
- 回声页轻微动画；
- 月份切换动画；
- 设置 Popup；
- 邮件提醒 Switch。

### P2：后续优化

- 离线壳；
- 错误边界；
- Skeleton；
- 更完整的测试；
- 设计 token 深化；
- 深色模式；
- 桌面端更精致适配。

---

## 24. 最终推荐版本

建议你最终采用：

```txt
Vite + React + TypeScript
Ant Design Mobile
CSS Variables + CSS Modules / 普通 CSS
React Router
Zustand
dayjs
vite-plugin-pwa
antd-mobile-icons
```

不要一开始引入：

```txt
Redux
大型图表库
桌面端 antd
复杂动画库
复杂 Calendar 库
Tailwind 全量设计系统
```

---

## 25. 验收清单

### 视觉一致性

- [ ] 页面背景统一为浅灰。
- [ ] 卡片圆角统一。
- [ ] 主色统一。
- [ ] 按钮高度统一。
- [ ] 标签样式统一。
- [ ] 页面横向间距统一。
- [ ] 字体使用系统字体。
- [ ] 不出现后台管理风格组件。

### 易用性

- [ ] 训练记录 30–60 秒内能完成。
- [ ] 核心字段无需键盘输入。
- [ ] 保存失败不清空表单。
- [ ] 今天已记录后首页不再提供新增入口。
- [ ] 编辑记录不触发回声。
- [ ] 补记记录触发回声。
- [ ] 日志页默认选中今天。

### 移动端体验

- [ ] iPhone Safari 正常使用。
- [ ] 添加到桌面后显示正确图标。
- [ ] 底部 TabBar 不被 Home Indicator 遮挡。
- [ ] 固定底部按钮不被 Home Indicator 遮挡。
- [ ] Picker / Popup 手感正常。
- [ ] 页面没有横向滚动。
- [ ] 输入框不会破坏布局。

### 极简原则

- [ ] 首页只有两个核心区块。
- [ ] 日志页只有月历和当天卡片。
- [ ] 不做看板。
- [ ] 不做趋势图。
- [ ] 不做社交。
- [ ] 不做复杂动作库。
- [ ] 不做复杂设置页。

---

## 26. 官方参考资料

- Ant Design Mobile 官方站点：https://mobile.ant.design/
- Ant Design Mobile GitHub：https://github.com/ant-design/ant-design-mobile
- Ant Design Mobile Theming：https://mobile.ant.design/guide/theming/
- Ant Design Mobile Picker：https://mobile.ant.design/components/picker/
- Ant Design Mobile Selector：https://mobile.ant.design/components/selector/
- Ant Design Mobile TabBar：https://mobile.ant.design/components/tab-bar/
- Vite 官方文档：https://vite.dev/
- Vite PWA 官方文档：https://vite-pwa-org.netlify.app/
- React 官方文档：https://react.dev/
- React Router 官方文档：https://reactrouter.com/
- Day.js 官方文档：https://day.js.org/
