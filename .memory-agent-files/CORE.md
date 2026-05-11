# CORE — 核心记忆（疯狂的简洁版）

> 版本: v9 | 2026-05-11 | 引擎数: 14 | 测试: 145 all pass

## 公司
- 东阳晓智科技
- 工业机械臂工厂
- 战略: 人形机器人 + 智能制造

## 设计风格
- Cybertruck Industrial
- #00d4ff（蓝） + #9b59ff（紫）

## 关键配置
| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MEMORY_LOCAL_PATH` | 记忆存储路径 | `~/.openclaw/memory` |
| `MEMORY_AGENT_NAME` | 智能体标识 | `openclaw` |
| `MEMORY_AGENT_TYPES` | 智能体类型列表 | `openclaw,hermes,claude-code,opencode` |
| `MEMORY_SHARED_REPOS` | 共享仓库 | `main-memory-shared,business-memory-shared,code-memory-shared` |
| `MEMORY_SYNC_CONFIG` | 同步配置文件 | `~/.config/memory-sync.env` |
| `MEMORY_AGENT_COUNT` | 每类型私有仓数量 | `5` |

## 插件架构

```
multi-claw-subagents-memory-plugins/
├── plugins/
│   ├── shared-memory-core/       # 21 TS 源文件 · 14引擎 · 3代理
│   │   ├── src/residual-engine.ts    # 残差趋零三层清理
│   │   ├── src/router-engine.ts      # 自适应三策略路由
│   │   ├── src/confidence-engine.ts  # 置信度+三态冲突
│   │   ├── src/persona-engine.ts     # 4专家协作
│   │   ├── src/vector-engine.ts      # FNV-1a向量检索
│   │   ├── src/fusion-engine.ts      # Jaccard融合去重
│   │   ├── src/graph-engine.ts       # BFS/DFS图遍历
│   │   ├── src/forgetting-engine.ts  # 艾宾浩斯遗忘曲线
│   │   ├── src/metacognition-engine.ts # 4维质量评分
│   │   ├── src/sleep-engine.ts       # 空闲后台整理
│   │   ├── src/git-sync.ts           # Git同步+结构化commit
│   │   ├── src/indexer.ts            # 全文搜索+LRU缓存
│   │   ├── src/event-bus.ts          # 发布/订阅
│   │   ├── src/access-control.ts     # 4级权限
│   │   └── src/{system2,system1,full-memory-*,agent-comm} # 三代理
│   └── openclaw-memory-plugin/   # 12 tools · 注册为OpenClaw插件
└── mcp-server/server.mjs         # 14引擎全部MCP桥接
```

## 双系统 v6（融合版）
```
USER → RouterEngine → System2 → ResidualEngine → System1 → ConfidenceEngine → 回答
```
- 自适应路由: direct/parallel/iterative + 空查询保护
- System2/1融合: 海绵吸收+淘金提炼+置信度 一步完成
- 残差趋零: Layer1/2/3合并执行，委托ResidualEngine单例
- MCP桥接: 14引擎全部暴露为OpenCode工具

## Persona激活（内置）
| 专家 | 关键词 |
|------|--------|
| 通用 | 基础配置查询 |
| 水体 | 水/治理/横店/水质 |
| 机器人 | 机器/人形/臂/AI |
| 项目 | 预算/进度/计划 |

## 定时任务
- robot-knowledge-research（每小时）
- robot-daily-report（20:00）
- memory-sync-gitea（10:00/22:00 — GitSyncManager.startScheduledSync）

## 测试状态
- **145 tests** · 12 files · 0 failures
- Unit: 引擎核心 + 三代理 + 基础设施
- Integration: 三代理流水线
- E2E: Git结构化commit
- Benchmark: 性能基准

## 目录结构
```
~/.openclaw/memory/
├── main-memory-shared/       # 公共主仓（全局规则+共享知识）
├── business-memory-shared/   # 业务子仓（项目+行业知识）
├── code-memory-shared/       # 代码子仓（代码片段+脚本）
└── {agent}-{n}-memory-private/  # 各智能体私有仓
```
