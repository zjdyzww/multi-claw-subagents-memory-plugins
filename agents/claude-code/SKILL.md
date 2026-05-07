---
name: memory-palace-claude-code
category: productivity
version: v1.0
date: 2026-05-08
trigger: 自动加载，无需手动触发
inputs: 用户消息，对话历史上下文
outputs: 记忆操作结果
tags: [记忆宫殿, 双系统, 代码上下文, 任务委派]
---

# Claude Code 记忆宫殿技能

> **版本**: v1.0 | **适用**: Claude Code 智能体 (coder 角色)  
> **核心理念**: 代码上下文记忆 + 任务执行 + 成果同步

---

## 核心功能

### 1. 保存代码上下文 (memory.save)

将代码片段、项目上下文保存到记忆仓库。

**参数**：
```typescript
{
  repo: 'code' | 'claude-code',
  path: string,           // 文件路径
  content: string,        // 代码或 Markdown
  type?: 'snippet' | 'context' | 'standard',
  language?: string,      // 代码语言
  confidence?: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN'
}
```

**示例**：
```
我: 保存这个 JWT 认证的实现
助手:
memory.save --repo code --path "auth/jwt-implementation.java" --content "..." --type snippet --language java
```

### 2. 加载项目上下文 (memory.load)

加载之前保存的项目上下文。

**参数**：
```typescript
{
  repo: 'code' | 'claude-code',
  path: string,
  scope?: 'full' | 'partial'
}
```

### 3. 搜索代码 (memory.search)

搜索已保存的代码片段和上下文。

**参数**：
```typescript
{
  query: string,          // 搜索关键词
  repos?: string[],
  type?: 'snippet' | 'context' | 'all',
  language?: string,
  limit?: number
}
```

### 4. 同步代码仓库 (memory.sync)

同步本地与远程代码仓库。

**参数**：
```typescript
{
  repos?: string[],
  direction?: 'pull' | 'push' | 'both',
  message?: string
}
```

### 5. 任务上下文 (memory.context)

获取当前任务的完整上下文。

**参数**：
```typescript
{
  taskId: string,
  includeHistory?: boolean
}
```

---

## Claude Code 特有的工作流

```
接收任务 (来自 OpenClaw)
    │
    ▼
┌─────────────────────────────┐
│ 1. 加载项目上下文            │
│ memory.load --repo claude-code │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 2. 搜索相关代码              │
│ memory.search --type snippet │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 3. System 2 海绵吸收         │
│ 全量扫描需求文档             │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 4. System 1 淘金提炼         │
│ 识别需要的代码片段           │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 5. 执行任务                 │
│ 编写/修改代码               │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 6. 保存代码片段              │
│ memory.save --type snippet   │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 7. 同步仓库                 │
│ memory.sync --repos code    │
└─────────────────────────────┘
```

---

## 记忆层级结构

| 层级 | 名称 | 内容 |
|------|------|------|
| L1 | 核心 | 角色定位、排他规则、编码规范 |
| L2 | 业务 | 项目上下文、技术栈、模块结构 |
| L3 | 配置 | 开发环境、IDE 配置、CI/CD |
| L4 | 索引 | 代码片段索引、设计模式索引 |

---

## 仓库架构

```
claws-memory/
├── code-memory-shared         # 公共代码仓
├── claude-code-memory-private # Claude Code 私有仓
└── main-memory-shared         # 公共主仓
```

---

## 使用示例

### 保存代码片段

```
我: 这段解析 JSON 的工具类帮我保存一下
助手:
memory.save --repo code --path "utils/json-parser.java" --content "public class JsonUtil..." --type snippet --language java --tags "工具类,JSON"
```

### 加载项目上下文

```
我: 加载 XZ-IDMP 后端的项目上下文
助手:
memory.load --repo claude-code --path "context/xz-idmp-backend.md" --scope full
```

### 搜索代码模式

```
我: 找一下之前保存的工厂模式实现
助手:
memory.search --query "工厂模式" --repos code --type snippet
```

### 任务完成同步

```
我: 任务完成了，同步一下
助手:
memory.sync --repos code --direction push --message "XZ-IDMP 用户模块完成"
```

---

## 编码规范检查

记忆宫殿自动检查：

| 检查项 | 说明 |
|--------|------|
| 命名规范 | 类名、方法名、变量名 |
| 注释规范 | Javadoc、关键逻辑注释 |
| 代码组织 | 包结构、模块划分 |
| 错误处理 | 异常捕获、日志记录 |

---

## 与 OpenClaw 的协作

### 任务接收

```
1. 接收 OpenClaw 分配的任务
2. 加载相关上下文
3. 执行任务
4. 保存成果
5. 通知 OpenClaw 完成
```

### 广播协议

```
任务完成 → OpenClaw → 更新 business-memory-shared
代码提交 → OpenCode → 更新 code-memory-shared
```

---

*Claude Code 记忆宫殿技能 v1.0 | 2026-05-08*
