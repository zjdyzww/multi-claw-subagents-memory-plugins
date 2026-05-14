# Multi-Claw Subagents Memory Plugins

> **多智能体多网关多代理记忆增强插件系统**  
> **版本**: v13.1 (Local Enhancement) | **日期**: 2026-05-14 | **实现度**: 100%

---

## 核心创新

本项目整合了 **双系统协同记忆框架** 与 **多智能体多网关架构**，经历 8 个版本迭代 (v7.1→v13.1)，论文-代码一致性从 35% 提升至 **100%**。

- 🧠 **三代理协作**: System2(零遗漏全量捕获) → System1(5-15%淘金率精炼) → 全量代理(Client本地写入+Server远程同步)
- 🌐 **四网关路由**: OpenClaw + Hermes + Claude-Code + OpenCode 分工协作
- 📦 **三地一致性**: 表象 ↔ MEMORY.md ↔ Gitea 实时同步 (10:00/22:00定时+重大变更立即)
- ⚡ **零配置安装**: OpenClaw 提示词 / OpenCode MCP 一键安装
- 🏛️ **记忆宫殿**: 每个网关独立的规则和技能
- ⏰ **时间记忆 v2.0**: 14 命令 (HTML时间线/多版本对比/Webhook通知/多仓备份/演变分析)
- 🔄 **学会遗忘**: 残差趋零 R = Σ(size×weight) + L1/L2/L3 三层清理
- 🔍 **14 引擎**: 向量检索/遗忘曲线/图建模/记忆融合/睡眠计算/元认知 + 8核心引擎
- 🧪 **145 测试**: 12 文件 100% 通过，索引 <100ms，向量 <200ms，图 1000+ 节点

---

## 目录结构

```
multi-claw-subagents-memory-plugins/
│
├── .memory-palace/                  # ⭐ 4 个网关记忆宫殿
│   ├── openclaw/MEMORY_PALACE.md    # OpenClaw (CTO角色)
│   ├── hermes/MEMORY_PALACE.md      # Hermes (记忆同步)
│   ├── claude-code/MEMORY_PALACE.md # Claude Code (代码代理)
│   └── opencode/MEMORY_PALACE.md    # OpenCode (开源开发)
│
├── agents/                          # ⭐ 4 个网关技能
│   ├── openclaw/SKILL.md
│   ├── hermes/SKILL.md
│   ├── claude-code/SKILL.md
│   └── opencode/SKILL.md
│
├── .memory-agent-files/            # ⭐ 疯狂简洁: 7 核心文件
│   ├── CORE.md                     # L1 核心原则
│   ├── MEMORY.md                   # L2 业务域
│   ├── CONFIG.md                   # L3 配置
│   ├── INDEX.md                    # L4 索引
│   ├── RESIDUAL_QUEUE.md           # 残差队列
│   ├── MEMORY_SYSTEM.md            # 系统规范
│   └── MEMORY_INDEX.md             # 索引结构
│
├── plugins/                        # ⭐ TypeScript 插件 (5,800+ 行)
│   ├── shared-memory-core/         # 21 源文件, 14 引擎
│   │   └── src/                    # 含 3 代理 + 4 核心引擎 + 6 高级引擎
│   └── openclaw-memory-plugin/     # 12 工具 + 3 代理工具
│
├── mcp-server/                     # ⭐ OpenCode MCP 桥接
│   ├── server.mjs                  # 14 MCP 工具
│   └── package.json
│
├── tests/                          # ⭐ 145 测试, 12 文件, 100% 通过
│   ├── unit/                       # 引擎单元测试 (8 文件)
│   ├── integration/                # 三代理管道集成测试
│   ├── e2e/                        # Git 结构化提交测试
│   └── benchmark/                  # 性能基准 (<100ms/<200ms)
│
├── scripts/                        # ⭐ 管理脚本
│   ├── install.sh                  # v7.2 安装 (+credential helper)
│   ├── time-memory.sh              # v2.0 14 命令 (1133行)
│   ├── upgrade.sh                  # 升级脚本
│   └── sync-memory.sh              # 同步脚本
│
└── docs/                           # 文档
    ├── 论文_疯狂的简洁_记忆强化框架.md        # 学术论文 v3.1
    ├── 系统设计文档_含Mermaid图表.md          # 系统设计 v4.0
    ├── 论文代码一致性校验报告.md               # 一致性: 35%→100%
    ├── TIME_MEMORY.md               # 时间记忆
    ├── INSTALL.md                   # 安装指南
    └── UPGRADE.md                   # 升级指南
```

---

## 🚀 快速安装

### 方法一：OpenClaw 提示词 (零配置)

```
add multi-claw-subagents-memory-plugins where
  plugins-url=https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins
  gitserver-url=https://git.osc.life
  gitserver-token=<YOUR_GITEA_TOKEN>
  gitgroup-name=claws-memory
```

### 方法二：OpenCode MCP 一键安装

```bash
bash scripts/install.sh \
  --plugins-url https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token <TOKEN> \
  --gitgroup-name claws-memory \
  --install-opencode
```

自动完成：创建 Gitea 仓库 → 安装记忆宫殿 → 安装 MCP 服务器(14工具) → 注册 opencode.json

### 方法三：手动安装

```bash
git clone https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins.git
cd multi-claw-subagents-memory-plugins/plugins/shared-memory-core
npm install && npm run build
cd ../openclaw-memory-plugin
npm install && npm run build
```

---

## 🔌 MCP 工具清单 (14 个)

### 三代理工具
| 工具 | 引擎 | 功能 |
|------|------|------|
| `agent_system2_capture` | System2Agent | 海绵式全量捕获(零遗漏) |
| `agent_system1_refine` | System1Agent | 淘金式精炼(5-15%淘金率) |
| `agent_fullmemory_persist` | FullMemoryAgentClient | 本地持久化+残差调度 |

### 核心引擎工具
| 工具 | 引擎 | 功能 |
|------|------|------|
| `memory_search` | IndexEngine | 全文搜索 (<100ms) |
| `memory_vector_search` | VectorEngine | 128-dim余弦相似度 (<200ms) |
| `memory_residuals` | ResidualEngine | R=Σ(size×weight) + 三层清理 |
| `memory_route` | RouterEngine | direct/parallel/iterative 路由 |
| `memory_confidence` | ConfidenceEngine | 🟢🟡🔴 统计 |
| `memory_annotate` | ConfidenceEngine | 置信度标注 |

### 高级引擎工具
| 工具 | 引擎 | 功能 |
|------|------|------|
| `memory_collaborate` | PersonaEngine | 4专家投票共识 |
| `memory_forgetting` | ForgettingEngine | 艾宾浩斯遗忘曲线 |
| `memory_fuse` | FusionEngine | Jaccard相似度融合去重 |
| `memory_graph` | GraphEngine | 图结构查询(1000+节点) |
| `memory_assess` | MetacognitionEngine | 4维质量评估 |

---

## ⏰ 时间记忆 v2.0

| 命令 | 功能 | 输出 |
|------|------|------|
| `full` | 全量快照 | Git commit + tag |
| `inc` | 增量 Diff | 变更统计 |
| `snap` | 时间戳快照分支 | 分支创建 |
| `branch` | 分支管理 | 切换/合并 |
| `timegoto` | 时间回溯 | detached HEAD |
| `history` | 历史查看 | 提交列表 |
| `diff` | 版本对比 | 变更统计 |
| `log` | 时间线视图 | 分支+标签 |
| **`time-travel`** | 🆕 HTML 时间线 | 交互式网页 |
| **`time-compare`** | 🆕 多版本统计 | 报告+趋势 |
| **`time-alert`** | 🆕 Webhook 通知 | 钉钉/企微/Slack |
| **`time-backup`** | 🆕 多仓备份 | bundle+cron |
| **`time-insight`** | 🆕 演变分析 | Markdown 报告 |
| `gc` | 垃圾回收 | 仓库优化 |

---

## 📋 版本历史

| 版本 | 日期 | 发布版本 | 主要变更 |
|------|------|----------|----------|
| **v13.1** | 2026-05-14 | — | ⭐ auto-sync修复 (3 root causes) + 全量自检 |
| **v13.0** | 2026-05-09 | v3.0.0 Academy | ⭐ 6高级引擎 + 论文修订 + MCP桥接 |
| **v12.0** | 2026-05-09 | v2.0.0 Chronos | ⭐ 时间记忆5命令 (travel/compare/alert/backup/insight) |
| **v11.0** | 2026-05-09 | v1.1.0 Anvil | ⭐ Git结构化commit + 69测试 + 文档精简 |
| **v10.0** | 2026-05-09 | v1.0.0-beta.1 Foundry | ⭐ 残差/路由/置信度/Persona 四引擎 |
| **v9.0** | 2026-05-09 | v1.0.0-alpha.1 Sandbox | ⭐ 类型修复 + 三代理骨架 + Bug修复 |
| **v7.1** | 2026-05-09 | — | 论文完成 + CRLF修复 + VERSION_PLAN |
| **v7.0** | 2026-05-08 | — | 时间记忆(全量/增量/分支/回溯) |
| **v6.1** | 2026-05-08 | — | 安装脚本版本检测 |
| **v6.0** | 2026-05-08 | — | 简化安装 + 动态私有仓库 |
| **v5.0** | 2026-05-08 | — | 动态私有仓库数量 |
| **v4.0** | 2026-05-08 | — | 记忆宫殿 |
| **v3.0** | 2026-05-08 | — | 整合 memory-agent-plugins |
| **v2.0** | 2026-05-08 | — | L1-L4 四层记忆架构 |

---

## 🏗️ 引擎架构

### 三代理层 (v9)
```
System2Agent (127行) → System1Agent (215行) → FullMemoryAgentClient (197行)
    零遗漏                 淘金率5-15%             本地持久化+残差
                                ↓
                    FullMemoryAgentServer (196行)
                        远程同步+跨网关广播
                                ↓
                    AgentCommunicationManager (303行)
                        CMS通信协议 (connect/send/broadcast)
```

### 核心引擎层 (v10)
```
ResidualEngine (354行)    R=Σ(size×weight) + L1/L2/L3
RouterEngine (279行)      23规则 + direct/parallel/iterative
ConfidenceEngine (289行)  🟢🟡🔴标注 + CASE1/2/3冲突协议
PersonaEngine (405行)     4专家 + 80关键词 + 投票共识
```

### 高级引擎层 (v13)
```
VectorEngine     — 128-dim余弦相似度 (≤200ms)
ForgettingEngine — 艾宾浩斯 R=e^(-t/S) 5种类型
GraphEngine      — 邻接表 BFS/DFS (1000+节点)
FusionEngine     — Jaccard相似度 3级阈值
SleepEngine      — 5后台任务 空闲监控
MetacognitionEngine — 4维质量评分
```

---

## 双系统协同工作流

```
USER 对话
    │
    ▼
System2 (海绵吸收) → 全量表象 → 零遗漏交付
    │
    ▼
残差消解 Layer1 → 主动消解 (24h, ≥70%)
    │
    ▼
System1 (淘金提炼) → 7标准筛选 → 🟢🟡🔴 标注 → MEMORY.md
    │
    ▼
Gitea 同步 → 10:00 / 22:00 + 重大变更立即
```

---

## 📊 项目数据

| 维度 | 数值 |
|------|------|
| TS 源文件 | 21 (5,800+ 行) |
| 引擎数 | 14 |
| 插件工具 (OpenClaw) | 12 |
| MCP 工具 (OpenCode) | 14 |
| 测试 | 12文件 145用例 100%通过 |
| Bash 命令 (time-memory) | 14 |
| 核心文件 (.memory-agent-files) | 7 (疯狂简洁, -72%) |
| as any 缺陷 | 0 |
| CRLF 问题 | 0 |
| 编译错误 | 0 (双插件) |
| 论文-代码一致性 | 35% → **100%** |

---

## 文档

| 文档 | 说明 |
|------|------|
| [学术论文](./docs/论文_疯狂的简洁_记忆强化框架.md) | 论文 v3.1 (100%实现度) |
| [系统设计](./docs/系统设计文档_含Mermaid图表.md) | 架构图+文件清单+版本演进 (v4.0) |
| [一致性校验](./docs/论文代码一致性校验报告.md) | 35%→100% 完整对比 |
| [时间记忆](./docs/TIME_MEMORY.md) | v2.0 14命令详解 |
| [安装指南](./docs/INSTALL.md) | 安装说明 |
| [升级指南](./docs/UPGRADE.md) | 版本升级 |
| [插件配置](./docs/openclaw-plugin-config.md) | OpenClaw 配置 |

---

## License

MIT License

**项目地址**: https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins
