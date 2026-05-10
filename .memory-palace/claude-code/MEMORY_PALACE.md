# Claude Code 记忆宫殿规则

> **版本**: v1.0 | **日期**: 2026-05-08  
> **适用**: Claude Code 智能体 (coder 角色)  
> **核心理念**: 记忆强化框架 + 代码上下文 + 任务委派

---

## 1. Claude Code 记忆系统架构

### 1.1 记忆目录结构

```
~/.claude/
├── agent-memory/              # 智能体记忆目录
│   ├── xz-backend-dev/       # 后端开发记忆
│   ├── xz-frontend-dev/      # 前端开发记忆
│   ├── xz-devops/           # 运维记忆
│   └── ...
├── projects/                  # 项目上下文
├── skills/                    # 技能配置
└── memories/                 # 共享记忆
    ├── L1_CORE/
    ├── L2_BUSINESS/
    ├── L3_CONFIG/
    └── L4_INDEX/
```

### 1.2 记忆流向

```
任务输入 → System 2 海绵吸收 → 记忆表象
    ↓
System 1 淘金提炼 → 代码片段 / 上下文
    ↓
写入 projects/ + agent-memory/
    ↓
Git 同步 → code-memory-shared
```

---

## 2. 记忆宫殿规则 (Looms)

### 2.1 核心 Loom (L1)

| Loom | 位置 | 内容 |
|------|------|------|
| **角色** | ~/.claude.json | coder, reviewer, architect |
| **项目上下文** | projects/ | 当前项目信息 |
| **代码规范** | ~/.claude/skills/ | 编码规范 |
| **排他规则** | agent-memory/ | 不破坏、不泄露 |

### 2.2 业务 Loom (L2)

| Loom | 位置 | 触发词 |
|------|------|--------|
| **后端开发** | agent-memory/xz-backend-dev/ | Java, Spring Boot, API |
| **前端开发** | agent-memory/xz-frontend-dev/ | Vue3, React, CSS |
| **运维** | agent-memory/xz-devops/ | Docker, CI/CD, 部署 |
| **数据库** | agent-memory/xz-db-architect/ | MySQL, TDengine, Redis |

### 2.3 代码 Loom (L3)

| Loom | 位置 | 用途 |
|------|------|------|
| **代码片段** | projects/*/snippets/ | 可复用代码 |
| **设计模式** | memories/L2/code-patterns/ | 架构设计 |
| **脚本** | memories/L2/scripts/ | 运维脚本 |

---

## 3. Claude Code 特有的记忆操作

### 3.1 保存代码上下文

```bash
# 保存代码片段
memory.save --repo code --path "snippets/java/parser.java" --content "..."

# 保存项目上下文
memory.save --repo claude-code --path "context/xz-idmp-backend.md" --content "..."
```

### 3.2 加载项目上下文

```bash
# 加载 XZ-IDMP 后端上下文
memory.load --repo claude-code --path "context/xz-idmp-backend.md"

# 加载代码规范
memory.load --repo code --path "standards/java-conventions.md"
```

### 3.3 定时同步

| 时机 | 同步内容 |
|------|----------|
| 任务完成 | 关键代码片段 |
| 每日 22:00 | 全量同步 |
| 重大变更 | 立即同步 |

---

## 4. 与 OpenClaw 的协作

### 4.1 任务委派接收

当 OpenClaw 分配任务时：

```
1. 接收任务描述 → 保存到 agent-memory/
2. 分析需求 → 确定需要的上下文
3. 执行任务 → 保存结果到 projects/
4. 汇报结果 → 通知 OpenClaw
```

### 4.2 广播协议

```
任务完成 → OpenClaw → 更新 business-memory-shared
代码提交 → OpenCode → 更新 code-memory-shared
```

---

## 5. 安装后初始化

### 5.1 首次安装

```bash
# 1. 复制记忆宫殿规则
cp -r .memory-palace/claude-code/* ~/.claude/agent-memory/

# 2. 创建项目上下文
mkdir -p ~/.claude/projects/xz-idmp
mkdir -p ~/.claude/projects/xz-idmp/snippets

# 3. 初始化 Git
cd ~/.claude
git remote add origin https://git.osc.life/claws-memory/claude-code-1-memory-private.git

# 4. 设置定时同步
# 在 cron 中添加: 22:00 memory.sync --repos claude-code
```

### 5.2 同步命令

```bash
# 同步所有记忆
memory.sync --repos claude-code --direction both

# 查看状态
memory.status
```

---

## 6. 残差趋零清理

### 6.1 清理规则

| 条件 | 处理 |
|------|------|
| T > 24h 未解决 | 降级归档 |
| T > 7天 未解决 | 移入 archive/ |
| T > 30天 未解决 | 彻底删除 |

### 6.2 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h

---

*Claude Code 记忆宫殿规则 v1.0 | 2026-05-08*
