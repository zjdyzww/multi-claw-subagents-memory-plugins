# Multi-Claw Memory Plugins 架构设计

> 版本: v1.0  
> 日期: 2026-05-08

## 1. 系统概述

### 1.1 设计目标

本系统旨在为多智能体环境（OpenClaw、Hermes、Claude Code、OpenCode）提供统一、高效、安全的记忆管理系统，实现：

- **个体记忆私有化**：每个智能体拥有独立的私有记忆仓库
- **公共记忆共享化**：跨智能体共享业务知识、代码资产
- **同步机制可靠化**：确保多网关环境下的一致性
- **访问控制精细化**：细粒度的权限管理和审计

### 1.2 核心特性

| 特性 | 说明 |
|------|------|
| 多仓库架构 | 主仓 + 业务子仓 + 代码子仓 + 私有仓 |
| Git 同步 | 基于 Git 的分布式版本控制 |
| 全文检索 | 快速检索记忆内容 |
| 冲突解决 | 自动 + 手动混合冲突处理 |
| 事件通知 | 跨智能体实时事件总线 |
| 访问控制 | 基于智能体身份的细粒度权限 |

## 2. 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Claw Memory System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│   │ OpenClaw   │ │   Hermes    │ │Claude Code │ │  OpenCode   ││
│   │  Agent     │ │   Agent     │ │   Agent    │ │   Agent     ││
│   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘│
│          │                │                │                │       │
│   ┌──────▼────────────────▼────────────────▼────────────────▼──────┐│
│   │              Plugin SDK (shared-memory-core)                   ││
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             ││
│   │  │ Git Sync   │ │   Index     │ │  Access     │             ││
│   │  │ Manager    │ │   Engine    │ │  Control    │             ││
│   │  └─────────────┘ └─────────────┘ └─────────────┘             ││
│   │  ┌─────────────┐ ┌─────────────┐                             ││
│   │  │  Event     │ │  Conflict   │                             ││
│   │  │  Bus       │ │  Resolver   │                             ││
│   │  └─────────────┘ └─────────────┘                             ││
│   └───────────────────────────────────────────────────────────────┘│
│                              │                                     │
│   ┌─────────────────────────▼───────────────────────────────────┐│
│   │                    Git Repositories                            ││
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         ││
│   │  │  Main   │ │ Business │ │   Code   │ │ Private  │         ││
│   │  │ Memory  │ │  Memory  │ │  Memory  │ │  Memory  │         ││
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘         ││
│   └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│                        Git Server (Gitea)                         │
│                     https://git.osc.life                          │
└───────────────────────────────────────────────────────────────────┘
```

## 3. 核心模块

### 3.1 Git Sync Manager

**职责**：管理所有仓库的 Git 操作

**功能**：
- 仓库初始化（克隆/打开）
- 增量同步（fetch + pull + push）
- 冲突检测和标记
- 提交历史查询

**核心接口**：

```typescript
class GitSyncManager {
  async initRepo(config: RepoConfig): Promise<void>
  async syncRepo(repoType: string): Promise<SyncResult>
  async commitMemory(repoType: string, message: string, files: string[]): Promise<void>
  async getRepoStatus(repoType: string): Promise<RepoStatus>
  async resolveConflicts(repoType: string, conflicts: Conflict[]): Promise<void>
}
```

### 3.2 Index Engine

**职责**：索引和检索记忆文档

**功能**：
- Markdown 文件解析
- 全文索引构建
- 相关性搜索
- 标签聚合

**核心接口**：

```typescript
class IndexEngine {
  async indexDocument(repoType: RepoType, filePath: string): Promise<void>
  async indexRepo(repoPath: string, repoType: RepoType): Promise<number>
  async searchMemory(query: SearchQuery): Promise<SearchResult[]>
  async getRelatedMemories(topic: string, limit?: number): Promise<MemoryDocument[]>
}
```

### 3.3 Access Control

**职责**：管理智能体对记忆的访问权限

**功能**：
- 智能体注册
- 权限验证
- 审计日志

**权限级别**：
```
PRIVATE < AGENT_LOCAL < SHARED < SHARED_WRITE
```

### 3.4 Event Bus

**职责**：跨智能体事件通知

**功能**：
- 订阅/发布模式
- 事件日志
- 智能体状态追踪

**事件类型**：
- `memory.created/updated/deleted`
- `memory.synced`
- `conflict.detected/resolved`
- `agent.online/offline`

## 4. 数据流

### 4.1 保存记忆流程

```
用户请求保存记忆
       │
       ▼
┌─────────────────┐
│  验证访问权限    │ ─── 拒绝 ───▶ 返回错误
└────────┬────────┘
         │ 允许
         ▼
┌─────────────────┐
│  解析 Frontmatter│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  写入文件系统   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  更新索引       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  发布事件       │ ─── Event Bus ───▶ 其他智能体
└─────────────────┘
```

### 4.2 同步记忆流程

```
定时触发 / 手动触发
        │
        ▼
┌─────────────────┐
│  遍历所有仓库    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Fetch │ │ Pull  │
└───┬───┘ └───┬───┘
    │         │
    │         ▼
    │    ┌────────┐
    │    │ 冲突   │ ─── 有 ───▶ 标记冲突 ───▶ 尝试自动解决
    │    │ 检测   │                 │
    │    └────────┘                 ▼
    │              ┌────────────────────────┐
    │              │     手动解决 (如需)     │
    │              └────────────────────────┘
    │                       │
    └──────────┬─────────────┘
               │
               ▼
        ┌────────────┐
        │ Git Push   │
        └─────┬──────┘
              │
              ▼
        ┌────────────┐
        │ 发布事件   │
        └────────────┘
```

## 5. 安全设计

### 5.1 认证机制

- **SSH 密钥**：推荐使用 SSH 方式访问 Git 仓库
- **HTTPS + Token**：备选方案，需配置 Git 凭据管理器

### 5.2 授权模型

```
┌─────────────────────────────────────────────────────┐
│                  Access Control Matrix               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  仓库类型    │ OpenClaw │ Hermes │ Claude │ OpenCode │
│  ─────────────────────────────────────────────────  │
│  main       │    RW    │   RW   │   RW   │    RW    │
│  business   │    RW    │   RW   │   RW   │    RW    │
│  code       │    RW    │   RW   │   RW   │    RW    │
│  openclaw   │    RW    │   -    │   -    │    -     │
│  hermes     │    -     │   RW   │   -    │    -     │
│  claude     │    -     │   -    │   RW   │    -     │
│  opencode   │    -     │   -    │   -    │    RW    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 5.3 敏感信息保护

- `.private/` 目录内容不上传到公共仓库
- 敏感配置使用环境变量而非硬编码
- 定期轮换 Git 访问令牌

## 6. 扩展性设计

### 6.1 新增智能体

1. 在 `agents` 列表中添加新智能体配置
2. 创建对应的私有仓库
3. 在 `accessControl` 中注册新智能体
4. 更新优先级映射

### 6.2 新增仓库类型

1. 在 `RepoType` 中添加新类型
2. 实现对应的路径解析逻辑
3. 配置访问规则

### 6.3 新增同步策略

实现 `SyncStrategy` 接口并注册到 `GitSyncManager`。

## 7. 性能考虑

### 7.1 索引性能

- 使用增量索引，避免全量重建
- 后台线程执行索引，不阻塞主流程
- 限制单次索引文件数量

### 7.2 同步性能

- 使用 SSH 复用连接
- 压缩传输数据
- 并行同步独立仓库

### 7.3 搜索性能

- 内存索引，SSD 存储
- 结果缓存 + TTL
- 分页限制返回数量

## 8. 监控和运维

### 8.1 监控指标

| 指标 | 说明 |
|------|------|
| `memory.sync.count` | 同步次数 |
| `memory.sync.duration` | 同步耗时 |
| `memory.sync.conflicts` | 冲突数量 |
| `memory.search.count` | 搜索次数 |
| `memory.search.latency` | 搜索延迟 |
| `memory.index.size` | 索引大小 |

### 8.2 日志

- 同步操作日志
- 冲突详情日志
- 访问审计日志

### 8.3 告警

- 同步失败持续 N 次
- 冲突数量超过阈值
- 磁盘空间不足
