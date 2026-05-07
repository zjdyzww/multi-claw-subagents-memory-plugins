# Memory Sync Protocol v1.0

> 多智能体记忆同步协议

## 概述

本协议定义了多智能体环境下记忆仓库的同步机制，确保所有智能体能够高效、一致地共享和更新记忆。

## 同步模式

### 1. 拉取模式 (Pull)

智能体从远程仓库获取最新变更：

```bash
git fetch origin
git pull --rebase origin main
```

### 2. 推送模式 (Push)

智能体将本地变更推送到远程仓库：

```bash
git add .
git commit -m "Sync: [变更描述]"
git push origin main
```

### 3. 双向模式 (Bidirectional)

先拉取再推送，确保本地和远程同步：

```bash
git pull --rebase origin main
git add .
git commit -m "Sync: [变更描述]"
git push origin main
```

## 同步策略

### 默认策略：Rebase

使用 `git pull --rebase` 而非 `git pull --merge`，保持线性历史。

### 冲突处理策略

| 策略 | 适用场景 | 说明 |
|------|----------|------|
| timestamp | 日常同步 | 以最近修改为准 |
| priority | 重要决策 | 以智能体优先级决定 |
| manual | 复杂冲突 | 需要人工介入 |

### 智能体优先级

| 智能体 | 优先级 | 说明 |
|--------|--------|------|
| OpenClaw | 100 | 最高优先级 |
| Hermes | 80 | 次高优先级 |
| Claude Code | 60 | 中优先级 |
| OpenCode | 60 | 中优先级 |
| 其他 | 50 | 默认优先级 |

## 同步频率

| 场景 | 建议频率 | 说明 |
|------|----------|------|
| 实时同步 | 按需 | 重要变更立即同步 |
| 定时同步 | 5-15分钟 | 常规记忆更新 |
| 手动同步 | 不限期 | 仅当需要时同步 |

## 冲突检测

### 触发条件

- 本地和远程同时修改同一文件
- 删除操作与修改操作冲突
- 重命名操作冲突

### 检测流程

```
1. git fetch 获取远程最新状态
2. 比较本地 SHA 与远程 SHA
3. 如相同 → 无冲突，无需处理
4. 如不同 → 进入冲突检测
5. git pull 触发合并
6. 检查是否有 conflicted 文件
```

## 冲突解决

### 自动解决

对于简单冲突（如两个独立的修改），自动合并：

```javascript
if (conflictType === 'modify-modify') {
  if (isNonOverlappingChange(localChange, remoteChange)) {
    await autoMerge();
  }
}
```

### 手动解决

对于语义冲突或复杂冲突：

1. 标记冲突文件
2. 通知相关智能体
3. 等待人工决策
4. 应用解决结果

## 安全机制

### 仓库签名

所有提交使用 GPG 签名，确保来源可信：

```bash
git commit -S -m "message"
git push --signed origin main
```

### 权限控制

- 公共仓库：所有智能体可读写
- 私有仓库：仅创建者可读写

### 敏感信息过滤

`.private/` 目录下的文件不会同步到公共仓库。

## 事件通知

同步完成后发布事件：

```json
{
  "type": "memory.synced",
  "agentId": "openclaw",
  "repoType": "main",
  "payload": {
    "success": true,
    "pulled": 3,
    "pushed": 1
  },
  "timestamp": "2026-05-08T00:00:00Z"
}
```

## 最佳实践

1. **小步提交**：每次提交只包含一个逻辑变更
2. **清晰描述**：提交消息应清晰说明变更内容
3. **及时同步**：重要变更应尽快同步，避免积累冲突
4. **定期整理**：定期清理无用记忆，保持仓库整洁
5. **文档优先**：添加新知识前先更新索引

## 变更历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0 | 2026-05-08 | 初始版本 |
