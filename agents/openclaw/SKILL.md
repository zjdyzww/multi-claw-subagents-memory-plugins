---
name: memory-palace-openclaw
category: productivity
version: v2.0
date: 2026-05-10
trigger: 自动加载
tags: [记忆宫殿, 双系统, Gitea集成, Label自动化, PR共享]
---

# OpenClaw 记忆宫殿技能 v2.0

> 基于 go-gitea/gitea + giteabot 生态优化

## Gitea 集成能力 (v2.0 新增)

### Label 自动化映射

```
🟢 CONFIRMED  → gitea label: confidence/confirmed (color: 3fb950)
🟡 LIKELY     → gitea label: confidence/likely    (color: d29922)
🔴 UNCERTAIN  → gitea label: confidence/uncertain  (color: f85149)
```

### PR 共享机制 (giteabot 风格)

```
Agent A 强化记忆 → 推送私有仓 + 创建 PR 到共享仓
    ↓
Agent B/C/D 通过 PR review 验证置信度 (LGTM 模式)
    ↓
≥2 个 agent 确认 → 自动合并到共享仓 → 广播到所有网关
```

### 定时任务调度

```
10:00 → 全量同步 (git-sync.ts startScheduledSync)
14:00 → 增量同步 + 残差清理 (residual-engine periodic check)
18:00 → Label 维护 (移除过时标签, 自动标注)
22:00 → 全量同步 + 演变分析 (time-insight 报告)
```

## 核心功能

### memory.save — 保存记忆

```typescript
{
  repo: 'main' | 'business' | 'code' | 'openclaw',
  path: string,
  content: string,
  confidence?: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN',
  labels?: string[],           // 自动映射置信度 label
  createPr?: boolean           // 是否创建 PR 到共享仓
}
```

### memory.search — 搜索记忆

```typescript
{
  query: string,
  strategy?: 'direct' | 'parallel' | 'iterative',  // 自适应路由
  filterByLabel?: string[],   // Gitea label 过滤
  filterByMilestone?: string  // Gitea milestone 过滤
}
```

### memory.sync — 同步 (增强)

```typescript
{
  direction?: 'pull' | 'push' | 'both',
  createBackport?: boolean,   // giteabot 风格 backport
  autoLabel?: boolean,        // 自动 label 维护
  notifyWebhook?: string      // Webhook 通知 URL
}
```

### memory.annotate — 置信度标注 (新增)

```typescript
{
  docId: string,
  level: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN',
  source: string,             // 标注来源 agent
  applyLabel?: boolean        // 同步到 Gitea label
}
```

## 三代理管道 + Gitea 集成

```
User 对话
  │
  ▼
System2 (海绵全量捕获) → 119 facts
  │
  ▼
System1 (淘金精炼) → 108 facts, 🟢🟡🔴 标注
  │
  ▼
FullMemory (持久化) → MEMORY.md
  │
  ├──→ Gitea 私有仓 (自动 push)
  │
  ├──→ confidence/* labels (Gitea 自动标注)
  │
  ├──→ PR → 共享仓 (≥2 agent LGTM 后合并)
  │
  └──→ Webhook 通知 (time-alert 企微/钉钉)
```

## Gitea API 端点

| 操作 | 端点 |
|------|------|
| 创建 label | `POST /api/v1/repos/{org}/{repo}/labels` |
| 添加 label 到 issue | `POST /api/v1/repos/{org}/{repo}/issues/{num}/labels` |
| 创建 milestone | `POST /api/v1/repos/{org}/{repo}/milestones` |
| 创建 PR | `POST /api/v1/repos/{org}/{repo}/pulls` |
| 获取 webhook | `GET /api/v1/repos/{org}/{repo}/hooks` |
| 触发 action | `POST /api/v1/repos/{org}/{repo}/actions/runs` |

## 安装后初始化

```bash
# 1. 初始化 Gitea labels
curl -X POST https://git.osc.life/api/v1/repos/claws-memory/opencode-1-memory-private/labels \
  -H "Authorization: token <TOKEN>" \
  -d '{"name":"confidence/confirmed","color":"3fb950"}'

# 2. 创建 milestone
curl -X POST https://git.osc.life/api/v1/repos/claws-memory/opencode-1-memory-private/milestones \
  -H "Authorization: token <TOKEN>" \
  -d '{"title":"v13.0 Academy","description":"记忆强化框架 v13.0"}'

# 3. 启动定时同步
node -e "require('@multi-claw/shared-memory-core').gitSyncManager.startScheduledSync()"

# 4. 配置 Webhook (time-alert)
bash scripts/time-memory.sh time-alert opencode-1-memory-private <WEBHOOK_URL>
```

---

*OpenClaw 记忆宫殿技能 v2.0 | 基于 go-gitea/gitea + giteabot 生态 | 2026-05-10*
