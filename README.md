# Multi-Claw Subagents Memory Plugins

> 多智能体多网关多代理多关联子仓库适配的记忆增强插件系统

## 项目概述

本项目为 OpenClaw、Hermes、Claude Code、OpenCode 等智能体提供统一的多层记忆管理系统。

### 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                 Multi-Claw Memory Architecture                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ OpenClaw   │ │   Hermes    │ │ Claude Code │          │
│  │ Private    │ │   Private   │ │   Private   │  ← 个体   │
│  │ Memory     │ │   Memory    │ │   Memory    │    私有   │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │         Shared Main Memory Repository         │  ← 公共   │
│  │    (rules, protocols, shared knowledge)      │    主仓   │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Business     │  │ Code         │           ← 公共子仓   │
│  │ Sub-Repo     │  │ Sub-Repo     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 仓库结构

```
multi-claw-subagents-memory-plugins/
├── plugins/                      # 插件源码
│   ├── openclaw-memory-plugin/  # OpenClaw 记忆插件
│   ├── hermes-memory-plugin/    # Hermes 记忆插件
│   ├── claude-code-memory-plugin/ # Claude Code 记忆插件
│   ├── opencode-memory-plugin/   # OpenCode 记忆插件
│   └── shared-memory-core/      # 共享核心库
├── main/                         # 公共记忆主仓
│   ├── _index/
│   ├── protocols/
│   ├── rules/
│   └── shared-knowledge/
├── business/                     # 公共记忆业务子仓
│   ├── projects/
│   └── domains/
├── code/                         # 公共记忆代码子仓
│   ├── snippets/
│   ├── patterns/
│   └── scripts/
└── docs/                         # 文档
```

## 子仓库

| 仓库 | 用途 | 访问 |
|------|------|------|
| `main-memory-shared` | 公共记忆主仓 | 所有智能体共享 |
| `business-memory-shared` | 业务知识子仓 | 所有智能体共享 |
| `code-memory-shared` | 代码资产子仓 | 所有智能体共享 |
| `{agent}-memory-private` | 个体私有记忆仓 | 各智能体私有 |

## 快速开始

### 1. 初始化插件

```bash
# 克隆主仓库
git clone https://git.osc.life/myz/multi-claw-subagents-memory-plugins.git
cd multi-claw-subagents-memory-plugins

# 初始化子仓库
git submodule update --init --recursive
```

### 2. 配置插件

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true
      }
    }
  },
  "channels": {
    "qqbot": {
      "enabled": true
    }
  }
}
```

### 3. 使用记忆工具

```
memory.save --repo main --path "rules/new-rule.md" --content "# 新规则"
memory.load --repo main --path "rules/new-rule.md"
memory.search --query "规则"
memory.sync --repo all
```

## 文档

- [架构设计](./docs/architecture.md)
- [用户指南](./docs/user-guide.md)
- [开发者指南](./docs/developer-guide.md)

## License

MIT License
