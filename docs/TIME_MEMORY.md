# 时间记忆 - Time Memory

> **版本**: v1.0 | **日期**: 2026-05-08  
> **功能**: 全量记忆自带时间记忆 + 增量记忆能力

---

## 核心概念

### 为什么需要时间记忆？

传统记忆管理的痛点：

| 问题 | 描述 |
|------|------|
| **无历史回溯** | 只能看到当前状态，无法回到过去 |
| **版本混乱** | 不知道哪个版本包含哪些记忆 |
| **增量难追踪** | 变更分散在无数次提交中 |
| **时间感缺失** | 记忆没有时间戳，无法按时间查询 |

### 时间记忆的解决方案

```
┌─────────────────────────────────────────────────────────────┐
│                    时间记忆架构                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  每个 Commit = 时间戳 + 全量快照 / 增量 Diff                  │
│                                                              │
│  ┌─────────────┐  Full Commit  │  增量 Commit               │
│  │  2026-05-08 │ ─────────────┼────────────────             │
│  │  09:00:00   │  完整快照    │  变更 Diff                 │
│  ├─────────────┤──────────────┼────────────────             │
│  │  2026-05-08 │  完整快照    │  变更 Diff                 │
│  │  10:00:00   │             │                            │
│  ├─────────────┤──────────────┼────────────────             │
│  │  2026-05-08 │  完整快照    │  变更 Diff                 │
│  │  11:00:00   │             │                            │
│  └─────────────┘──────────────┴────────────────             │
│                                                              │
│  Commit = 全量快照 + 时间戳 + 变更元数据                      │
│  Tag = 版本标记 (v2026-05-08-full / v2026-05-08-inc-3f)      │
│  Branch = 按时间段/项目/网关组织的快照分支                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心能力

### 1. 全量 Commit（Full Commit）

每个全量提交包含：

```
[Commit Message]
[FULL] 重要决策记录

📦 全量快照: 2026-05-08 09-00-00
🕐 时间戳: 2026-05-08T09:00:00+08:00
📊 仓库: main-memory-shared
🔖 Tag: v2026-05-08-full
```

**特点**：
- 每个版本 = 完整快照
- 任意时刻可完整恢复
- 每个全量提交都有 Tag 标记
- 适合重大决策、重要变更

### 2. 增量 Commit（Incremental Commit）

每个增量提交包含：

```
[Commit Message]
[INC] 更新配置

📈 增量更新: 2026-05-08 10-30-00
🕐 时间戳: 2026-05-08T10:30:00+08:00
📊 仓库: main-memory-shared
📝 变更: 3 文件 | +50 | -12
🔖 Tag: v2026-05-08-inc-3f
```

**特点**：
- 仅记录变更部分（Diff）
- 节省存储空间
- 清晰展示每次变更内容
- 适合日常更新、微调

### 3. 分支管理（Branch Management）

#### 快照分支（Ssnapshot Branches）

按时间自动创建快照分支：

```
snapshots/
├── snapshots/2026-05-08_09-00-00   # 9点的完整快照
├── snapshots/2026-05-08_10-30-00   # 10:30的完整快照
├── snapshots/2026-05-07_22-00-00   # 昨天的快照
└── snapshots/2026-05-01_10-00-00   # 五一节的快照
```

**用途**：
- `git checkout snapshots/2026-05-08_09-00-00` 查看当时状态
- 对比不同时间点的记忆内容
- 实验性修改不影响主线

#### 主题分支（Topic Branches）

按项目/主题创建分支：

```
project-xz-idmp/         # XZ-IDMP 项目记忆
project-water/           # 水体治理项目记忆
feature-ai-integration/  # AI 集成功能记忆
hotfix-critical/         # 紧急修复记忆
```

### 4. 时间回溯（Time Goto）

一键回到任意时间点的记忆状态：

```bash
# 回溯到指定日期
bash time-memory.sh timegoto main-memory-shared 2026-05-01

# 查看当时的所有记忆
git checkout <commit-hash>

# 返回当前
git checkout main
```

---

## 命令详解

### 全量提交（Full）

```bash
# 基本用法
bash time-memory.sh full <repo> "<message>"

# 示例
bash time-memory.sh full main-memory-shared "重大决策：采用微服务架构"
bash time-memory.sh full openclaw-1-memory-private "更新 CT O规则"
```

**执行流程**：
1. Stage 所有变更（`git add -A`）
2. 创建全量快照 Commit
3. 自动创建 Tag（`vYYYY-MM-DD-full`）
4. 推送到远程

### 增量提交（Incremental）

```bash
# 基本用法
bash time-memory.sh inc <repo> "<message>"

# 示例
bash time-memory.sh inc main-memory-shared "更新用户配置"
bash time-memory.sh inc business-memory-shared "新增客户信息"
```

**执行流程**：
1. Stage 所有变更（`git add -A`）
2. 计算变更统计（文件数、+/- 行数）
3. 创建增量 Commit
4. 自动创建 Tag（`vYYYY-MM-DD-inc-Nf`）
5. 推送到远程

### 创建快照（Snapshot）

```bash
# 为仓库创建时间戳快照分支
bash time-memory.sh snap main-memory-shared

# 输出
✅ 快照创建完成
  分支: snapshots/2026-05-08_09-30-00
  时间: 2026-05-08_09-30-00
  用途: git checkout snapshots/2026-05-08_09-30-00 查看该时间点状态
```

**用途**：
- 重要操作前创建快照
- 每日自动快照
- 方便回溯和对比

### 时间回溯（Time Goto）

```bash
# 回溯到指定日期
bash time-memory.sh timegoto main-memory-shared 2026-05-01

# 示例输出
✅ 已回溯到 2026-05-01
  ⚠️  当前处于 detached HEAD 状态
  提交: a1b2c3d
  日期: 2026-05-01 10:30:00

  恢复到原分支: git checkout main
```

### 查看历史（History）

```bash
# 查看最近 10 条
bash time-memory.sh history main-memory-shared

# 查看最近 20 条
bash time-memory.sh history main-memory-shared 20

# 示例输出
▸ a1b2c3d | 2026-05-08 | [FULL] 重大决策记录
▸ b2c3d4e | 2026-05-08 | [INC] 更新配置
▸ c3d4e5f | 2026-05-08 | [FULL] 初始快照
```

### 版本对比（Diff）

```bash
# 对比最近两次提交
bash time-memory.sh diff main-memory-shared HEAD~1 HEAD

# 对比两个特定版本
bash time-memory.sh diff main-memory-shared v2026-05-01-full v2026-05-08-full

# 对比任意两个 commit
bash time-memory.sh diff main-memory-shared abc123 def456
```

### 时间线视图（Log）

```bash
# 查看完整时间线
bash time-memory.sh log main-memory-shared

# 输出
═══ 时间线 ═══

* a1b2c3d 2026-05-08 [FULL] 重大决策记录 (HEAD -> main)
* b2c3d4e 2026-05-08 [INC] 更新配置
* c3d4e5f 2026-05-08 初始快照
│
◆ 快照分支: snapshots/2026-05-08_09-00-00
◆ 快照分支: snapshots/2026-05-07_22-00-00

═══ 版本标签 ═══

  v2026-05-08-full  全量快照
  v2026-05-08-inc-3f 增量更新
```

### 垃圾回收（GC）

```bash
# 清理单个仓库
bash time-memory.sh gc main-memory-shared

# 清理前
  清理前: 45MB

# 清理后
  清理后: 12MB
  ✅ 清理完成
```

---

## 最佳实践

### 1. 何时使用全量提交？

| 场景 | 原因 |
|------|------|
| 重大决策 | 需要完整历史记录 |
| 项目启动 | 建立基线 |
| 架构变更 | 需要能回滚 |
| 每日总结 | 完整的日终快照 |

### 2. 何时使用增量提交？

| 场景 | 原因 |
|------|------|
| 配置文件更新 | 变更较小 |
| 文档调整 | 仅文字修改 |
| 小功能添加 | 变更可控 |
| Bug 修复 | 快速记录 |

### 3. 快照分支策略

```
日常快照：每日 9:00 自动创建
重大变更前：手动创建快照
实验性修改：新分支进行
```

### 4. 版本标签规范

| 标签格式 | 含义 |
|----------|------|
| `v2026-05-08-full` | 2026年5月8日全量快照 |
| `v2026-05-08-inc-3f` | 2026年5月8日增量（3文件） |
| `v2026-05-08-inc-10f` | 2026年5月8日增量（10文件） |

---

## 与 Git 版本控制的对比

| 特性 | 传统 Git | 时间记忆 |
|------|---------|----------|
| 提交单位 | 任意变更 | 可选择全量或增量 |
| 时间戳 | 依赖系统时间 | 每个提交自动记录 |
| 版本标记 | 手动 Tag | 自动 Tag（时间+类型） |
| 历史回溯 | `git log` | 时间 + 可视化 |
| 分支策略 | 通用 | 按时间/项目/网关 |
| 快照能力 | 无自动快照 | 自动时间戳快照 |

---

## 与现有系统的集成

### 1. 与 sync-memory.sh 的关系

```
time-memory.sh  →  专注于时间记忆能力
sync-memory.sh   →  专注于跨仓库同步
```

两者可以配合使用：
```bash
# 1. 先创建时间戳快照
bash time-memory.sh snap main-memory-shared

# 2. 再同步到远程
bash sync-memory.sh
```

### 2. 与记忆宫殿的集成

每个记忆宫殿可以独立使用时间记忆：

```
~/.openclaw/memory-palace/      # OpenClaw 记忆宫殿
├── L1_CORE/
├── L2_BUSINESS/
└── .git/                        # 有 Git 版本控制

# 使用时间记忆
cd ~/.openclaw/memory-palace
bash time-memory.sh full L1_CORE "更新核心规则"
```

---

## API 参考

### 脚本调用

```bash
# 导入为函数
source time-memory.sh

# 调用函数
cmd_full "main-memory-shared" "更新配置"
cmd_inc "business-memory-shared" "新增客户"
cmd_snap "openclaw-1-memory-private"
```

### 返回值

| 函数 | 成功 | 失败 |
|------|------|------|
| `cmd_full` | 0 | 1 |
| `cmd_inc` | 0 | 1 |
| `cmd_snap` | 0 | 1 |
| `cmd_branch` | 0 | 1 |
| `cmd_timegoto` | 0 | 1 |
| `cmd_history` | 0 | 1 |
| `cmd_diff` | 0 | 1 |
| `cmd_log` | 0 | 1 |
| `cmd_gc` | 0 | 1 |

---

## 故障排除

### 问题：Tag 创建失败

**原因**：Tag 已存在

**解决**：
```bash
# 删除旧 Tag
git tag -d v2026-05-08-full

# 重新创建
bash time-memory.sh full main-memory-shared "新快照"
```

### 问题：时间回溯后无法返回

**原因**：忘记原分支名

**解决**：
```bash
# 查看所有分支
git branch -a

# 切回主分支
git checkout main
```

### 问题：增量提交没有检测到变更

**原因**：文件未在 Git 管理下

**解决**：
```bash
# 添加文件到 Git
git add -A
git status
```

---

## 未来规划

- [x] `time-travel` - 可视化时间线工具
- [x] `time-compare` - 多版本对比工具
- [x] `time-alert` - 变更提醒（Webhook）
- [x] `time-backup` - 自动备份到多个仓库
- [x] `time-insight` - 记忆演变分析报告

---

**文档版本**: v1.0 | **更新日期**: 2026-05-08