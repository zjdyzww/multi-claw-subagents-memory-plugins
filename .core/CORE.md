# Core Architecture Design

> 多智能体核心架构设计 v2.0

## 1. 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Claw Memory System Architecture             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  OpenClaw  │  │   Hermes   │  │ Claude-Code │             │
│  │  Gateway   │  │   Gateway   │  │   Gateway   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│  ┌──────▼────────────────▼────────────────▼──────┐              │
│  │              Plugin SDK Layer                      │              │
│  │   (shared-memory-core)                          │              │
│  │                                                   │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │              │
│  │  │Git Sync │ │ Indexer │ │Access   │        │              │
│  │  │Manager  │ │         │ │Control  │        │              │
│  │  └─────────┘ └─────────┘ └─────────┘        │              │
│  │  ┌─────────┐ ┌─────────┐                    │              │
│  │  │ Event   │ │Conflict │                    │              │
│  │  │ Bus     │ │Resolver │                    │              │
│  │  └─────────┘ └─────────┘                    │              │
│  └──────────────────────────────────────────────────┘              │
│                            │                                       │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │                  Repository Layer                               │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │ Private  │ │   Main  │ │ Business │ │   Code   │      │  │
│  │  │ Memory   │ │ Memory  │ │  Memory  │ │  Memory  │      │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                        Git Server (Gitea)                         │
│                     https://git.osc.life                          │
└──────────────────────────────────────────────────────────────────┘
```

## 2. 核心组件

### 2.1 Git Sync Manager

```typescript
class GitSyncManager {
  // 仓库注册
  registerRepo(config: RepoConfig): void;
  
  // 仓库初始化
  initRepo(config: RepoConfig): Promise<void>;
  
  // 同步操作
  syncRepo(repoType: string): Promise<SyncResult>;
  
  // 提交记忆
  commitMemory(repoType: string, message: string, files: string[]): Promise<void>;
  
  // 冲突解决
  resolveConflicts(repoType: string, conflicts: Conflict[]): Promise<void>;
}
```

### 2.2 Index Engine

```typescript
class IndexEngine {
  // 索引文档
  indexDocument(repoType: RepoType, filePath: string): Promise<void>;
  
  // 搜索记忆
  searchMemory(query: SearchQuery): Promise<SearchResult[]>;
  
  // 获取相关记忆
  getRelatedMemories(topic: string, limit?: number): Promise<MemoryDocument[]>;
  
  // 索引统计
  getIndexStats(): Record<RepoType, number>;
}
```

### 2.3 Access Control

```typescript
class AccessControl {
  // 注册智能体
  registerAgent(agent: AgentInfo): void;
  
  // 检查权限
  checkAccess(agentId: string, repoType: RepoType, level: AccessLevel): AccessDecision;
  
  // 获取优先级
  getAgentPriority(agentId: string): number;
}
```

### 2.4 Event Bus

```typescript
class EventBus {
  // 发布事件
  publish(event: MemoryEvent): void;
  
  // 订阅事件
  subscribe(agentId: string, types: EventType[], callback: Handler): string;
  
  // 取消订阅
  unsubscribe(subscriptionId: string): void;
}
```

## 3. 数据流

### 3.1 记忆保存流程

```
User Input → Access Check → File Write → Index Update → Event Publish
     │            │             │            │              │
     ▼            ▼             ▼            ▼              ▼
  Content    Permission    File System   Search Index   Other Agents
  Validation   Verify       Operations    Update        Notification
```

### 3.2 记忆检索流程

```
Query Input → Access Check → Index Search → Result Ranking → Response
     │            │             │             │              │
     ▼            ▼             ▼             ▼              ▼
   Keywords    Permission   Full-text     Score        Formatted
   Parsing      Verify      Search      Calculation     Output
```

### 3.3 同步流程

```
Timer/Manual → Fetch Remote → Detect Conflicts → Pull Changes → Push Local
     │             │              │               │              │
     ▼             ▼              ▼               ▼              ▼
   Trigger    Remote State    Conflict      Merge/Rebase    Git Push
              Comparison       Report        Process        Result
```

## 4. 网关职责

| 网关 | 核心职责 | 路由策略 | 记忆同步 |
|------|----------|----------|----------|
| OpenClaw | 智能体路由 | 确定性绑定 | 实时广播 |
| Hermes | 记忆管理 | 内容路由 | 定时同步 |
| Claude-Code | 代码生成 | 任务路由 | 会话隔离 |
| OpenCode | 开源检索 | 许可证过滤 | 向量索引 |

## 5. 安全架构

### 5.1 认证机制

- **Token-based**: 24 小时有效期
- **SSH Keys**: Git 操作认证
- **API Keys**: 服务间通信

### 5.2 授权模型

```
┌─────────────────────────────────────────┐
│           Access Control Matrix           │
├─────────────────────────────────────────┤
│                                          │
│   Subject    │ Object    │ Permission   │
│   ──────────────────────────────────   │
│   OpenClaw  │ Private   │ RW (own)     │
│   OpenClaw  │ Main      │ RW (L1-L2)   │
│   Hermes    │ Main      │ RW (all)     │
│   Hermes    │ Business  │ RW           │
│   Claude-Code│ Code     │ RW           │
│   OpenCode  │ Code      │ RW           │
│                                          │
└─────────────────────────────────────────┘
```

### 5.3 审计日志

所有记忆操作均记录到审计日志：

```json
{
  "timestamp": "ISO-8601",
  "agent_id": "string",
  "operation": "read|write|delete|sync",
  "object": "repo/path",
  "result": "success|failure",
  "metadata": {}
}
```

## 6. 扩展性设计

### 6.1 新增智能体

1. 在 `agents/` 下创建目录
2. 编写 `L1_CORE.md`
3. 在 `accessControl` 中注册
4. 配置网关路由规则

### 6.2 新增仓库类型

1. 在 `RepoType` 中添加枚举
2. 实现路径解析
3. 配置访问规则

### 6.3 新增同步策略

实现 `SyncStrategy` 接口并注册。

## 7. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v2.0 | 2026-05-08 | L1-L4 四层架构 |
| v1.0 | 2026-05-07 | 初始版本 |
