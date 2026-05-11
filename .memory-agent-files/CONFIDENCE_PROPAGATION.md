# ConfidenceEngine — 置信度传播引擎

> 引擎实现: `shared-memory-core/src/confidence-engine.ts` · 290 行 · 事件驱动
> 设计依据: MEMORY_SYSTEM.md §3.3 置信度等级

## 三级置信度标注

| 等级 | 标识 | 定义 | 写入位置 |
|------|------|------|---------|
| `CONFIRMED` | 🟢 | 用户明确表达/多次验证一致 | L1/L2 |
| `LIKELY` | 🟡 | 单次获取/推断得出 | L2/L3 |
| `UNCERTAIN` | 🔴 | 模糊表达/单一信号 | L3 或丢弃 |

## 置信度链存储

每次标注记录完整的置信度变更历史。同来源的标注直接追加，不同来源触发冲突检测。

```typescript
ConfidenceChainEntry {
    level: ConfidenceLevel
    source: string       // 标注者（引擎/代理/用户）
    factSource: string   // 事实来源（对话/文档/推理）
    updatedAt: string
    previousLevel?: ConfidenceLevel
    reason?: string
}
```

**链长度保护**: `maxChainLength = 50` — 超过时自动丢弃最旧条目，防止单文档链无限增长导致内存泄漏。

## 冲突处理协议（三态自动决策）

```
resolveConflict(newLevel, existingLevel)
    │
    ├─ CASE 1: newLevel > existingLevel  → replace
    │   新信息置信度更高，覆盖旧标注（链继续增长）
    │   例: existing=LIKELY(2), new=CONFIRMED(3) → replace
    │
    ├─ CASE 2: newLevel == existingLevel → keep_both
    │   等置信度冲突，双方保留 + 标记 conflictDetected=true
    │   例: existing=LIKELY(2), new=LIKELY(2) → keep_both
    │
    └─ CASE 3: newLevel < existingLevel  → ignore
       新信息置信度更低，忽略新标注（不增长链）
       例: existing=CONFIRMED(3), new=UNCERTAIN(1) → ignore
```

### 冲突记录

```typescript
ConflictRecord {
    id, docId
    newLevel / existingLevel
    newSource / existingSource
    resolutionStrategy: 'replace' | 'keep_both' | 'ignore'
    resolved: boolean
    createdAt, resolvedAt
}
```

- 未解决（`!resolved`）: CASE 2 自动标记，需要手动确认
- 已解决（`resolved`）: CASE 1/3 自动解决，也可手动 `resolveConflictManually`
- 最大冲突记录: 200 条，超出丢弃最早

## API 接口

| 方法 | 参数 | 说明 |
|------|------|------|
| `annotate(doc, level, source, factSource, reason?)` | 单文档 | 标注置信度，自动冲突检测 |
| `annotateBatch(docs, level, source, reason?)` | 批量 | 统一标注一组文档 |
| `getMetadata(docId)` | 查询 | 获取完整置信度元数据 |
| `getConfidence(docId)` | 查询 | 获取当前置信度 |
| `getConflicts()` | 查询 | 获取所有冲突记录 |
| `resolveConflictManually(id, strategy)` | 手动 | 手动解决冲突 |
| `remove(docId)` / `clear()` | 管理 | 清除标注 |

## 统计指标

| 指标 | 说明 |
|------|------|
| totalAnnotated | 已标注文档总数 |
| confirmedCount | 🟢 文档数 |
| likelyCount | 🟡 文档数 |
| uncertainCount | 🔴 文档数 |
| conflictCount | 冲突总数 |
| resolvedConflictCount | 已解决冲突 |

## 事件 API

| 事件 | 触发时机 |
|------|---------|
| `annotationUpdated` | 标注更新成功 |
| `annotationIgnored` | CASE 3 忽略（低置信度被忽略） |
| `conflictKeptBoth` | CASE 2 双方保留 |
| `conflictDetected` | 任何冲突发生 |
| `conflictResolved` | 手动解决冲突 |
| `annotationRemoved` | 清除标注 |
| `allCleared` | 清除所有 |

## 工程质量

- **冲突检测**: 来源不同才触发，同来源直接更新不冲突
- **链截断**: maxChainLength=50 防止无限增长
- **空状态**: clean slate → 所有统计为 0
- **边界**: 最大冲突记录 200 条，超出自动丢弃最早记录
- **不可变性**: 每次 annotate 追加链条目，不修改历史
- **等级排序**: CONFIRMED(3) > LIKELY(2) > UNCERTAIN(1)

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-05-07 | 初始三级置信度设计 |
| v2 | 2026-05-11 | ConfidenceEngine 完整实现，三态冲突处理 |
| v3 | 2026-05-11 | 链截断保护 maxChainLength=50，改善工程质量 |

---

*引擎版本: v3 | 实现: confidence-engine.ts · 290 lines*

