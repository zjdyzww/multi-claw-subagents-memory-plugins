---
name: memory-palace-opencode
category: productivity
version: v1.0
date: 2026-05-08
trigger: 自动加载，无需手动触发
inputs: 用户消息，对话历史上下文
outputs: 记忆操作结果
tags: [记忆宫殿, 双系统, 向量检索, 开源协作]
---

# OpenCode 记忆宫殿技能

> **版本**: v1.0 | **适用**: OpenCode 智能体 (开源开发角色)  
> **核心理念**: 向量检索 + 开源协作 + 代码贡献

---

## 核心功能

### 1. 向量检索 (memory.search)

利用向量数据库进行语义搜索。

**参数**：
```typescript
{
  query: string,          // 语义查询
  repos?: string[],
  type?: 'keyword' | 'vector' | 'hybrid',
  limit?: number,
  threshold?: number       // 相似度阈值
}
```

**示例**：
```
我: 怎么实现 RESTful API 的统一响应格式?
助手:
memory.search --query "RESTful API 统一响应格式" --type vector --limit 5
```

### 2. 保存代码 (memory.save)

保存代码片段到仓库。

**参数**：
```typescript
{
  repo: 'code' | 'opencode',
  path: string,
  content: string,
  type?: 'snippet' | 'pattern' | 'solution',
  language?: string,
  embeddings?: boolean    // 是否生成向量
}
```

### 3. 加载上下文 (memory.load)

加载项目上下文。

**参数**：
```typescript
{
  repo: 'code' | 'opencode',
  path: string,
  includeRelated?: boolean
}
```

### 4. 同步仓库 (memory.sync)

同步本地与远程仓库。

**参数**：
```typescript
{
  repos?: string[],
  direction?: 'pull' | 'push' | 'both',
  message?: string,
  rebuildIndex?: boolean  // 重建向量索引
}
```

### 5. 索引管理 (memory.index)

管理向量索引。

**参数**：
```typescript
{
  action: 'init' | 'rebuild' | 'optimize',
  provider: 'milvus' | 'qdrant' | 'chroma'
}
```

---

## OpenCode 特有的工作流

```
接收开源任务
    │
    ▼
┌─────────────────────────────┐
│ 1. 向量语义搜索              │
│ memory.search --type vector  │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 2. 加载相关上下文            │
│ memory.load                 │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 3. System 2 海绵吸收         │
│ 分析需求和现有实现           │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 4. System 1 淘金提炼         │
│ 设计解决方案                 │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 5. 编写代码                 │
│ 遵循开源协议                │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 6. 保存并生成向量            │
│ memory.save --embeddings    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ 7. 提交 PR                  │
│ 通知 OpenClaw 审核          │
└─────────────────────────────┘
```

---

## 向量检索配置

### 支持的向量数据库

| 提供商 | 说明 | 配置 |
|--------|------|------|
| Milvus | 推荐的本地向量数据库 | localhost:19530 |
| Qdrant | 云原生向量搜索 | cloud.qdrant.io |
| Chroma | 轻量级向量数据库 | localhost:8000 |

### 索引配置

```yaml
vector_index:
  provider: milvus
  collection: memory_palace
  dimension: 1536
  metric: cosine
  top_k: 5
```

---

## 记忆层级结构

| 层级 | 名称 | 内容 |
|------|------|------|
| L1 | 核心 | 开源协议、排他规则 |
| L2 | 业务 | 项目设计、模块架构 |
| L3 | 配置 | 开发环境、CI/CD |
| L4 | 索引 | 向量索引、语义映射 |

---

## 仓库架构

```
claws-memory/
├── code-memory-shared         # 公共代码仓
├── opencode-memory-private    # OpenCode 私有仓
└── main-memory-shared         # 公共主仓
```

---

## 使用示例

### 语义搜索

```
我: 查找认证相关的代码实现
助手:
memory.search --query "认证授权实现" --type vector --limit 10
```

### 保存设计模式

```
我: 保存这个观察者模式的实现
助手:
memory.save --repo code --path "patterns/observer.java" --content "..." --type pattern --embeddings
```

### 重建索引

```
我: 重建向量索引
助手:
memory.sync --rebuildIndex --provider milvus
```

---

## 开源协作协议

### PR 提交流程

```
1. Fork 仓库
2. 创建分支
3. 实现功能
4. 保存代码 + 向量
5. 提交 PR
6. 等待审核
7. 合并后同步
```

### 与 OpenClaw 的协作

```
任务完成 → OpenClaw → 更新 business-memory-shared
代码贡献 → Claude Code → 更新 code-memory-shared
```

---

*OpenCode 记忆宫殿技能 v1.0 | 2026-05-08*
