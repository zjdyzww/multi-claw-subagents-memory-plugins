# Conflict Resolution Protocol v1.0

> 多智能体记忆冲突解决协议

## 概述

当多个智能体同时修改同一记忆时，可能产生冲突。本协议定义了冲突的分类、检测和解决机制。

## 冲突分类

### 1. 修改-修改冲突 (Modify-Modify)

**场景**：两个智能体同时修改同一文件的不同部分或相同部分。

**示例**：
- 智能体 A 修改了文件的第 10-20 行
- 智能体 B 修改了文件的第 15-25 行
- 产生重叠区域冲突

**检测**：
```bash
git fetch origin
git log origin/main..HEAD --oneline  # 本地提交
git log HEAD..origin/main --oneline   # 远程提交
```

### 2. 删除-修改冲突 (Delete-Modify)

**场景**：一个智能体删除文件，另一个智能体修改该文件。

**示例**：
- 智能体 A 删除了 `old-feature.md`
- 智能体 B 修改了 `old-feature.md` 的内容

### 3. 重命名-修改冲突 (Rename-Modify)

**场景**：一个智能体重命名文件，另一个智能体修改原文件。

## 冲突级别

| 级别 | 名称 | 说明 | 处理方式 |
|------|------|------|----------|
| 1 | 轻微 | 非重叠修改 | 自动合并 |
| 2 | 中等 | 重叠但可解析 | 自动解决或提示 |
| 3 | 严重 | 语义冲突 | 手动解决 |

## 自动解决策略

### 1. 时间戳策略 (Timestamp)

以时间戳最新的修改为准：

```javascript
function resolveByTimestamp(local, remote) {
  if (local.timestamp > remote.timestamp) {
    return local;
  }
  return remote;
}
```

### 2. 优先级策略 (Priority)

以智能体优先级决定：

```javascript
const PRIORITY = {
  'openclaw': 100,
  'hermes': 80,
  'claude-code': 60,
  'opencode': 60
};

function resolveByPriority(local, remote) {
  if (PRIORITY[local.agent] > PRIORITY[remote.agent]) {
    return local;
  }
  return remote;
}
```

### 3. 智能合并策略 (Smart Merge)

对于文本文件，尝试智能合并：

```bash
git merge-file --union file1 file2 file3
```

## 手动解决流程

```
┌─────────────────────────────────────────────────────────┐
│                  Conflict Resolution Flow                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 检测冲突                                             │
│     └── git status → 发现 conflicted files               │
│                                                          │
│  2. 分析冲突                                             │
│     ├── 查看本地修改 (git diff --base)                   │
│     ├── 查看远程修改 (git diff --theirs)                 │
│     └── 查看共同祖先 (git diff --merge)                   │
│                                                          │
│  3. 决定解决方案                                         │
│     ├── 保留本地版本 (--ours)                            │
│     ├── 保留远程版本 (--theirs)                          │
│     └── 手动合并                                         │
│                                                          │
│  4. 标记解决                                             │
│     └── git add resolved-file                            │
│                                                          │
│  5. 提交解决                                             │
│     └── git commit (自动生成合并提交消息)                  │
│                                                          │
│  6. 推送解决                                             │
│     └── git push origin main                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 冲突标记格式

Git 在冲突文件中添加以下标记：

```markdown
<<<<<<< HEAD:filename.md
本地修改内容
=======
远程修改内容
>>>>>>> remote-branch:filename.md
```

## 解决命令参考

### 查看冲突

```bash
# 列出所有冲突文件
git diff --name-only --diff-filter=U

# 查看冲突详情
git diff --base filename.md
git diff --theirs filename.md
git diff --ours filename.md
```

### 解决冲突

```bash
# 保留本地版本
git checkout --ours filename.md
git add filename.md

# 保留远程版本
git checkout --theirs filename.md
git add filename.md

# 手动编辑后添加
vim filename.md
git add filename.md
```

## 通知机制

冲突解决后，通知相关智能体：

```json
{
  "type": "conflict.resolved",
  "agentId": "openclaw",
  "payload": {
    "file": "shared/rules.md",
    "resolution": "merged",
    "resolvedBy": "openclaw",
    "resolvedAt": "2026-05-08T00:00:00Z"
  }
}
```

## 预防措施

1. **分区隔离**：不同智能体操作不同文件区域
2. **锁机制**：操作前锁定文件，完成后解锁
3. **小步提交**：减少单次提交的变更范围
4. **及时同步**：减少积累冲突的可能性

## 最佳实践

1. 冲突发生后保持冷静，按照本协议流程处理
2. 重要文件修改前先同步最新版本
3. 无法解决的冲突及时上报人工介入
4. 解决后测试验证，确保语义正确
