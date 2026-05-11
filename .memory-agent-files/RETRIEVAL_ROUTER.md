# RouterEngine — 自适应三策略路由引擎

> 引擎实现: `shared-memory-core/src/router-engine.ts` · 279 行 · 事件驱动
> 设计依据: MEMORY_SYSTEM.md §3.2 自适应路由策略

## 路由策略

```
classifyQuery(query)
    ├── direct     精准单点查询       → L1_CORE      < 100ms
    ├── parallel   多跳/关系问题      → L1 + 多L2    < 500ms
    └── iterative  模糊/探索性        → 全量 L1-L4   < 2s
```

## 查询分类规则

### direct 策略 — 精准单点

匹配模式：
- 精确 ID 查询：`id:xxx`, `find 123`, `查询 id`
- 定义查询：`什么是`, `what is`, `define`
- 教程查询：`怎么`, `how to`, `如何`
- 极短查询（< 5 chars）
- 单一实体：仅匹配到 1 个候选实体

响应机制：直连单个代理，最快响应

### parallel 策略 — 宽泛多维度

匹配模式：
- 全量词：`所有`, `全部`, `all`, `every`
- 汇总含义：`盘点`, `汇总`, `总结`, `overview`, `summary`
- 对比：`比较`, `对比`, `compare`, `vs`
- 分析：`分析`, `评估`, `analyze`, `evaluate`
- 关系：`哪些`, `关系`, `关联`, `related`
- 多关键词（≥4 个词）

响应机制：并行分发到多个代理（最多 3 个），提高覆盖率

### iterative 策略 — 多步推理

匹配模式：
- 序列：`然后`, `接着`, `下一步`, `then`, `next`
- 逐步：`逐步`, `step by step`, `sequence`, `pipeline`
- 依赖：`依赖`, `depends on`, `requires`
- 推理：`推理`, `推导`, `infer`, `deduce`
- 条件：`如果...那么`, `if...then`
- 因果：`为什么`, `why`, `原因`, `cause`

响应机制：迭代轮询，逐步缩小范围

## 决策流程

```
query + context
    │
    ├─ preferSpeed?     ──→ direct
    ├─ preferAccuracy?  ──→ parallel
    │
    ├─ isDirectQuery()   ──→ direct
    ├─ isParallelQuery() ──→ parallel
    ├─ isIterativeQuery()──→ iterative
    └─ default           ──→ direct
    │
    ▼
RouteDecision {
    strategy,
    targetAgents[],
    reason,
    timestamp,
    metadata: { decisionMs }
}
```

## 与 IndexEngine 集成

```typescript
executeQuery(decision, indexEngine, params)
```

- direct: limit=10, 单仓库
- parallel: limit=20, 跨仓库
- iterative: limit=10, 逐步深入

## 统计指标

| 指标 | 说明 |
|------|------|
| totalQueries | 总查询数 |
| direct/parallel/iterative count | 各策略命中数 |
| avgDecisionTimeMs | 平均决策时间 |
| recentDecisions | 最近 100 条决策历史 |

## 事件 API

| 事件 | 触发时机 |
|------|---------|
| `routeDecision` | 每次路由决策后 |
| `executionStart` | executeQuery 开始 |
| `executionComplete` | executeQuery 结束 |

## 工程质量

- 正则模式匹配：三层隔离测试覆盖
- 边界条件处理：空查询 → direct；未知查询 → default direct
- 偏好优先：context.preferSpeed/preferAccuracy 覆盖所有分类逻辑
- 统计持久化：保留最多 100 条历史决策

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-05-07 | 初始三策略设计 |
| v2 | 2026-05-11 | RouterEngine 完整实现，IndexEngine 集成 |

---

*引擎版本: v2 | 实现: router-engine.ts · 279 lines*
