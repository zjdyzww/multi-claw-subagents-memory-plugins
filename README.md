# Multi-Claw Subagents Memory Plugins

> 多智能体多网关多代理多关联子仓库适配的记忆增强插件系统  
> **版本**: v3.0 | **日期**: 2026-05-08  
> **灵感来源**: [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) 一次安装模式

## 🚀 一次对话安装

参考 oh-my-openagent 的 `bunx oh-my-openagent install` 模式，设计零配置安装体验：

```
add multi-claw-subagents-memory-plugins where plugins-url=https://git.osc.life/myz/multi-claw-subagents-memory-plugins gitserver-url=https://git.osc.life gitserver-token=<TOKEN>
```

或复制以下提示词到 LLM Agent：

```
Install and configure multi-claw-subagents-memory-plugins by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/multi-claw-subagents-memory-plugins/main/docs/INSTALL.md
```

**完整安装脚本用法**：

```bash
bash <(curl -sL https://git.osc.life/myz/multi-claw-subagents-memory-plugins/raw/main/scripts/install.sh) \
  --plugins-url https://git.osc.life/myz/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token YOUR_GIT_TOKEN \
  --group claws-memory
```

## 项目概述

本项目为 OpenClaw、Hermes、Claude Code、OpenCode 等智能体提供统一的**多层记忆管理系统**，实现：

- ✅ 4 个智能体独立私有记忆仓 (L1-L4 四层架构)
- ✅ 1 个公共记忆主仓 + 2 个业务/代码子仓
- ✅ 多网关路由与记忆同步机制
- ✅ 完整的访问控制与一致性保障

## 核心架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Claw Memory Architecture v2.0              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  OpenClaw  │ │   Hermes   │ │Claude-Code │ │  OpenCode   ││
│  │  Private   │ │   Private   │ │   Private   │ │   Private   ││
│  │  Memory    │ │   Memory    │ │   Memory    │ │   Memory    ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Shared Memory Layer                          │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │  Main    │  │ Business │  │   Code   │                  │ │
│  │  │  Memory  │  │  Memory  │  │  Memory  │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │  Gateway   │ │  Gateway    │ │  Gateway    │ │  Gateway    ││
│  │  Router    │ │  Sync       │ │  Code       │ │  OpenCode   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## L1-L4 记忆层级

| 层级 | 名称 | 职责 | 内容 |
|------|------|------|------|
| **L1** | Core | 核心身份与协议 | 身份定义、排他规则、MCP协议 |
| **L2** | Business | 业务规则 | 任务分配、协作模式、权限矩阵 |
| **L3** | Config | 运行环境 | 软硬件配置、API端点 |
| **L4** | Index | 快速检索 | 记忆索引、版本历史 |

## 仓库结构

```
multi-claw-subagents-memory-plugins/
├── .gateways/                        # 网关配置层
│   ├── openclaw-gateway.md
│   └── hermes-gateway.md
│
├── .agents/                          # 智能体定义层
│   ├── openclaw/private-memory/      # OpenClaw 私有仓
│   ├── hermes/private-memory/        # Hermes 私有仓
│   ├── claude-code/private-memory/   # Claude-Code 私有仓
│   └── opencode/private-memory/      # OpenCode 私有仓
│
├── .shared/                          # 公共记忆层
│   ├── main-memory/                 # 公共主仓
│   │   ├── L1_PROTOCOLS/          # 核心协议
│   │   ├── L2_RULES/              # 业务规则
│   │   ├── L3_CONFIG/             # 配置层
│   │   └── L4_INDEX/             # 索引层
│   │
│   ├── business-memory/             # 业务子仓
│   │   ├── projects/xz-idmp/      # 项目知识
│   │   └── domains/               # 业务领域
│   │
│   └── code-memory/                # 代码子仓
│       ├── snippets/              # 代码片段
│       └── patterns/             # 设计模式
│
├── .core/                           # 核心框架层
│   ├── CORE.md                    # 架构设计
│   └── MEMORY_SYSTEM.md           # 系统规范
│
├── plugins/                         # 插件源码
│   ├── shared-memory-core/         # 共享核心库
│   └── openclaw-memory-plugin/    # OpenClaw 插件
│
├── docs/                            # 文档
│   ├── architecture.md
│   └── user-guide.md
│
└── scripts/                         # 管理脚本
    ├── init-repos.sh
    ├── sync-memory.sh
    └── benchmark.sh
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://git.osc.life/myz/multi-claw-subagents-memory-plugins.git
cd multi-claw-subagents-memory-plugins
```

### 2. 初始化子仓库

```bash
bash scripts/init-repos.sh
```

### 3. 配置插件

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "mainRepoUrl": "https://git.osc.life/myz/main-memory-shared.git",
          "businessRepoUrl": "https://git.osc.life/myz/business-memory-shared.git",
          "codeRepoUrl": "https://git.osc.life/myz/code-memory-shared.git",
          "privateRepoUrl": "https://git.osc.life/myz/openclaw-memory-private.git",
          "syncInterval": 300000
        }
      }
    }
  }
}
```

### 4. 重启 Gateway

```bash
openclaw gateway restart
```

## 核心功能

### 记忆管理

| 功能 | 命令 | 说明 |
|------|------|------|
| 保存记忆 | `memory.save --repo main --path "rules/new-rule.md"` | 保存到指定仓库 |
| 加载记忆 | `memory.load --repo main --path "rules/new-rule.md"` | 加载记忆内容 |
| 搜索记忆 | `memory.search --query "关键词"` | 全文搜索 |
| 同步记忆 | `memory.sync --repos all` | 同步所有仓库 |
| 查看状态 | `memory.status` | 查看同步状态 |

### 性能基准测试

```bash
# 运行基准测试
bash scripts/benchmark.sh

# 自定义配置
AGENTS=openclaw,hermes CONCURRENCY=20 bash scripts/benchmark.sh
```

## 网关职责

| 网关 | 职责 | 路由策略 | 同步方式 |
|------|------|----------|----------|
| **OpenClaw** | 主网关、智能体路由 | 确定性绑定 | 实时广播 |
| **Hermes** | 记忆网关、同步协调 | 内容路由 | 定时同步 (10:00/22:00) |
| **Claude-Code** | 代码网关、任务委派 | 任务类型 | 会话级隔离 |
| **OpenCode** | 开源网关、嵌入检索 | 许可证过滤 | 向量索引 |

## 同步策略

| 记忆类型 | 同步频率 | 冲突解决 | 一致性 |
|----------|----------|----------|--------|
| 私有记忆 | 实时 | 单智能体权威 | 强一致性 |
| 公共主仓 | 10:00 / 22:00 | 最后写入者胜出 | 最终一致性 |
| 业务子仓 | 按需触发 | 审核机制 | 会话一致性 |
| 代码子仓 | 代码提交时 | 版本合并 | 强一致性 |

## 性能指标

| 指标 | 目标 | 测量方法 |
|------|------|----------|
| 记忆检索延迟 | < 100ms | P50 响应时间 |
| 同步成功率 | 99% | 成功/总数 |
| 冲突解决时间 | < 5min | 检测到解决 |
| 记忆命中率 | 85% | 命中/查询 |

## 文档

| 文档 | 说明 |
|------|------|
| [架构设计](./.core/CORE.md) | 核心架构详细设计 |
| [系统规范](./.core/MEMORY_SYSTEM.md) | 记忆系统规范 |
| [用户指南](./docs/user-guide.md) | 使用指南 |
| [设计方案 v2](./多智能体多网关多代理记忆增强插件建设方案v2.md) | 完整建设方案 |

## License

MIT License
