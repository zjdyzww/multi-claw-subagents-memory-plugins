# PersonaEngine — Persona 协调引擎

> 引擎实现: `shared-memory-core/src/persona-engine.ts` · 405 行 · 事件驱动
> 设计依据: MEMORY_SYSTEM.md · 多专家协作推理流水线

## 4 专家 Persona

| ID | 名称 | 角色 | 核心关注点 |
|----|------|------|-----------|
| `architect` | Architect | 架构师 | 系统结构、存储布局、层次设计 |
| `reviewer` | Reviewer | 审查者 | 信息准确性、一致性、时效性 |
| `critic` | Critic | 批判者 | 挑战假设、寻找矛盾、测试边界 |
| `integrator` | Integrator | 整合者 | 综合多方意见、消除差异、最终决策 |

## 激活机制

### 关键词触发

每个 Persona 有专属激活关键词列表：

| Persona | 示例关键词 | 阈值 |
|---------|-----------|------|
| Architect | 架构/结构/分层/L1/L2/L3/L4/金字塔 | ≥15 |
| Reviewer | 准确/验证/核实/审计/版本/更新 | ≥15 |
| Critic | 矛盾/假设/风险/错误/但是/然而 | ≥15 |
| Integrator | 综合/整合/汇总/协调/共识/整体 | ≥10 |

匹配规则：每个匹配关键词 +5 分，达到阈值即激活

### 后备机制

若关键词未激活任何 Persona，则使用全部 4 个（低分模式），确保始终有评估结果。

## 协作推理流水线

```
input (MemoryRepresentation)
    │
    1. 关键词激活 (activateByKeywords)
    │
    2. 各专家并行评估 (getExpertOpinion)
    │   ├── architectEvaluate    → 架构合理性
    │   ├── reviewerEvaluate    → 信息质量
    │   ├── criticEvaluate      → 矛盾检测
    │   └── integratorEvaluate  → 综合评估
    │
    3. 投票聚合 (majority vote)
    │
    4. Integrator 最终决策 (consensusConfidence)
    │
    ▼
CollaborationResult
```

### 各专家评估逻辑

**Architect**
- >10 facts → 建议 L1-L4 分层
- 含"架构/结构/模式" → 关注层次一致性
- 0 facts → 建议补充结构化数据

**Reviewer**
- 检测 UNCERTAIN facts 数量
- 检测 7d 以上未更新信息

**Critic**
- 检测 contradictions 字段
- 检测模糊措辞（可能/大概/也许）
- 检查验证率

**Integrator**
- 检测置信度级别分散度
- >20 facts 建议聚合

## 协作结果

```typescript
CollaborationResult {
    consensusConfidence: ConfidenceLevel  // 最终共识
    votes: Record<ConfidenceLevel, number>  // 投票分布
    opinions: ExpertOpinion[]  // 各专家意见
    summary: string  // 可读摘要
}
```

### 共识决策规则

| 投票分布 | 结果 |
|---------|------|
| ≥3 票一致 | 该等级 |
| 2:1:1 多数 | 多数等级 |
| 平票/不确定 | LIKELY |

## 统计 & 管理

| 方法 | 说明 |
|------|------|
| `getPersonas()` | 获取所有 Persona 定义 |
| `registerPersona(definition)` | 注册自定义 Persona |
| `getHistory(limit)` | 获取协作历史 |
| `resetActivation()` | 重置所有激活度 |

## 事件 API

| 事件 | 触发时机 |
|------|---------|
| `personaRegistered` | 新 Persona 注册 |
| `personasActivated` | 关键词激活完成 |
| `expertEvaluated` | 单个专家评估完成 |
| `collaborationComplete` | 协作推理结束 |

## 工程质量

- 空输入处理：0 facts 时各专家给出默认评估
- 低分模式：关键词无命中时自动启用全部 Persona
- 历史管理：保留最近 50 条协作记录
- 可扩展：`registerPersona()` 支持自定义 Persona

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-05-07 | 初始 4 专家 Persona 设计 |
| v2 | 2026-05-11 | PersonaEngine 完整实现，协作投票流水线 |

---

*引擎版本: v2 | 实现: persona-engine.ts · 405 lines*
