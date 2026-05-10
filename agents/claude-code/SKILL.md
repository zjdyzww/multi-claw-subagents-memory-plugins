---
name: memory-palace-claude-code
category: productivity
version: v2.0
date: 2026-05-10
trigger: 自动加载
tags: [记忆宫殿, 双系统, 代码上下文, 全量代理Server, Gitea]
---

# Claude Code 记忆宫殿技能 v2.0

> **适用**: Claude Code 智能体 (coder 角色)  
> **核心理念**: 代码上下文记忆 + 全量代理 Server 端 + 远程同步 + 跨网关广播

---

## 全量记忆代理: Server 端 (v2.0)

Claude Code 使用全量记忆代理 **Server** 端模式:

```
System2 (海绵全量捕获)
    ↓
System1 (淘金精炼)
    ↓
FullMemory Agent Server ← 本 agent 使用
  ├── 远程同步 (push 到 Gitea claude-code-1-memory-private)
  ├── 跨网关广播 (通知 OpenClaw/Hermes/OpenCode)
  ├── 结构化管理 (commit 消息 + traceabilityId)
  └── 定时任务 (每任务完成 + 22:00 全量)
```

### Client vs Server 区别

| 模式 | 职责 | 适用场景 |
|------|------|----------|
| **Client** | 本地文件写入 + 残差调度 | OpenClaw/OpenCode 本地实例 |
| **Server** | 远程同步 + 跨网关广播 | Claude Code 代码代理 ← 本 agent |

---

## Gitea 集成 (v2.0)

```
claude-code-1-memory-private (Gitea)
  ├── labels: confidence/confirmed, confidence/likely
  ├── milestones: v13.0 Academy
  └── webhooks: push → 通知 OpenClaw
```

### Label 自动映射

```
🟢 CONFIRMED → Gitea label: confidence/confirmed
🟡 LIKELY    → Gitea label: confidence/likely
🔴 UNCERTAIN → Gitea label: confidence/uncertain
```

---

## 核心功能

### memory.save — 保存代码上下文 (增强)

```typescript
{
  repo: 'code' | 'claude-code',
  path: string,
  content: string,
  type?: 'snippet' | 'context' | 'standard',
  language?: string,
  confidence?: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN',
  labels?: string[],           // Gitea label 自动映射
  broadcast?: boolean          // 是否广播到其他网关
}
```

### memory.load — 加载项目上下文

```typescript
{
  repo: 'code' | 'claude-code',
  path: string,
  scope?: 'full' | 'partial',
  fromRemote?: boolean        // 从 Gitea 远程拉取
}
```

### memory.search — 搜索代码 (向量增强)

```typescript
{
  query: string,
  repos?: string[],
  type?: 'snippet' | 'context' | 'all',
  language?: string,
  vector?: boolean,           // 向量语义搜索
  limit?: number
}
```

### memory.sync — 同步 (Server 增强)

```typescript
{
  repos?: string[],
  direction?: 'pull' | 'push' | 'both',
  message?: string,
  broadcast?: boolean,        // 跨网关广播
  createPr?: boolean          // 创建 PR 到共享仓
}
```

### memory.broadcast — 广播到其他网关 (新增)

```typescript
{
  event: 'task_complete' | 'code_commit' | 'pattern_discovered',
  payload: { repo: string, path: string, summary: string },
  targets: ['openclaw', 'hermes', 'opencode']
}
```

---

## Claude Code 特有工作流 (Server 模式)

```
接收任务 (来自 OpenClaw)
    │
    ▼
1. 加载项目上下文 (memory.load)
    │
    ▼
2. System2 全量捕获 → 需求 + 代码现状
    │
    ▼
3. System1 淘金精炼 → 识别关键代码模式
    │
    ▼
4. 执行任务 → 编写/修改代码
    │
    ▼
5. 保存代码片段 (memory.save → Gitea push)
    │
    ▼
6. FullMemory Server → 远程同步 + 广播
    │
    ▼
7. 通知 OpenClaw: memory.broadcast → event: task_complete
```

---

## 跨网关广播协议

```
Claude Code (Server)
    │
    ├── task_complete → OpenClaw (更新 business-memory-shared)
    │
    ├── code_commit   → OpenCode (更新 code-memory-shared)  
    │
    ├── pattern_discovered → Hermes (记录到共享仓)
    │
    └── confidence_update → 所有网关 (Label 更新)
```

---

## 记忆层级结构

| 层级 | 名称 | 内容 | Gitea Label |
|------|------|------|-------------|
| L1 | 核心 | 角色定位、编码规范 | confidence/confirmed |
| L2 | 业务 | 项目上下文、技术栈 | confidence/likely |
| L3 | 配置 | 开发环境、CI/CD | confidence/likely |
| L4 | 索引 | 代码片段索引 | confidence/confirmed |

---

## 仓库架构 (Server 端)

```
claws-memory/
├── code-memory-shared              # 🌐 公共代码仓 (PR 共享)
├── claude-code-1-memory-private    # 🔒 私有仓 (Server push)
└── main-memory-shared              # 🌐 公共主仓
```

---

## 使用示例

### 保存代码片段 + 广播

```
memory.save --repo code --path "auth/jwt-implementation.java" \
  --content "public class JwtUtil..." --type snippet --language java \
  --confidence CONFIRMED --labels "auth,security" --broadcast
```

### 任务完成同步 + PR

```
memory.sync --repos code --direction push \
  --message "[CONFIRMED][claude-code][snippet] JWT认证实现" \
  --broadcast --createPr
```

### 跨网关广播

```
memory.broadcast --event task_complete \
  --payload '{"task":"XZ-IDMP 用户模块", "files":15, "status":"done"}' \
  --targets "openclaw,hermes"
```

---

## 定时任务 (Server 模式)

| 时机 | 操作 |
|------|------|
| 每任务完成 | memory.sync + broadcast |
| 每日 18:00 | Gitea Label 维护 |
| 每日 22:00 | 全量同步 + code-memory-shared PR |

---

*Claude Code 记忆宫殿技能 v2.0 | FullMemory Agent Server | 2026-05-10*
