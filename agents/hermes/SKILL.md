---
name: memory-palace-hermes
category: productivity
version: v1.0
date: 2026-05-08
trigger: 自动加载，无需手动触发
inputs: 用户消息，对话历史上下文
outputs: 记忆操作结果
tags: [记忆宫殿, 双系统, 同步协调, 广播路由]
---

# Hermes 记忆宫殿技能

> **版本**: v1.0 | **适用**: Hermes 智能体 (记忆网关角色)  
> **核心理念**: 三代理协作——System2记忆代理(全量捕获) + System1记忆代理(淘金提炼) + 全量记忆代理(持久化同步) + 多网关协调广播

---

## 核心功能

### 1. 同步协调 (memory.sync)

协调所有网关的记忆同步。

**参数**：
```typescript
{
  repos?: 'all' | 'main' | 'business' | 'code' | 'hermes',
  direction?: 'pull' | 'push' | 'both',
  strategy?: 'rebase' | 'merge' | 'force',
  message?: string
}
```

### 2. 广播管理 (memory.broadcast)

向所有网关广播记忆更新。

**参数**：
```typescript
{
  event: string,           // 事件类型
  content: string,         // 广播内容
  recipients?: string[],   // 目标网关
  priority?: 'high' | 'normal' | 'low'
}
```

### 3. 一致性检查 (memory.check)

检查各仓库的一致性。

**参数**：
```typescript
{
  repos?: string[],
  action?: 'status' | 'fix' | 'report'
}
```

### 4. 冲突解决 (memory.resolve)

解决记忆冲突。

**参数**：
```typescript
{
  conflictId: string,
  resolution: 'local' | 'remote' | 'merge' | 'manual',
  content?: string         // 手动解决时的内容
}
```

### 5. 记忆加载 (memory.load)

加载记忆内容。

**参数**：
```typescript
{
  repo: string,
  path: string,
  gateway?: 'openclaw' | 'claude-code' | 'opencode' | 'hermes'
}
```

---

## Hermes 特有的工作流

```
接收广播 (来自各网关)
    │
    ▼
┌─────────────────────────────┐
│ System 2: 海绵式吸收         │
│ 100% 吸收所有广播内容        │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 验证广播格式                 │
│ 检查签名和来源               │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 路由到对应仓库              │
│ 根据仓库类型分发            │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 冲突检测                    │
│ 检测是否与其他仓库冲突       │
└─────────────────────────────┘
    │
    ├─ 无冲突 → 写入仓库
    │
    └─ 有冲突 → 解决或上报
    │
    ▼
┌─────────────────────────────┐
│ System 1: 淘金提炼          │
│ 从广播中提炼高价值信息       │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 广播确认                    │
│ 通知相关网关同步结果         │
└─────────────────────────────┘
```

---

## 广播协议

### 广播类型

| 类型 | 触发条件 | 目标 |
|------|----------|------|
| `decision` | OpenClaw 决策完成 | 所有网关 |
| `code_complete` | Claude Code 任务完成 | OpenClaw, OpenCode |
| `pr_merged` | OpenCode PR 合并 | OpenClaw, Claude Code |
| `config_change` | 配置变更 | 相关网关 |
| `sync_request` | 同步请求 | 指定网关 |

### 广播格式

```json
{
  "id": "uuid",
  "type": "decision",
  "source": "openclaw",
  "timestamp": "2026-05-08T10:00:00Z",
  "payload": {
    "title": "XZ-IDMP 技术选型决策",
    "content": "...",
    "confidence": "CONFIRMED"
  },
  "signature": "base64_signature"
}
```

---

## 仓库架构

```
claws-memory/
├── main-memory-shared          # 公共主仓
├── business-memory-shared       # 业务子仓
├── code-memory-shared          # 代码子仓
├── openclaw-memory-private     # OpenClaw 私有仓
├── hermes-memory-private       # Hermes 私有仓
├── claude-code-memory-private  # Claude Code 私有仓
└── opencode-memory-private     # OpenCode 私有仓
```

---

## 使用示例

### 同步所有仓库

```
我: 同步所有仓库
助手:
memory.sync --repos all --direction both --strategy rebase
```

### 检查一致性

```
我: 检查记忆一致性
助手:
memory.check --repos all --action status
```

### 广播决策

```
我: 广播 XZ-IDMP 的技术选型决策
助手:
memory.broadcast --event decision --content "# 技术选型\n\n..." --priority high
```

### 解决冲突

```
我: 解决这个冲突
助手:
memory.resolve --conflictId abc123 --resolution merge --content "# 合并后的内容\n..."
```

---

## 双系统协同 (Hermes 特有)

### System 2 海绵式吸收

Hermes 需要 100% 吸收各网关的广播：

```
1. 接收 OpenClaw 广播 → 记录到 episodes/
2. 接收 Claude Code 广播 → 记录到 episodes/
3. 接收 OpenCode 广播 → 记录到 episodes/
4. 构建完整记忆表象
5. 触发 Layer 1 主动消解
```

### System 1 淘金式提炼

从海量广播中提炼高价值信息：

```
1. 扫描所有 episodes/
2. 识别重大变更
3. 更新 L2_BUSINESS
4. 广播给所有网关
```

---

## 定时同步

| 时机 | 同步内容 |
|------|----------|
| 10:00 | 全量同步 |
| 22:00 | 全量同步 |
| 每小时 | 检查一致性 |
| 重大变更 | 立即广播 |

---

## 残差趋零清理

### 清理规则

| 条件 | 处理 |
|------|------|
| T > 24h 未解决 | 降级归档 |
| T > 7天 未解决 | 移入 archive/residuals/ |
| T > 30天 未解决 | 彻底删除 |

### 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 同步成功率 ≥ 99%

---

*Hermes 记忆宫殿技能 v1.0 | 2026-05-08*
