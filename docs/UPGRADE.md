# 升级指南

> **版本**: v1.0 | **日期**: 2026-05-08

---

## 快速升级

### 一键升级

```bash
bash <(curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/scripts/upgrade.sh)
```

### 检查版本

```bash
bash upgrade.sh --check
```

### 预览升级内容

```bash
bash upgrade.sh --dry-run
```

---

## 升级选项

| 选项 | 说明 |
|------|------|
| `--check` | 仅检查版本，不升级 |
| `--dry-run` | 预览升级内容，不执行 |
| `--force` | 强制升级（跳过确认） |

---

## 版本历史

### v6.0 (2026-05-08)

**变更**:
- 安装提示词简化，移除 `agents` 参数
- 默认每种类型 1 个私有仓库
- 新增 `--add-agent` 动态增加私有仓库
- 新增 `--status` 查看当前配置
- 私有仓库命名改为 `{type}-{index}-memory-private`

**升级命令**:
```bash
bash upgrade.sh
```

---

### v5.0 (2026-05-08)

**变更**:
- 支持动态私有仓库数量
- agents 参数格式: `hermes:1,openclaw:3,opencode:2,claude-code:0`

**升级命令**:
```bash
bash upgrade.sh
```

---

### v4.0 (2026-05-08)

**变更**:
- 新增记忆宫殿 (Memory Palace) 功能
- 为每个网关创建独立的记忆宫殿规则
- 新增 `.memory-palace/` 目录
- 新增 `agents/` 目录，包含各网关的 SKILL.md

**升级命令**:
```bash
bash upgrade.sh
```

**升级后需要**:
- 重新安装记忆宫殿（脚本会自动处理）
- 重新配置各网关的 Skills

---

### v3.0 (2026-05-08)

**变更**:
- 整合 memory-agent-plugins 核心文件
- 新增 `.memory-agent-files/` 目录
- 包含双系统协同记忆框架

---

### v2.0 (2026-05-08)

**变更**:
- L1-L4 四层记忆架构
- 多网关路由配置
- 记忆同步协议

---

### v1.0 (2026-05-08)

**初始版本**:
- 基础记忆仓库架构
- Git 同步功能

---

## 手动升级

如果自动升级失败，可手动升级：

### 1. 备份

```bash
cp -r ~/.openclaw/memory-plugins ~/.openclaw/memory-plugins.backup
```

### 2. 拉取最新代码

```bash
cd ~/.openclaw/memory-plugins
git fetch origin main
git reset --hard origin/main
git submodule update --init --recursive
```

### 3. 更新本地文件

```bash
# 更新记忆宫殿
cp -r ~/.openclaw/memory-plugins/.memory-palace/* ~/.openclaw/memory-palace/

# 更新 Skills
cp ~/.openclaw/memory-plugins/agents/openclaw/SKILL.md ~/.openclaw/workspace/skills/memory-palace.md
```

---

## 常见问题

### Q: 升级后版本显示不正确?

检查 VERSION 文件:
```bash
cat ~/.openclaw/memory-plugins/VERSION
```

### Q: 升级失败如何回滚?

```bash
# 使用备份恢复
cp -r ~/.openclaw/memory-plugins.backup.XXXXXXXX ~/.openclaw/memory-plugins
```

### Q: 如何检查最新版本?

```bash
curl -sL https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins/raw/main/VERSION
```

---

## 回滚操作

### 自动回滚

升级脚本会自动创建备份，位于:
```
~/.openclaw/memory-plugins.backup.XXXXXXXX/
```

### 手动回滚

```bash
# 1. 停止 Gateway
openclaw gateway stop

# 2. 恢复备份
rm -rf ~/.openclaw/memory-plugins
cp -r ~/.openclaw/memory-plugins.backup.XXXXXXXX ~/.openclaw/memory-plugins

# 3. 重启 Gateway
openclaw gateway start
```

---

## 联系我们

如遇到升级问题，请联系维护者或提交 Issue。
