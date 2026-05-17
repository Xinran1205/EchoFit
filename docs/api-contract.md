# EchoFit API Contract

本文档描述当前 Stage 2 后端实现的接口契约。除特别说明外，所有业务接口都要求：

- Base URL: `/api`
- Header: `Authorization: Bearer <token>`
- Content-Type: `application/json`
- 所有 `BIGINT` ID 在响应中一律按 `string` 返回

## 通用返回结构

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败：

```json
{
  "code": 40000,
  "message": "参数校验失败",
  "data": null
}
```

## 错误码

| code | 含义 |
| --- | --- |
| `40000` | 参数校验错误 |
| `40001` | 业务错误 |
| `40100` | 未登录或 token 失效 |
| `40300` | 无权访问 |
| `40900` | 资源冲突 |
| `40400` | 资源不存在 |
| `50000` | 服务端异常 |

## 枚举值

训练部位 `parts`：

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

训练状态 `mood`：

```txt
effective
normal
tired_but_done
recovery
light
```

回声来源 `echo.source`：

```txt
future_message
fact
system
```

## 认证接口

### POST `/auth/register`

请求：

```json
{
  "email": "echo@example.com",
  "password": "12345678"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "1912345678901234561",
      "email": "echo@example.com",
      "nickname": null
    }
  }
}
```

### POST `/auth/login`

请求同注册。

失败时返回：

- `40100` 邮箱或密码错误

### GET `/auth/me`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "1912345678901234561",
    "email": "echo@example.com",
    "nickname": null
  }
}
```

## 首页摘要

### GET `/home/summary`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "today": "2026-05-17",
    "todayRecorded": false,
    "last7Days": {
      "trainingDays": 3,
      "totalDurationMinutes": 185,
      "partCounts": {
        "chest": 1,
        "back": 1,
        "shoulder": 1,
        "legs": 1,
        "arms": 0,
        "core": 1,
        "cardio": 0,
        "stretch": 0
      }
    }
  }
}
```

统计口径：

- `todayRecorded`: 当前用户今天是否已有记录
- `trainingDays`: 最近 7 天内有记录的天数
- `totalDurationMinutes`: 最近 7 天训练时长总和
- `partCounts`: 最近 7 天各部位出现次数

## 训练记录

### POST `/training-records`

请求：

```json
{
  "date": "2026-05-17",
  "parts": ["chest", "back"],
  "durationMinutes": 60,
  "mood": "normal",
  "weightKg": 70.5,
  "note": "今天卧推状态不错"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "recordId": "1912345678901234561",
    "echoId": "1912345678901234562"
  }
}
```

规则：

- 同一用户同一天只能新建 1 条记录
- 新建今天记录和补记历史记录都走这个接口
- 新建成功后会立即生成一条回声

### PUT `/training-records/{recordId}`

请求：

```json
{
  "parts": ["legs", "core"],
  "durationMinutes": 75,
  "mood": "tired_but_done",
  "weightKg": 70.2,
  "note": "腿部训练完成"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "1912345678901234561",
    "userId": "1912345678901234001",
    "date": "2026-05-17",
    "parts": ["legs", "core"],
    "durationMinutes": 75,
    "mood": "tired_but_done",
    "weightKg": 70.2,
    "note": "腿部训练完成",
    "futureMessagePreview": null,
    "createdAt": "2026-05-17 12:00:00",
    "updatedAt": "2026-05-17 12:05:00"
  }
}
```

规则：

- 只能编辑自己的记录
- 编辑不触发新回声
- 日期不允许修改

### GET `/training-records/by-date?date=YYYY-MM-DD`

无记录时：

```json
{
  "code": 0,
  "message": "ok",
  "data": null
}
```

有记录时 `data` 结构与 `PUT` 响应一致。

### GET `/training-records/month?month=YYYY-MM`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "month": "2026-05",
    "records": [
      {
        "id": "1912345678901234561",
        "userId": "1912345678901234001",
        "date": "2026-05-17",
        "parts": ["legs", "core"],
        "durationMinutes": 75,
        "mood": "tired_but_done",
        "weightKg": 70.2,
        "note": "腿部训练完成",
        "futureMessagePreview": "状态一般的时候，更要把节奏保住。",
        "createdAt": "2026-05-17 12:00:00",
        "updatedAt": "2026-05-17 12:05:00"
      }
    ]
  }
}
```

### GET `/training-records/latest-weight`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "weightKg": 70.2
  }
}
```

没有历史体重时，`weightKg` 为 `null`。

## 回声

### GET `/echo/by-record/{recordId}`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "record": {
      "id": "1912345678901234561",
      "date": "2026-05-17",
      "parts": ["legs", "core"],
      "durationMinutes": 75,
      "mood": "tired_but_done",
      "weightKg": 70.2
    },
    "echo": {
      "source": "fact",
      "content": "这是你近 7 天里的第 3 次训练。"
    }
  }
}
```

### POST `/echo/future-message`

请求：

```json
{
  "recordId": "1912345678901234561",
  "content": "状态一般的时候，更要把节奏保住。"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "echoMessageId": "1912345678901234999"
  }
}
```

规则：

- 同一条记录最多保存 1 条未来话
- 最大长度 50 字
- 保存后会回写到对应训练记录的 `futureMessagePreview`

## 提醒配置

### GET `/reminder/config`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "enabled": true,
    "remindHour": 20,
    "remindMinute": 0
  }
}
```

### PUT `/reminder/config`

请求：

```json
{
  "enabled": false
}
```

响应结构与 `GET` 相同。

规则：

- 当前实现只支持提醒开关
- 提醒时间固定为每天 `20:00`
- 第一次读取时若数据库没有配置，会自动创建默认配置

## 前端接入注意事项

- 认证成功后保存 `token`，后续请求统一携带 `Authorization: Bearer <token>`
- `40100` 代表需要跳转登录页并清理本地 token
- `40900` 重点用于“同一天重复记录”与“同一记录重复保存未来话”
- `GET /training-records/by-date` 可能返回 `data: null`，前端需要明确处理空状态
- 训练记录与回声接口里的 ID 全部按 `string` 使用，不要转成 `number`
