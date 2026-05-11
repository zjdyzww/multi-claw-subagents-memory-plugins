# ResidualEngine — 残差趋零三层清理引擎

> 引擎实现: `shared-memory-core/src/residual-engine.ts` · 354 行 · 事件驱动

## 核心公式

```
R = Σ(residual_size × age_weight)
```

- `R`: 残差总值，反映残差队列的整体"污染程度"
- `residual_size`: 事实点内容长度 (chars)
- `age_weight`: 时效权重，随驻留时间增长

## 架构设计

```
enqueue(fact) → Queue[ResidualEntry] → periodicCheck()
                                          ├── Layer 1 (24h)  主动消解 ≥70%
                                          ├── Layer 2 (7d)   被动降级 ≥90%
                                          └── Layer 3 (30d)  强制清理 100%
```

### ResidualEntry 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `fact` | FactPoint | 关联的事实点（含 id/content/confidence/source） |
| `createdAt` | ISO string | 入队时间 |
| `lastCheckAt` | ISO string | 最后检查时间 |
| `resolutionAttempts` | number | 消解尝试次数 |
| `currentLayer` | 1 \| 2 \| 3 | 当前所在层 |

## 三层清理策略

### Layer 1（24h）主动消解
- 每周期检查层 1 条目
- 超过 24h 未消解 → `resolutionAttempts++`
- 尝试 ≥3 次仍未消解 → **降级到 Layer 2**
- 目标：消解率 ≥70%（否则 emit `layer1Warning`）

### Layer 2（7d）被动降级
- 超过 7d 的条目直接降级到 Layer 3
- 无论当前在哪一层，只要 age ≥ 7d → Layer 3

### Layer 3（30d）强制清理
- 超过 30d → 立即强制清除（`resolve(factId, 'forced')`）
- 清理率：100%

## 年龄权重计算

| Layer | 公式 | 范围 |
|-------|------|------|
| 1 | `1.0 + (age/24h) × 0.5` | [1.0, 3.0] |
| 2 | `0.5 + (age/7d) × 0.3` | [0.5, 1.5] |
| 3 | `1.0 - (age/30d)` | [0.1, 1.0] |

## 事件 API

| 事件 | 触发时机 | 参数 |
|------|---------|------|
| `engineStarted` | start() 调用 | `{ queueSize }` |
| `engineStopped` | stop() 调用 | `{ queueSize }` |
| `residualEnqueued` | enqueue() | `{ factId, queueSize }` |
| `residualResolved` | resolve() | `CleanupRecord` |
| `residualDemoted` | 降级发生时 | `{ factId, fromLayer, toLayer, attempts }` |
| `cleanupCycleComplete` | 周期清理结束 | `{ before, after, removed, timestamp }` |
| `layer1Warning` | 消解率 < 70% | `{ currentRate, target }` |

## 质量标准

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 残差消解率 ≥ 70%（72h 内）
- Layer 1 消解率 ≥ 70%
- Layer 3 强制清理 100%

## 持久化

```typescript
serialize(): string  // 队列 → JSON
deserialize(json: string): void  // JSON → 队列
```

## 依赖关系

```
FullMemoryAgentClient ──delegate──→ ResidualEngine (中央单例)
    manageResidualQueue()             getQueue()
    getResidualQueue()                enqueue(fact)
    resolveResidual(factId)           resolve(factId, 'active'|'forced')
    clearResidualQueue()              遍历 resolveAll('forced')
```

ResidualEngine 是**中央单例**，所有 FullMemoryAgentClient 实例统一委托到此引擎。解决了残差队列双份追踪问题。

## SleepEngine 集成

SleepEngine 在空闲时自动触发残差清理：

| 字段 | 值 |
|------|-----|
| 调度 | hourly (每 1h) |
| 动作 | `residualEngine.start()` → 等待 → `residualEngine.stop()` |
| 报告 | `{ before: {size, score}, after: {size, score}, removed }` |

## 工程质量

- 单元测试覆盖: 入队/消解/三层清理/序列化/边界条件
- 集成事件: 通过 EventEmitter 与 SleepEngine 联动
- 委托统一: FullMemoryAgentClient → ResidualEngine 单例，杜绝双份队列
- 空状态: 空队列时 `calculateResidualScore()` 返回 0，`periodicCheck()` 无操作
- 序列化: `serialize()` / `deserialize()` 支持状态持久化

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-05-07 | 初始三层清理规则 |
| v2 | 2026-05-11 | ResidualEngine 完整实现，事件驱动架构 |
| v3 | 2026-05-11 | FullMemoryAgentClient 统一委托，消除双份队列 |

---

*引擎版本: v3 | 实现: residual-engine.ts · 354 lines | 委托客户端: full-memory-agent-client.ts*

