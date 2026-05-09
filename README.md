# Multi-Claw Subagents Memory Plugins

> **多智能体多网关多代理记忆增强插件系统**  
> **版本**: v13.0 | **日期**: 2026-05-09  


---

## 核心创新

本项目整合了 **双系统协同记忆框架** 与 **多智能体多网关架构**，实现：

- 🧠 **三代理协作**: System2记忆代理(全量捕获) → System1记忆代理(淘金提炼) → 全量记忆代理(持久化同步)，三代理各司其职
- 🌐 **多网关路由**: OpenClaw + Hermes + Claude-Code + OpenCode 分工协作
- 📦 **三地一致性**: （对话System2）表象 ↔ （本地System 1）MEMORY.md ↔ （all memory）Gitea 实时同步
- ⚡ **零配置安装**: 一次对话即可完成部署
- 🏛️ **记忆宫殿**: 每个网关独立的记忆宫殿规则和技能
- ⏰ **时间记忆**: 全量快照 + 增量 Diff + 分支管理 + 历史回溯
- 🔄 **学会遗忘**: 本地记忆宫殿（System 1容量限制）通过残差趋0队列和时间分段遗忘机制实现记忆的最优化;Git全量记忆（全量记忆 容量不限）中保留全量记忆结构化，保证所有记忆可快速检索。
              

---

## 目录结构

```
multi-claw-subagents-memory-plugins/
│
├── .memory-palace/                  # ⭐ 每个网关的记忆宫殿
│   ├── openclaw/MEMORY_PALACE.md  # OpenClaw 记忆宫殿
│   ├── hermes/MEMORY_PALACE.md   # Hermes 记忆宫殿
│   ├── claude-code/MEMORY_PALACE.md # Claude Code 记忆宫殿
│   └── opencode/MEMORY_PALACE.md  # OpenCode 记忆宫殿
│
├── agents/                          # ⭐ 每个网关的技能
│   ├── openclaw/SKILL.md          # OpenClaw 技能
│   ├── hermes/SKILL.md           # Hermes 技能
│   ├── claude-code/SKILL.md      # Claude Code 技能
│   └── opencode/SKILL.md         # OpenCode 技能
│
├── .memory-agent-files/            # ⭐ 记忆强化核心文件 (疯狂简洁: 7文件)
│   ├── CORE.md                  # L1 核心原则
│   ├── MEMORY.md                # L2 业务域记忆
│   ├── CONFIG.md                # L3 运行时配置
│   ├── INDEX.md                 # L4 快速检索索引
│   ├── RESIDUAL_QUEUE.md        # 残差趋零队列
│   ├── MEMORY_SYSTEM.md         # 系统设计规范
│   └── MEMORY_INDEX.md          # 记忆索引结构
│
├── plugins/                        # 插件源码
│   ├── shared-memory-core/       # 共享核心库
│   └── openclaw-memory-plugin/   # OpenClaw 插件
│
├── scripts/                        # 管理脚本
│   ├── install.sh               # ⭐ 一次安装脚本 v6.1
│   ├── upgrade.sh               # ⭐ 版本升级脚本 v1.0
│   ├── sync-memory.sh           # 同步脚本
│   ├── time-memory.sh           # ⭐ 时间记忆脚本 v1.0（全量/增量/分支/回溯）
│   ├── init-repos.sh            # 初始化子仓库
│   └── benchmark.sh             # 性能测试
│
└── docs/                          # 文档
    ├── INSTALL.md               # 安装指南
    ├── architecture.md          # 架构设计
    ├── user-guide.md           # 用户指南
    ├── UPGRADE.md               # 升级指南
    ├── openclaw-plugin-config.md # OpenClaw 插件配置
    └── TIME_MEMORY.md           # ⭐ 时间记忆功能（v7.0 新增）
```

---

## 🚀 快速安装

### 方法一：通过 OpenClaw 提示词安装（推荐，零配置）

在 OpenClaw 对话中发送：

```
add multi-claw-subagents-memory-plugins where
  plugins-url=https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins
  gitserver-url=https://git.osc.life
  gitserver-token=<YOUR_GITEA_TOKEN>
  gitgroup-name=claws-memory
```

OpenClaw 将自动执行以下步骤：
1. 创建 Gitea 记忆仓库（公共 + 私有）
2. 克隆插件仓库到 `~/.openclaw/memory-plugins` 和 `~/.openclaw/plugin-repos/`
3. 安装 npm 依赖并编译 TypeScript 插件
4. 配置 `openclaw.json` 中插件加载路径
5. 安装记忆宫殿到所有网关（OpenClaw / Hermes / Claude Code / OpenCode）

**参数说明：**
- `plugins-url`: 插件仓库地址
- `gitserver-url`: Git 服务器地址（Gitea）
- `gitserver-token`: Gitea 访问令牌
- `gitgroup-name`: Gitea 组织名（用于创建记忆仓库）

### 方法二：安装脚本

```bash
bash <(curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/scripts/install.sh) \
  --plugins-url https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token <YOUR_GITEA_TOKEN> \
  --gitgroup-name claws-memory
```

### 手动安装步骤

如需手动安装，按以下顺序执行：

```bash
# 1. 克隆仓库
git clone https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins.git ~/.openclaw/memory-plugins

# 2. 构建插件（先构建 shared-memory-core，再构建 openclaw-memory-plugin）
cd ~/.openclaw/memory-plugins/plugins/shared-memory-core
npm install && npm run build

cd ../openclaw-memory-plugin
npm install && npm run build

# 3. 在 openclaw.json 中添加插件配置（见下方"插件配置"章节）
```

### 插件配置

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "gitServer": {
            "url": "https://git.osc.life",
            "token": "<YOUR_GITEA_TOKEN>"
          },
          "sync": {
            "groupName": "claws-memory",
            "autoSync": false,
            "syncIntervalMs": 300000
          }
        }
      },
      "shared-memory-core": {
        "enabled": true,
        "config": {}
      }
    },
    "load": {
      "paths": [
        "/home/<USER>/.openclaw/plugin-repos/multi-claw-subagents-memory-plugins/plugins/openclaw-memory-plugin/dist",
        "/home/<USER>/.openclaw/plugin-repos/multi-claw-subagents-memory-plugins/plugins/shared-memory-core/dist"
      ]
    }
  }
}
```

### 动态增加私有仓库

安装后，可根据需要动态增加私有仓库数量：

```bash
# 增加 OpenClaw 私有仓库到 3 个
bash install.sh --add-agent openclaw:3 --gitgroup-name claws-memory

# 增加 OpenCode 私有仓库到 2 个
bash install.sh --add-agent opencode:2 --gitgroup-name claws-memory

# 查看当前配置
bash install.sh --status --gitgroup-name claws-memory
```

---

## 🔄 版本升级

### 自动升级（推荐）

```bash
bash <(curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/scripts/upgrade.sh)
```

### 升级选项

| 选项 | 说明 |
|------|------|
| `--check` | 仅检查版本，不升级 |
| `--dry-run` | 预览升级内容，不执行 |
| `--force` | 强制升级（跳过确认） |

### 示例

```bash
# 检查版本
bash upgrade.sh --check

# 预览升级
bash upgrade.sh --dry-run

# 强制升级
bash upgrade.sh --force
```

### 升级说明

- 升级前自动创建备份（位于 `~/.openclaw/memory-plugins.backup.XXXXXXXX/`）
- 自动更新记忆宫殿、Skills、memory-agent-files
- 升级后可随时回滚

---

## 📋 版本历史

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| **v13.0** | 2026-05-09 | ⭐ 高级特性：向量检索/遗忘曲线/图建模/融合引擎/睡眠计算/元认知 + 论文修订 |
| **v7.1** | 2026-05-09 | 论文完成 + CRLF修复 + 版本一致性 + VERSION_PLAN |
| **v7.0** | 2026-05-08 | ⭐ 时间记忆功能：全量快照+增量Diff+分支管理+历史回溯 |
| **v6.1** | 2026-05-08 | 安装脚本版本检测、升级提示 |
| **v6.0** | 2026-05-08 | 简化安装提示词、动态增加私有仓库 |
| **v5.0** | 2026-05-08 | 支持动态私有仓库数量 |
| **v4.0** | 2026-05-08 | 记忆宫殿 (Memory Palace) 功能 |
| **v3.0** | 2026-05-08 | 整合 memory-agent-plugins |
| **v2.0** | 2026-05-08 | L1-L4 四层记忆架构 |

---

## 🔧 手动升级

如自动升级失败，可手动升级：

```bash
# 1. 备份
cp -r ~/.openclaw/memory-plugins ~/.openclaw/memory-plugins.backup

# 2. 拉取最新代码
cd ~/.openclaw/memory-plugins
git fetch origin main
git reset --hard origin/main
git submodule update --init --recursive

# 3. 更新本地文件
cp -r .memory-palace/* ~/.openclaw/memory-palace/
cp agents/openclaw/SKILL.md ~/.openclaw/workspace/skills/memory-palace.md
```

---

## 记忆宫殿架构

### 1. 每个网关独立的记忆宫殿

| 网关 | 记忆宫殿位置 | 私有仓库 |
|------|-------------|----------|
| **OpenClaw** | `~/.openclaw/memory-palace/` | `claws-memory/openclaw-memory-private` |
| **Hermes** | `~/.hermes/memories/` | `claws-memory/hermes-memory-private` |
| **Claude Code** | `~/.claude/agent-memory/` | `claws-memory/claude-code-memory-private` |
| **OpenCode** | `~/.opencode/memory/` | `claws-memory/opencode-memory-private` |

### 2. 记忆宫殿内容

每个记忆宫殿包含：

```
.memory-palace/{gateway}/
├── MEMORY_PALACE.md    # 记忆宫殿规则
├── L1_CORE/            # 核心记忆
├── L2_BUSINESS/        # 业务记忆
├── L3_CONFIG/          # 配置记忆
└── L4_INDEX/          # 索引记忆
```

### 3. 技能安装

每个网关安装时会获得：

```
agents/{gateway}/SKILL.md  →  网关的 skills/ 目录
```

---

## 双系统协同工作流

```
USER 对话
    │
    ▼
┌─────────────────────────────┐
│ System 2: 海绵式吸收        │
│ 零遗漏全量扫描 → 构建表象    │
└─────────────────────────────┘
    │ 完整记忆表象
    ▼
┌─────────────────────────────┐
│ Layer 1: 主动消解           │
│ 本轮残差立即处理             │
└─────────────────────────────┘
    │ 未消解残差
    ▼
┌─────────────────────────────┐
│ System 1: 淘金式提炼        │
│ 7条标准筛选 → 写入 MEMORY.md │
└─────────────────────────────┘
    │ 置信度传播
    ▼
┌─────────────────────────────┐
│ Gitea 同步                  │
│ 10:00/22:00 + 重大变更     │
└─────────────────────────────┘
```

---

## 三地一致性

```
System 2 表象（会话内存）  ←→  MEMORY.md（本地，~2200字）  ←→  Gitea（远程，全量）
       ↑                            ↑                            ↑
   本次对话全量               有效事实沉淀                   版本历史快照
   不直接持久化               金字塔结构                    每commit = 全量
```

| 冲突场景 | 处理 |
|---------|------|
| System 2 vs MEMORY.md | System 2 为准，立即更新 MEMORY.md |
| MEMORY.md vs Gitea | 定时同步，重大变更立即推送 |
| 三方冲突 | System 2 最新 > MEMORY.md > Gitea |

---

## 网关架构

| 网关 | 职责 | 同步策略 |
|------|------|----------|
| **OpenClaw** | 主网关、智能体路由 | 实时广播 |
| **Hermes** | 记忆网关、同步协调 | 定时 10:00/22:00 |
| **Claude-Code** | 代码网关、任务委派 | 会话级隔离 |
| **OpenCode** | 开源网关、嵌入检索 | 向量索引 |

---

## 记忆层级结构

```
MEMORY.md
├── L1_CORE          # 核心身份、排他规则
├── L2_BUSINESS      # 业务记忆
├── L3_CONFIG        # 运行环境
└── L4_INDEX        # 快速检索索引
```

| 层级 | 名称 | 内容 | 大小 |
|------|------|------|------|
| L1 | 核心 | 身份、排他规则、核心协议 | ~500字 |
| L2 | 业务 | 项目上下文、团队信息 | ~500字/业务域 |
| L3 | 配置 | 运行环境、服务地址 | ~500字 |
| L4 | 索引 | 快速检索引用 | ~200字 |

---

## 仓库命名规则

所有仓库创建在 `claws-memory` 组织下：

| 仓库类型 | 仓库名 |
|----------|--------|
| 公共主仓 | `claws-memory/main-memory-shared` |
| 业务子仓 | `claws-memory/business-memory-shared` |
| 代码子仓 | `claws-memory/code-memory-shared` |
| OpenClaw 私有 | `claws-memory/openclaw-memory-private` |
| Hermes 私有 | `claws-memory/hermes-memory-private` |
| Claude-Code 私有 | `claws-memory/claude-code-memory-private` |
| OpenCode 私有 | `claws-memory/opencode-memory-private` |

---

## 插件核心功能

| 功能 | 命令 | 说明 |
|------|------|------|
| 保存记忆 | `memory.save --repo main --path "rules/new-rule.md"` | 保存到指定仓库 |
| 加载记忆 | `memory.load --repo main --path "rules/new-rule.md"` | 加载记忆内容 |
| 搜索记忆 | `memory.search --query "关键词"` | 全文/向量搜索 |
| 同步记忆 | `memory.sync --repos all` | 同步所有仓库 |
| 广播记忆 | `memory.broadcast --event decision` | 广播到所有网关 |
| 查看状态 | `memory.status` | 查看同步状态 |

---

## 核心文件说明

### 记忆宫殿文件

| 文件 | 说明 |
|------|------|
| `MEMORY_PALACE.md` | 每个网关的记忆宫殿规则 |
| `SKILL.md` | 每个网关的记忆技能 |

### 记忆强化核心文件 (疯狂简洁: 7文件)

| 文件 | 说明 |
|------|------|
| `CORE.md` | L1 核心原则 (3步最优路径) |
| `MEMORY.md` | L2 业务域记忆 |
| `CONFIG.md` | L3 运行时配置 |
| `INDEX.md` | L4 快速检索索引 |
| `RESIDUAL_QUEUE.md` | 残差趋零队列 (R = Σ(size×weight)) |
| `MEMORY_SYSTEM.md` | 记忆系统设计规范 v2 |
| `MEMORY_INDEX.md` | 记忆索引结构模板 |

> 设计文档实现于 TypeScript 代码中: `system2-agent.ts`, `system1-agent.ts`, `agent-communication.ts`, `confidence-engine.ts`, `router-engine.ts`, `persona-engine.ts`

---

## 时间记忆功能（v7.0 新增）

> ⏰ **全量记忆自带时间记忆和增量记忆**

时间记忆是 v7.0 的核心功能，让每个 Gitea 仓库中的记忆都拥有：

| 能力 | 说明 | 命令 |
|------|------|------|
| **全量快照** | 每个 Commit = 全量快照 + 时间戳 | `time-memory.sh full <repo> "msg"` |
| **增量提交** | 仅记录变更部分（Diff） | `time-memory.sh inc <repo> "msg"` |
| **分支管理** | 按时间/项目/网关创建分支 | `time-memory.sh branch <repo> <name>` |
| **时间回溯** | 一键回到任意时间点 | `time-memory.sh timegoto <repo> <date>` |
| **历史查看** | 查看版本演变 | `time-memory.sh history <repo> [n]` |
| **版本对比** | 对比两个版本差异 | `time-memory.sh diff <repo> <v1> <v2>` |
| **时间线视图** | 可视化时间线 | `time-memory.sh log <repo>` |

**详细文档**: [时间记忆](./docs/TIME_MEMORY.md)

---

## 文档

| 文档 | 说明 |
|------|------|
| [安装指南](./docs/INSTALL.md) | 零配置安装说明 |
| [架构设计](./docs/architecture.md) | 系统架构详解 |
| [用户指南](./docs/user-guide.md) | 使用手册 |
| [升级指南](./docs/UPGRADE.md) | 版本升级说明 |
| [OpenClaw插件配置](./docs/openclaw-plugin-config.md) | 插件配置详解 |
| [时间记忆](./docs/TIME_MEMORY.md) | ⭐ v7.0 新功能 |

---

## License

MIT License

**项目地址**: https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins
