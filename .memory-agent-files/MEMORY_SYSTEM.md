# Memory System Design — 三代理协作记忆系统设计 v6

> 架构原理 · 设计决策 · 理论基础 · 引擎全景
> 核心升级：v6 新增 10 个独立引擎 + 三代理通信协议 + MCP 桥接
> 引擎矩阵：14 引擎 | 3 代理 | 21 TypeScript 源文件 | 140+ 测试

---

## 1. 设计目标

构建一个**自净化 + 自适应检索的双系统协同记忆框架**，解决四个核心问题：

1. **信息完整性 vs 记忆效率的矛盾**: 海绵全量吸收 vs 淘金精准提炼
2. **检索效率**: 全量加载 vs 按需加载
3. **残差累积**: 不确定性残差持续累积导致记忆质量下降
4. **置信度缺失**: 事实来源和可信度不可追溯

**解决方案**: 自适应路由检索 → System 2 海绵全量吸收 → Layer 1 主动消解 → System 1 淘金提炼 → 置信度传播 → 残差趋零清理 → 元认知评估 → Gitea 一致性同步

---

## 2. 理论基础

### 2.1 卡尼曼双系统理论

| 维度 | System 1 | System 2 |
|------|---------|---------|
| 速度 | 快（毫秒级） | 慢（秒级） |
| 方式 | 直觉、模式识别 | 逻辑、分析、推理 |
| 比喻 | 淘金（筛选精华） | 海绵（全量吸收） |
| 适用 | 日常判断、熟练任务 | 复杂决策、不确定情境 |

### 2.2 金字塔原理

```
L1 核心结论     → 8条固定，必须记住
L2 业务主线     → 按业务域分组
L3 环境配置     → 按环境要素分组
L4 文件索引     → 引用外部文件
```

### 2.3 学术研究对照

| 研究 | 核心贡献 | 当前框架对照 |
|------|---------|-------------|
| MemORAI | Query-Adaptive PageRank 检索 | 自适应路由策略 (RouterEngine) |
| MemMachine | Ground-truth 情节保留 | Git 全量快照 + 增量 diff (GitSyncManager) |
| SPARK | 多智能体 Persona 协调 | 4 专家协作评估 (PersonaEngine) |
| 艾宾浩斯遗忘曲线 | 记忆衰减 R = e^(-t/S) | 遗忘曲线扫描 (ForgettingEngine) |
| 残差趋零（首创） | 三层清理机制 | ResidualEngine L1/L2/L3 主动净化 |

---

## 3. 引擎全景（14引擎 + 3代理）

### 3.1 核心引擎表

| 引擎 | 文件名 | 行数 | 核心功能 |
|------|--------|------|---------|
| **ResidualEngine** | `residual-engine.ts` | 354 | 残差趋零三层清理 R = Σ(size × weight) |
| **RouterEngine** | `router-engine.ts` | 280 | 自适应三策略路由 direct/parallel/iterative |
| **ConfidenceEngine** | `confidence-engine.ts` | 290 | 三级置信度 + 三态冲突处理 CASE 1/2/3 |
| **PersonaEngine** | `persona-engine.ts` | 405 | 4 专家协作评估 + 投票流水线 |
| **VectorEngine** | `vector-engine.ts` | 235 | 128-dim FNV-1a hash + trigram 向量检索 |
| **FusionEngine** | `fusion-engine.ts` | 278 | Jaccard 相似度融合去重 |
| **GraphEngine** | `graph-engine.ts` | 307 | BFS/DFS 记忆图遍历 |
| **ForgettingEngine** | `forgetting-engine.ts` | 218 | 艾宾浩斯遗忘曲线 R = e^(-t/S) |
| **MetacognitionEngine** | `metacognition-engine.ts` | 219 | 4 维记忆质量评分 |
| **SleepEngine** | `sleep-engine.ts` | 275 | 空闲后台 5 任务自动整理 |
| **GitSyncManager** | `git-sync.ts` | 450 | 结构化 commit + 定时同步 |
| **IndexEngine** | `indexer.ts` | 330 | 全文搜索 + LRU 文档缓存 |
| **EventBus** | `event-bus.ts` | 254 | 发布/订阅事件总线 |
| **AccessControl** | `access-control.ts` | 278 | 4 级权限管理 |

### 3.2 三代理架构

| 代理 | 角色 | 行数 | 职责 |
|------|------|------|------|
| **System2Agent** | 海绵式全量捕获 | 131 | 零遗漏原则，每段落独立事实 |
| **System1Agent** | 淘金式精炼 | 202 | 7 条标准筛选，淘金率 5-15% |
| **FullMemoryAgentClient** | 本地持久化 | 190 | MEMORY.md 追加写入，残差委托集中管理 |
| **FullMemoryAgentServer** | 远程同步+广播 | 196 | Gitea 推送，跨网关广播 |

### 3.3 通信拓扑

```
System2 ──handoff──→ System1 ──handoff──→ FullClient ──sync──→ FullServer
                      ↑<──query────                             <──broadcast──
```

通信管道: AgentCommunicationManager (303 行) — 心跳保活 / 重试投递 / 队列保护

### 3.4 完整数据流

```
USER QUERY
    ↓
RouterEngine (direct/parallel/iterative)
    ↓
System2Agent (海绵式全量捕获)
    ↓
ResidualEngine.enqueue() (UNCERTAIN 事实入残差队列)
    ↓
System1Agent (淘金式筛选 + 置信度标注)
    ↓
ConfidenceEngine (三态冲突 CASE 1/2/3)
    ↓
FullMemoryAgentClient (本地 MEMORY.md 追加)
    ↓
FullMemoryAgentServer (Gitea sync + 广播)
    ↓
MetacognitionEngine (4 维质量评分)
    ↓
SleepEngine (空闲时: 残差清理/遗忘扫描/索引优化/置信度审计)
```

---

## 4. 质量保障

- **测试**: 145 测试 · 12 文件 · 0 失败（unit/integration/e2e/benchmark）
- **构建**: TypeScript strict · ES2022 · 双插件编译零错误
- **类型安全**: 所有引擎 export class + singleton + factory function
- **双插件结构**: `shared-memory-core`(21 源文件) → `openclaw-memory-plugin`(12 tools)
- **MCP 桥接**: 14 引擎全部暴露为 MCP stdio 工具

---

## 5. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-05-07 | 初始版本 |
| v2 | 2026-05-07 | 海绵式+淘金式+三地一致性 |
| v3 | 2026-05-07 | 残差趋零清理+分段检索 |
| v4 | 2026-05-07 | 自适应路由策略+置信度传播机制 |
| v5 | 2026-05-11 | 10 引擎完整实现 + 设计文档补齐 |
| v6 | 2026-05-11 | 全优化: 145 测试/链截断/路径可配/残差统一/双份构建 |

---

*设计文档版本: v6 | 2026-05-11*

