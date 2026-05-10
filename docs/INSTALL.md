# 安装指南

> **版本**: v4.0 | **日期**: 2026-05-08  
> **适用**: OpenClaw, Hermes, Claude Code, OpenCode

---

## 前置要求

- Git 服务器 (Gitea/GitHub/GitLab)
- Token 具有创建仓库权限
- curl, git 命令行工具

---

## 快速安装

### 初始安装（默认每种1个）

```bash
bash <(curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/scripts/install.sh) \
  --plugins-url https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token YOUR_TOKEN \
  --gitgroup-name claws-memory
```

### 参数说明

| 参数 | 必需 | 说明 |
|------|------|------|
| `--plugins-url` | ✅ | 插件仓库地址 |
| `--gitserver-url` | ✅ | Git 服务器地址 |
| `--gitserver-token` | ✅ | 访问令牌 |
| `--gitgroup-name` | ✅ | Git 组/组织名称 |
| `--local-path` | ❌ | 本地安装路径 |

---

## 动态增加私有仓库

安装后，可根据需要动态增加私有仓库数量：

### 增加 OpenClaw 私有仓库到 3 个

```bash
bash install.sh \
  --add-agent openclaw:3 \
  --gitgroup-name claws-memory \
  --gitserver-token YOUR_TOKEN
```

### 增加 OpenCode 私有仓库到 2 个

```bash
bash install.sh \
  --add-agent opencode:2 \
  --gitgroup-name claws-memory \
  --gitserver-token YOUR_TOKEN
```

### 查看当前状态

```bash
bash install.sh \
  --status \
  --gitgroup-name claws-memory \
  --gitserver-token YOUR_TOKEN
```

---

## 仓库命名规则

```
{type}-{index}-memory-private
```

| 示例 | 说明 |
|------|------|
| `hermes-1-memory-private` | Hermes 第 1 个私有仓 |
| `openclaw-1-memory-private` | OpenClaw 第 1 个私有仓 |
| `openclaw-2-memory-private` | OpenClaw 第 2 个私有仓 |
| `openclaw-3-memory-private` | OpenClaw 第 3 个私有仓 |
| `opencode-1-memory-private` | OpenCode 第 1 个私有仓 |
| `opencode-2-memory-private` | OpenCode 第 2 个私有仓 |

---

## 完整示例

```bash
# 1. 初始安装（每种1个）
bash <(curl -sL https://.../install.sh) \
  --plugins-url https://... \
  --gitserver-url https://... \
  --gitserver-token TOKEN \
  --gitgroup-name claws-memory

# 2. 查看状态
bash install.sh --status --gitgroup-name claws-memory --gitserver-token TOKEN

# 3. 增加 OpenClaw 到 3 个
bash install.sh --add-agent openclaw:3 --gitgroup-name claws-memory --gitserver-token TOKEN

# 4. 增加 OpenCode 到 2 个
bash install.sh --add-agent opencode:2 --gitgroup-name claws-memory --gitserver-token TOKEN
```

---

## 安装后配置

### 1. OpenClaw 配置

编辑 `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "mainRepoUrl": "https://git.osc.life/claws-memory/main-memory-shared.git",
          "businessRepoUrl": "https://git.osc.life/claws-memory/business-memory-shared.git",
          "codeRepoUrl": "https://git.osc.life/claws-memory/code-memory-shared.git",
          "privateRepoUrl": "https://git.osc.life/claws-memory/openclaw-1-memory-private.git",
          "localPath": "~/.openclaw/memory",
          "syncInterval": 300000
        }
      }
    }
  }
}
```

### 2. 重启 OpenClaw

```bash
openclaw gateway restart
```

### 3. 验证安装

```bash
# 检查插件状态
openclaw plugins list | grep memory

# 测试记忆功能
memory.status
memory.save --repo main --path test.md --content "# Test"
memory.load --repo main --path test.md
```

---

## 各网关安装位置

| 网关 | 记忆宫殿位置 | 私有仓库 |
|------|-------------|----------|
| OpenClaw | `~/.openclaw/memory-palace/` | `openclaw-1-memory-private` |
| Hermes | `~/.hermes/memories/` | `hermes-1-memory-private` |
| Claude Code | `~/.claude/agent-memory/` | `claude-code-1-memory-private` |
| OpenCode | `~/.opencode/memory/` | `opencode-1-memory-private` |

---

## 手动安装

如果自动安装失败，可以手动安装：

### 1. 克隆仓库

```bash
git clone https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins.git ~/.openclaw/memory-plugins
```

### 2. 复制记忆宫殿文件

```bash
# OpenClaw
cp -r ~/.openclaw/memory-plugins/.memory-palace/openclaw/* ~/.openclaw/memory-palace/
cp ~/.openclaw/memory-plugins/agents/openclaw/SKILL.md ~/.openclaw/workspace/skills/

# Hermes
cp -r ~/.openclaw/memory-plugins/.memory-palace/hermes/* ~/.hermes/memories/
cp ~/.openclaw/memory-plugins/agents/hermes/SKILL.md ~/.hermes/skills/productivity/

# Claude Code
cp -r ~/.openclaw/memory-plugins/.memory-palace/claude-code/* ~/.claude/agent-memory/
cp ~/.openclaw/memory-plugins/agents/claude-code/SKILL.md ~/.claude/skills/

# OpenCode
cp -r ~/.openclaw/memory-plugins/.memory-palace/opencode/* ~/.opencode/memory/
cp ~/.openclaw/memory-plugins/agents/opencode/SKILL.md ~/.opencode/skills/
```

### 3. 初始化 Git 仓库

```bash
# OpenClaw
cd ~/.openclaw/memory-palace
git init
git remote add origin https://git.osc.life/claws-memory/openclaw-1-memory-private.git

# 其他网关类似...
```

---

## 卸载

```bash
# 删除记忆宫殿目录
rm -rf ~/.openclaw/memory-palace
rm -rf ~/.hermes/memories/memory-palace
rm -rf ~/.claude/agent-memory/memory-palace
rm -rf ~/.opencode/memory/memory-palace

# 删除插件配置
# 编辑 ~/.openclaw/openclaw.json 移除 memory 插件配置
```

---

## 常见问题

### Q: 安装脚本报错 "组织已存在"

**A**: 没问题，可以忽略。安装脚本会自动跳过已存在的组织。

### Q: Token 权限不足

**A**: 确保 Token 具有以下权限：
- `repo` (仓库读写)
- `org` (组织管理)

### Q: 记忆同步失败

**A**: 检查：
1. Git 远程 URL 是否正确
2. Token 是否有仓库访问权限
3. 本地网络是否正常

---

## 升级

```bash
cd ~/.openclaw/memory-plugins
git pull origin main
git submodule update --init --recursive
```

---

*安装指南 v2.0 | 2026-05-08*
