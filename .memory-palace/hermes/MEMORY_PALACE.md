# Hermes 记忆宫殿规则

> **版本**: v1.0 | **日期**: 2026-05-08  
> **适用**: Hermes 智能体 (记忆网关角色)  
> **核心理念**: 双系统协同 + 记忆同步协调 + 多网关路由

---

## 1. Hermes 记忆系统架构

Hermes 是记忆同步的协调者，负责在各网关之间路由记忆。

### 1.1 记忆目录结构

```
~/.hermes/
├── memories/                  # 主记忆存储
│   ├── L1_CORE/              # 核心身份
│   ├── L2_BUSINESS/          # 业务记忆
│   ├── L3_CONFIG/           # 配置记忆
│   └── L4_INDEX/           # 索引记忆
├── agent-memory/             # 智能体记忆
├── archive/                  # 归档
│   ├── residuals/           # 残差归档
│   └── old_versions/       # 旧版本归档
├── episodes/                 # 情节存储
├── skills/                   # 技能
│   ├── productivity/
│   │   ├── dual-thinking/  # 双系统技能
│   │   └── memory-manager/ # 记忆管理技能
│   └── ...
└── logs/                     # 日志
```

### 1.2 Hermes 特有的记忆流

```
接收广播 → 验证格式 → 路由到对应仓库
    ↓
同步协调 → 确保各仓库一致性
    ↓
冲突检测 → 解决冲突或上报
```

---

## 2. 记忆宫殿规则 (Looms)

### 2.1 核心 Loom (L1)

| Loom | 位置 | 内容 |
|------|------|------|
| **身份** | L1_CORE/identity.md | Hermes 记忆网关角色 |
| **排他规则** | L1_CORE/exclusive.md | 不修改其他网关私有仓 |
| **同步协议** | L1_CORE/protocol.md | 同步规则和时序 |
| **广播规则** | L1_CORE/broadcast.md | 广播触发条件 |

### 2.2 业务 Loom (L2)

| Loom | 位置 | 触发词 |
|------|------|--------|
| **XZ-IDMP 项目** | L2_BUSINESS/xz-idmp/ | 项目、部署、技术选型 |
| **团队协作** | L2_BUSINESS/team/ | 协作规则、沟通协议 |
| **记忆同步** | L2_BUSINESS/sync/ | 同步记录、冲突日志 |

### 2.3 配置 Loom (L3)

| Loom | 位置 | 用途 |
|------|------|------|
| **仓库配置** | L3_CONFIG/repos/ | 仓库 URL、凭据 |
| **同步调度** | L3_CONFIG/schedule/ | 定时任务配置 |
| **API 配置** | L3_CONFIG/api/ | Gitea API、Token |

---

## 3. Hermes 特有的记忆操作

### 3.1 同步协调

```bash
# 同步所有仓库
memory.sync --repos all --direction both

# 检查一致性
memory.check --consistency

# 解决冲突
memory.resolve --conflict <id>
```

### 3.2 广播管理

```bash
# 广播到所有网关
memory.broadcast --event "project-update" --content "..."

# 查看广播日志
memory.broadcast --log
```

### 3.3 定时同步

| 时机 | 同步内容 |
|------|----------|
| 10:00 | 全量同步 |
| 22:00 | 全量同步 |
| 重大变更 | 立即广播 |
| 每小时 | 检查一致性 |

---

## 4. 双系统协同 (Hermes 特有)

### 4.1 System 2 海绵式吸收

Hermes 作为协调者，需要 100% 吸收各网关的广播：

```
1. 接收 OpenClaw 广播 → 记录到 episodes/
2. 接收 Claude Code 广播 → 记录到 episodes/
3. 接收 OpenCode 广播 → 记录到 episodes/
4. 构建完整记忆表象
```

### 4.2 System 1 淘金式提炼

从海量广播中提炼高价值信息：

```
1. 扫描所有 episodes/
2. 识别重大变更
3. 更新 L2_BUSINESS
4. 广播给所有网关
```

---

## 5. 与其他网关的协作

### 5.1 协调协议

```
OpenClaw → 发送决策广播 → Hermes
Claude Code → 发送代码广播 → Hermes  
OpenCode → 发送贡献广播 → Hermes

Hermes → 验证 → 路由 → 同步 → 广播确认
```

### 5.2 冲突解决

| 冲突类型 | 解决策略 |
|----------|----------|
| L1 冲突 | System 2 最新 > 人工确认 |
| L2/L3 冲突 | 时间戳优先 |
| L4 冲突 | 自动合并 |

---

## 6. 安装后初始化

### 6.1 首次安装

```bash
# 1. 复制记忆宫殿规则
cp -r .memory-palace/hermes/* ~/.hermes/memories/

# 2. 安装技能
cp -r skills/productivity/dual-thinking/ ~/.hermes/skills/productivity/
cp -r skills/productivity/memory-manager/ ~/.hermes/skills/productivity/

# 3. 初始化仓库
cd ~/.hermes
git remote add origin https://git.osc.life/claws-memory/hermes-memory-private.git

# 4. 配置定时任务
# 添加 cron: 10:00, 22:00 memory.sync --repos all
```

### 6.2 同步命令

```bash
# 同步所有仓库
memory.sync --repos all --direction both

# 检查一致性
memory.check --consistency

# 查看状态
memory.status
```

---

## 7. 残差趋零清理

### 7.1 清理规则

| 条件 | 处理 |
|------|------|
| T > 24h 未解决 | 降级归档 |
| T > 7天 未解决 | 移入 archive/residuals/ |
| T > 30天 未解决 | 彻底删除 |

### 7.2 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 同步成功率 ≥ 99%

---

*Hermes 记忆宫殿规则 v1.0 | 2026-05-08*
