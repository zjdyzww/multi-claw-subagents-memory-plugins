# OpenClaw 记忆宫殿规则

> **版本**: v1.0 | **日期**: 2026-05-08  
> **适用**: OpenClaw 智能体 (灵禾镜 CTO 角色)  
> **核心理念**: 双系统协同 + L1-L4 金字塔 + 记忆宫殿

---

## 1. OpenClaw 记忆系统架构

### 1.1 OpenClaw 特有的记忆层级

OpenClaw 使用 SOUL.md + IDENTITY.md + USER.md + AGENTS.md 的身份架构：

```
~/.openclaw/workspace/
├── SOUL.md           # L1: 核心身份 (CTO 角色定位)
├── IDENTITY.md       # L1: 身份定义 (灵禾镜)
├── USER.md           # L2: 用户上下文 (山禾)
├── AGENTS.md        # L2: 团队管理规则
├── MEMORY.md        # L3: 长期记忆 ( curated)
├── HEARTBEAT.md     # L3: 定时任务配置
├── TOOLS.md         # L3: 工具配置
└── memory/
    ├── YYYY-MM-DD.md # L4: 日常记忆
    └── heartbeat-state.json
```

### 1.2 记忆流向

```
对话输入 → System 2 海绵吸收 → 记忆表象构建
    ↓
Layer 1 主动消解 → 未消解残差进入队列
    ↓
System 1 淘金提炼 → 7条标准筛选
    ↓
写入 MEMORY.md / TOOLS.md / AGENTS.md
    ↓
Gitea 同步 (10:00 / 22:00)
```

---

## 2. 记忆宫殿规则 (Looms)

### 2.1 核心 Loom (L1 必须记住)

| Loom | 位置 | 内容 |
|------|------|------|
| **身份** | SOUL.md | "你是灵禾镜，CTO" |
| **用户** | USER.md | 山禾 + XZ-IDMP 项目 |
| **排他** | SOUL.md | 不推送、不删除、不泄露 |
| **任务** | AGENTS.md | 子代理管理规则 |
| **心跳** | HEARTBEAT.md | 每30分钟检查 |
| **工具** | TOOLS.md | 项目路径、服务地址 |

### 2.2 业务 Loom (L2 按需加载)

| Loom | 位置 | 触发词 |
|------|------|--------|
| **XZ-IDMP 项目** | MEMORY.md | 项目、部署、开发 |
| **团队成员** | MEMORY.md | xz-devops、xz-backend |
| **技术栈** | MEMORY.md | Spring Boot、Vue3、TDengine |
| **服务地址** | TOOLS.md | localhost:48080、localhost:43000 |

### 2.3 残差队列 (Residual Queue)

位于 `~/.openclaw/workspace/memory/residual-queue.md`

---

## 3. OpenClaw 特有的记忆操作

### 3.1 记忆保存 (memory.save)

```bash
# 保存到公共仓库
memory.save --repo main --path "rules/new-rule.md" --content "..."

# 保存到私有仓库  
memory.save --repo openclaw --path "context/project-x.md" --content "..."
```

### 3.2 记忆加载 (memory.load)

```bash
# 加载规则
memory.load --repo main --path "protocols/coordination.md"

# 加载上下文
memory.load --repo openclaw --path "context/xz-idmp.md"
```

### 3.3 定时同步

| 时机 | 同步内容 |
|------|----------|
| 10:00 / 22:00 | MEMORY.md, TOOLS.md, AGENTS.md |
| 重大变更 | 立即同步 |
| 心跳检查 | 检查待推送数量 |

---

## 4. 置信度传播规则

| 等级 | 标识 | 定义 | 写入位置 |
|------|------|------|---------|
| 🟢 高 | CONFIRMED | 用户明确表达、多次验证 | L1/L2 |
| 🟡 中 | LIKELY | 单次获取、推断得出 | L2/L3 |
| 🔴 低 | UNCERTAIN | 模糊表达、单一信号 | L3 或丢弃 |

---

## 5. 残差趋零清理

### 5.1 三层清理机制

| Layer | 时机 | 动作 |
|-------|------|------|
| **Layer 1** | 每轮对话结束 | 主动消解，标记溯源 |
| **Layer 2** | 下轮对话触发 | 相关残差被解决则写入 |
| **Layer 3** | 每日 10:00/22:00 | 24h降级/7d归档/30d删除 |

### 5.2 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 残差消解率 ≥ 70%（72h内）

---

## 6. 安装后的初始化流程

### 6.1 首次安装

```bash
# 1. 克隆仓库
git clone https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins.git

# 2. 复制记忆宫殿规则
cp -r .memory-palace/* ~/.openclaw/memory-palace/
cp -r agents/openclaw/* ~/.openclaw/workspace/

# 3. 初始化 Git 仓库
cd ~/.openclaw/workspace
git init
git remote add origin https://git.osc.life/claws-memory/openclaw-memory-private.git

# 4. 配置心跳任务
openclaw cron add xz-memory-sync --every 1800000 --payload "memory.sync"
```

### 6.2 记忆同步

```bash
# 手动同步
memory.sync --repos all --direction both

# 查看状态
memory.status
```

---

## 7. 与其他网关的协作

### 7.1 广播协议

当 OpenClaw 完成重要决策时，广播到：

```
Hermes → business-memory-shared
Claude-Code → code-memory-shared
OpenCode → code-memory-shared
```

### 7.2 跨网关检索

```bash
# 查询其他网关的记忆
memory.search --query "项目架构" --repos "main,business,openclaw"
```

---

*OpenClaw 记忆宫殿规则 v1.0 | 2026-05-08*
