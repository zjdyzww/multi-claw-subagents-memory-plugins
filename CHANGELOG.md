# CHANGELOG

本项目的所有显著变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [3.0.0] — *Academy* — 2026-05-09

> 学术版。框架版本 v13.0。发布版本 v3.0.0。

### Added
- `vector-engine.ts`：向量语义检索引擎（余弦相似度，128-dim embedding，≤200ms 延迟，支持 repoType/tag 过滤）
- `forgetting-engine.ts`：艾宾浩斯遗忘曲线自适应衰减（5 种 memoryType 不同 S 值，间隔效应 boost）
- `graph-engine.ts`：记忆图结构建模（邻接表 BFS/DFS，1000+ 节点支持，关系边 7 种类型）
- `fusion-engine.ts`：多源记忆融合去重（Jaccard 相似度，3 级阈值决策：merge/keep/discard）
- `sleep-engine.ts`：空闲时段自动后台整理（5 个默认任务：index/forgetting/residual/confidence/consolidation）
- `metacognition-engine.ts`：记忆质量自评估（完整性/时效性/一致性/置信度 4 维度评分）
- openclaw-memory-plugin 新增 3 个工具：`memory_vector_search`、`memory_fuse`、`memory_assess`
- v13 测试套件：8 个测试文件，65+ tests
- 论文 v3 修订：补充实验数据 + 代码实现验证 + 基准数据图表 + 英文摘要

### Changed
- `VERSION`: 12.0 → 13.0 (release v3.0.0)
- `package.json`: 12.0.0 → 13.0.0（双包同步）
- `openclaw.plugin.json`: 9 → 12 tools
- 论文-代码一致性：78% → 92% (所有 6 项创新 + 6 项高级特性全部实现)

---

## [2.0.0] — *Chronos* — 2026-05-09

> 功能大版。框架版本 v12.0。发布版本 v2.0.0。

### Added
- `time-travel`：HTML 可视化时间线生成器（Git 历史 → 交互式网页）
- `time-compare`：多版本差异对比 + 统计报告（作者/文件/类型/趋势）
- `time-alert`：Webhook 变更通知（支持钉钉/企微/Slack 三种格式）
- `time-backup`：定时多仓自动备份（bundle + push + cron 模板 + 旧备份清理）
- `time-insight`：记忆演变分析报告（Markdown，含活跃度/趋势/作者/建议）

### Changed
- `time-memory.sh`: v1.0 → v2.0 (603 → 1021 lines)
- `VERSION`: 11.0 → 12.0 (release v2.0.0)
- `package.json`: 11.0.0 → 12.0.0（双包同步）

---

## [1.1.0] — *Anvil* — 2026-05-09

> 质量加固版。框架版本 v11.0。发布版本 v1.1.0。

### Added
- `git-sync.ts` 结构化 Commit 消息：`[confidence][source][memoryType] summary` 格式
- `buildStructuredMessage()` / `buildStructuredMessageWithContext()` / `getAgentAuthor()` 导出
- `CommitContext` 接口：支持 `traceabilityId`, `agentId`, `factCount` 等元数据
- 4 个测试目录：`tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/benchmark/`
- 7 个测试文件，共 49 个测试用例（全通过）
- `vitest` 测试框架集成（v4.1.5）

### Fixed
- `system1-agent.ts`: 评估优先级调整（显式模式优先于模糊模式）
- `router-engine.ts`: 速度/精度偏好提前于分类、短查询阈值 10→5
- `confidence-engine.ts`: CASE 2 冲突检测修复（同源过滤）
- `package.json`: JSON trailing comma 修复

### Changed
- `.memory-agent-files/` 精简：20 → 15 个文件（删除 7 个冗余/已合并文件）
- `VERSION`: 10.0 → 11.0 (release v1.1.0)
- `package.json`: 10.0.0 → 11.0.0（双包同步）
- 添加 `npm test` / `test:watch` / `test:coverage` 脚本

---

## [1.0.0-beta.1] — *Foundry* — 2026-05-09

> 功能预览版。框架版本 v10.0。发布版本 v1.0.0-beta.1。

### Added
- 新建 `residual-engine.ts`：残差趋零三层清理引擎
  - `R = Σ(residual_size × age_weight)` 实时计算
  - Layer 1（24h）：主动消解，目标消解率 ≥70%
  - Layer 2（7d）：被动消解，降级存储，目标消解率 ≥90%
  - Layer 3（30d）：强制清理，目标消解率 100%
  - 定时器驱动周期检查 + `enqueue`/`resolve` 操作
  - 序列化/反序列化持久化支持
- 新建 `router-engine.ts`：自适应路由引擎
  - `classify_query()` 查询分类（关键字匹配 + 启发式规则）
  - `direct` 策略：单代理直连（精确查询/短查询）
  - `parallel` 策略：多代理并行（宽泛查询/多关键词）
  - `iterative` 策略：轮询迭代（多步推理/条件逻辑）
  - `executeQuery()` 委托 IndexEngine 执行
  - 路由决策日志与统计
- 新建 `confidence-engine.ts`：置信度传播引擎
  - `annotate()` 🟢CONFIRMED/🟡LIKELY/🔴UNCERTAIN 三级标注
  - `ConfidenceChainEntry[]` 置信度链存储与更新
  - 冲突检测与处理协议（CASE 1/2/3 三态自动决策）
  - `traceabilityId` 溯源关联
  - 冲突记录、手动解决、统计
- 新建 `persona-engine.ts`：Persona 协调引擎
  - 4 专家 Persona（Architect/Reviewer/Critic/Integrator）
  - 80+ 中英文关键词双层激活
  - `collaborate()` 多专家协作推理流水线
  - 投票→共识置信度决策
- openclaw-memory-plugin 新增 4 个工具：
  - `memory_annotate`：置信度批量标注
  - `memory_route`：智能路由查询
  - `memory_collaborate`：4 专家协作评估
  - `memory_residuals`：残差队列状态查询

### Changed
- `VERSION`: 9.0 → 10.0 (release v1.0.0-beta.1)
- `package.json`: 9.0.0 → 10.0.0（双包同步）
- `openclaw.plugin.json`: 5 tools → 9 tools
- `shared-memory-core/plugin.json`: libraries 10 → 14 个模块

---

## [1.0.0-alpha.1] — *Sandbox* — 2026-05-09

> 技术预览版。框架版本 v9.0。发布版本 v1.0.0-alpha.1。

### Added
- MemoryDocument 新增 11 个字段（`confidence`, `confidenceUpdated`, `confidenceChain`, `factSource`, `traceabilityId`, `residualQueue`, `residualSize`, `ageWeight`, `memoryType`, `accessCount`, `lastAccessTime`）
- 新增 7 个类型接口：`AgentInterface`, `MemoryRepresentation`, `FactPoint`, `ConfidenceMetadata`, `AgentMessage`, `QueryMessage`, `RouteDecision`
- 新增 7 个辅助类型：`ConfidenceLevel`, `MemoryType`, `AgentRole`, `AgentStatus`, `ResidualInfo`, `CleanupRecord`, `ConfidenceChainEntry`
- 新建 `system2-agent.ts`：System2 记忆代理（海绵式全量捕获）
- 新建 `system1-agent.ts`：System1 记忆代理（7 标准淘金式精炼）
- 新建 `full-memory-agent-client.ts`：全量代理-Client（本地文件写入 + 残差队列调度）
- 新建 `full-memory-agent-server.ts`：全量代理-Server（远程同步 + 跨网关广播消息中枢）
- 新建 `agent-communication.ts`：三代理通信协议 CMS（消息定义 + 心跳 + 重试 + 广播）
- 新建 `.gitattributes`：强制 LF 行尾，防止 Windows CRLF 污染
- 新建 `VERSION_PLAN.md`：版本开发计划
- 新建 `RELEASE_PLAN.md`：发布版本计划

### Fixed
- `indexer.ts`: 修复 `path.relative(filePath, filePath)` 始终返回空字符串的 Bug（改用 `path.basename`）
- `access-control.ts`: 修复私有仓 `allowedAgents: ['*']` 跨网关越权访问漏洞（改为 `deniedAgents: ['*']` + 所有权校验）
- `git-sync.ts`: 消除 4 处 `as any` 类型压制（pull/checkout/log 调用改为正确类型）
- `event-bus.ts`: 消除 6 处 `repoType as any`（改为 `as RepoType`）
- `index.ts`: 消除 2 处 `config.agentType as any`（改为 `as AgentInfo['agentType']`）

### Changed
- `VERSION`: 7.1 → 9.0 (release v1.0.0-alpha.1)
- `package.json`: 1.0.0 → 9.0.0（双包同步）
- `README.md`: 更新版本号至 v9.0，添加 v7.1/v9.0 版本历史
- `openclaw.plugin.json`: 新增 5 个 agent 模块的 libraries 和 exports 声明
- 所有 `.sh` 脚本：CRLF → LF 行尾转换
- 所有 `.ts` 源文件：CRLF → LF 行尾转换

---

## 版本映射

| 发布版本 | 框架版本 | 代号 |
|----------|----------|------|
| v1.0.0-alpha.1 | v9.0 | Sandbox |
| v1.0.0-beta.1 | v10.0 | Foundry |
| v1.0.0 | v10.0 | Atlas |
| v1.1.0 | v11.0 | Anvil |
| v2.0.0 | v12.0 | Chronos |
| v3.0.0 | v13.0 | Academy |

---

## [3.0.1] — *Local Enhancement* — 2026-05-10

> 本地增强版。基于 v3.0.0 的配置优化和新功能添加。

### Added
- `time-memory.sh`: 新增 `pyramid` 命令 — 金字塔原理结构化全量提交+索引
- `gitea-code-scanner.py`: Gitea 代码仓库扫描器，自动登记到 code-memory-shared 并按业务关联到 business-memory-shared

### Changed
- `time-memory.sh`: 完善 help 文本，添加 pyramid 命令到 case 路由
- Cron 任务表: 新增代码仓库扫描 (每小時) 和金字塔提交 (每天 12:00)
- `CONFIG.md`: 更新 gitea token、仓库列表和 cron 任务配置

### Fixed
- DeepSeek 模型配置: 移除不支持的 images 特性 (`toolCall,images,reasoning` → `toolCall,reasoning`)

### Performance
- 服务器端部署: 11 个仓库已注册 GitSyncManager
- EventBus: 事件监听已配置
- 代码仓库首次扫描: 223 个仓库发现, 209 个代码仓库已登记
