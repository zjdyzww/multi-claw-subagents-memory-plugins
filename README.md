# Multi-Claw Subagents Memory Plugins

> **多智能体多网关多代理记忆增强插件系统**  
> **版本**: v6.1 | **日期**: 2026-05-08  
> **作者**: 灵禾镜-玉山禾

---

## 核心创新

本项目整合了 **双系统协同记忆框架** 与 **多智能体多网关架构**，实现：

- 🧠 **双系统协同**: System 2 海绵式全量吸收 ↔ System 1 淘金式提炼
- 🌐 **多网关路由**: OpenClaw + Hermes + Claude-Code + OpenCode 分工协作
- 📦 **三地一致性**: 表象 ↔ MEMORY.md ↔ Gitea 实时同步
- ⚡ **零配置安装**: 一次对话即可完成部署
- 🏛️ **记忆宫殿**: 每个网关独立的记忆宫殿规则和技能

## 安装前提
- 已安装OpenClaw、Hermes、Claude-Code、OpenCode任意1个智能体
- 拥有git平台（github、gitea、gitlab等）账户和该账户关联的拥有创建仓库并进行读写权限的token

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
├── .memory-agent-files/            # ⭐ 记忆强化核心文件
│   ├── AGENT_PROMPT.md           # 完整代理提示词
│   ├── SKILL_DUAL_THINKING.md   # 双系统协同技能
│   ├── SKILL_MEMORY_MANAGER.md   # 记忆管理器技能
│   ├── MEMORY_SYSTEM.md         # 记忆系统设计
│   ├── MEMORY_INDEX.md          # 记忆索引结构
│   ├── CORE.md                  # 核心架构
│   ├── CONFIDENCE_PROPAGATION.md # 置信度传播
│   ├── PATH_ANALYSIS.md         # 路径分析
│   ├── PERSONA_COORDINATOR.md   # 角色协调器
│   ├── RETRIEVAL_ROUTER.md      # 检索路由
│   ├── RESIDUAL_QUEUE.md        # 残差队列
│   ├── VERSION_*.md             # 版本管理
│   ├── HERMES_INTEGRATION.md    # Hermes 集成指南
│   ├── BUSINESS/                # 业务示例
│   ├── episodes/                # 会话片段
│   └── 论文_疯狂的简洁_记忆强化框架.md
│
├── plugins/                        # 插件源码
│   ├── shared-memory-core/       # 共享核心库
│   └── openclaw-memory-plugin/   # OpenClaw 插件
│
├── scripts/                        # 管理脚本
│   ├── install.sh               # ⭐ 一次安装脚本 v2
│   ├── init-repos.sh            # 初始化子仓库
│   ├── sync-memory.sh           # 同步脚本
│   └── benchmark.sh             # 性能测试
│
└── docs/                          # 文档
    ├── INSTALL.md               # 安装指南
    ├── architecture.md          # 架构设计
    └── user-guide.md           # 用户指南
```

---

## 🚀 快速安装

### 方法一：复制提示词（推荐）

```
add multi-claw-subagents-memory-plugins where plugins-url=https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins gitserver-url=https://git.osc.life gitserver-token=<YOUR_TOKEN> gitgroup-name=claws-memory
```

**参数说明：**
- `plugins-url`: 插件仓库地址（不用改）
- `gitserver-url`: Git服务器地址（用于存储您的智能体的全量时序记忆）
- `gitserver-token`: 私有Git服务器账户访问令牌
- `gitgroup-name`: Git 组/组织名称（确保该Git组/组织已创建）

### 方法二：安装脚本

```bash
bash <(curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/scripts/install.sh) \
  --plugins-url https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token <YOUR_TOKEN> \
  --gitgroup-name claws-memory
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

### 记忆强化核心文件

| 文件 | 说明 |
|------|------|
| `AGENT_PROMPT.md` | 完整代理提示词 v2（直接注册） |
| `SKILL_DUAL_THINKING.md` | 双系统协同技能 v2（海绵+淘金） |
| `SKILL_MEMORY_MANAGER.md` | 记忆管理器技能 v2（一致性执行） |
| `MEMORY_SYSTEM.md` | 记忆系统设计文档 v2 |
| `MEMORY_INDEX.md` | 记忆索引结构模板 |
| `CORE.md` | 核心架构文档 |
| `HERMES_INTEGRATION.md` | Hermes 集成指南 |

---

## 文档

| 文档 | 说明 |
|------|------|
| [安装指南](./docs/INSTALL.md) | 零配置安装说明 |
| [架构设计](./docs/architecture.md) | 系统架构详解 |
| [用户指南](./docs/user-guide.md) | 使用手册 |

---

## License

MIT License

**项目地址**: https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins
