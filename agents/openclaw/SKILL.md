---
name: memory-palace-openclaw
category: productivity
version: v1.0
date: 2026-05-08
trigger: 自动加载，无需手动触发
inputs: 用户消息，对话历史上下文
outputs: 记忆操作结果
tags: [记忆宫殿, 双系统, 金字塔, L1-L4, 残差趋零]
---

# OpenClaw 记忆宫殿技能

> **版本**: v1.0 | **适用**: OpenClaw 智能体 (灵禾镜 CTO)  
> **核心理念**: 三代理协作——System2记忆代理(海绵全量捕获) → System1记忆代理(淘金提炼) → 全量记忆代理(持久化同步)

---

## 核心功能

### 1. 记忆保存 (memory.save)

将信息保存到指定的记忆仓库。

**参数**：
```typescript
{
  repo: 'main' | 'business' | 'code' | 'openclaw',
  path: string,           // 文件路径
  content: string,        // Markdown 内容
  title?: string,         // 文档标题
  tags?: string[],        // 标签
  access?: 'SHARED' | 'PRIVATE',
  confidence?: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN'
}
```

**示例**：
```
我: 帮我记忆 XZ-IDMP 的技术选型决策
助手: memory.save --repo business --path "xz-idmp/decisions/tech-stack.md" --content "..."
```

### 2. 记忆加载 (memory.load)

从记忆仓库加载内容。

**参数**：
```typescript
{
  repo: 'main' | 'business' | 'code' | 'openclaw',
  path: string            // 文件路径
}
```

### 3. 记忆搜索 (memory.search)

搜索记忆内容。

**参数**：
```typescript
{
  query: string,          // 搜索关键词
  repos?: string[],       // 搜索范围
  type?: 'keyword' | 'vector',
  limit?: number
}
```

### 4. 记忆同步 (memory.sync)

同步本地与远程仓库。

**参数**：
```typescript
{
  repos?: string[],
  direction?: 'pull' | 'push' | 'both',
  message?: string
}
```

### 5. 记忆状态 (memory.status)

查看同步状态。

---

## 双系统协同工作流

```
USER 对话
    │
    ▼
┌─────────────────────────────┐
│ System 2: 海绵式吸收        │
│ 零遗漏全量扫描 → 构建表象    │
└─────────────────────────────┘
    │ 完整记忆表象
    ▼
┌─────────────────────────────┐
│ Layer 1: 主动消解           │
│ 本轮残差立即处理             │
└─────────────────────────────┘
    │ 未消解残差
    ▼
┌─────────────────────────────┐
│ System 1: 淘金式提炼        │
│ 7条标准筛选 → 写入 MEMORY.md │
└─────────────────────────────┘
    │ 置信度传播
    ▼
┌─────────────────────────────┐
│ Gitea 同步                  │
│ 10:00/22:00 + 重大变更     │
└─────────────────────────────┘
```

---

## 记忆层级结构

| 层级 | 名称 | 内容 | 大小 |
|------|------|------|------|
| L1 | 核心 | 身份、排他规则、核心协议 | ~500字 |
| L2 | 业务 | 项目上下文、团队信息 | ~500字/业务域 |
| L3 | 配置 | 运行环境、服务地址 | ~500字 |
| L4 | 索引 | 快速检索引用 | ~200字 |

---

## 置信度等级

| 等级 | 标识 | 定义 | 写入位置 |
|------|------|------|---------|
| 高 | 🟢 CONFIRMED | 用户明确表达、多次验证一致 | L1/L2 |
| 中 | 🟡 LIKELY | 单次获取、推断得出 | L2/L3 |
| 低 | 🔴 UNCERTAIN | 模糊表达、单一信号 | L3 或丢弃 |

---

## 残差趋零清理

### 三层清理机制

| Layer | 时机 | 动作 |
|-------|------|------|
| Layer 1 | 每轮对话结束 | 主动消解，标记溯源 |
| Layer 2 | 下轮对话触发 | 相关残差被解决则写入 |
| Layer 3 | 每日 10:00/22:00 | 24h降级/7d归档/30d删除 |

### 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 残差消解率 ≥ 70%（72h内）

---

## 仓库架构

```
claws-memory/
├── main-memory-shared        # 公共主仓
├── business-memory-shared     # 业务子仓
├── code-memory-shared        # 代码子仓
├── openclaw-memory-private   # OpenClaw 私有仓
├── hermes-memory-private     # Hermes 私有仓
├── claude-code-memory-private # Claude Code 私有仓
└── opencode-memory-private   # OpenCode 私有仓
```

---

## 使用示例

### 保存项目决策

```
我: XZ-IDMP 项目使用 Spring Boot 3.2 + Java 17
助手:
memory.save --repo business --path "xz-idmp/tech-stack.md" --content "# 技术选型决策\n\n## 核心技术栈\n- Spring Boot 3.2\n- Java 17\n- Vue3 + TypeScript" --confidence CONFIRMED --tags "技术选型,XZ-IDMP"
```

### 搜索记忆

```
我: 之前关于微服务拆分有什么决策?
助手:
memory.search --query "微服务拆分决策" --repos "business,main"
```

### 同步记忆

```
我: 同步所有记忆
助手:
memory.sync --repos all --direction both --message "日常同步"
```

---

## 提炼标准 (7条)

满足任一，判定为**有效事实点**：

| # | 类型 | 优先级 |
|---|------|--------|
| 1 | 用户偏好明确表达 | 🔴 最高 |
| 2 | 环境/配置变更 | 🔴 最高 |
| 3 | 关键决策结论 | 🟠 高 |
| 4 | 新增业务/项目 | 🟠 高 |
| 5 | 人员/团队变更 | 🟡 中 |
| 6 | 约束条件明确 | 🟡 中 |
| 7 | 首次获得的重要参数 | 🟡 中 |

---

*OpenClaw 记忆宫殿技能 v1.0 | 2026-05-08*
