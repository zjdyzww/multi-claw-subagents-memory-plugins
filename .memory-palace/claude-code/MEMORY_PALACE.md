# Claude Code 记忆宫殿规则 v2.0

> **版本**: v2.0 | **日期**: 2026-05-10  
> **适用**: Claude Code (coder 角色)  
> **模式**: FullMemory Agent **Server** 端 — 远程同步 + 跨网关广播

---

## 1. Claude Code 记忆系统架构 (Server 模式)

### 1.1 全量代理 Server 端

```
Claude Code 进程
    │
    ├── System2 (海绵捕获)
    ├── System1 (淘金精炼)
    │
    └── FullMemory Agent Server ← 核心
         ├── Git 远程同步 (push/pull Gitea)
         ├── 跨网关广播 (EventBus)
         ├── 定时同步 (任务完成 + 22:00)
         └── Gitea Label 维护
```

### 1.2 记忆目录结构

```
~/.claude/
├── agent-memory/               # 智能体记忆
│   ├── xz-backend-dev/
│   ├── xz-frontend-dev/
│   └── xz-devops/
├── projects/                   # 项目上下文
├── skills/                     # 技能
└── server-state/              # Server 状态
    ├── sync-status.json
    ├── broadcast-log.json
    └── label-cache.json
```

---

## 2. Server 端配置

### 2.1 Gitea 远程同步

```yaml
fullmemory_server:
  mode: server
  gitea:
    private_repo: claude-code-1-memory-private
    shared_repos:
      - code-memory-shared
      - main-memory-shared
    token_env: GITEA_TOKEN
    
  sync:
    on_task_complete: true
    scheduled:
      - time: "18:00"
        action: label_maintenance
      - time: "22:00"
        action: full_sync
        
  broadcast:
    targets: [openclaw, hermes, opencode]
    events: [task_complete, code_commit, pattern_discovered]
```

### 2.2 EventBus 配置

```yaml
event_bus:
  subscribe:
    - event: agent.online
      from: [openclaw, hermes, opencode]
    - event: memory.synced
      from: [openclaw]
      
  publish:
    - event: task_complete
      to: [openclaw, hermes]
    - event: code_commit
      to: [opencode]
```

---

## 3. 记忆宫殿规则 (Looms)

### 3.1 核心 Loom (L1)

| Loom | 位置 | 内容 |
|------|------|------|
| **角色** | Server 端 | coder, reviewer, architect |
| **排他规则** | Gitea label: confidence/confirmed | 不破坏、不泄露 |
| **编码规范** | skills/ | Java/Vue3/React 规范 |

### 3.2 业务 Loom (L2) — Gitea Label 标注

| Loom | Position | 关键词 |
|------|----------|--------|
| **后端** | xz-backend-dev/ | Java, Spring Boot |
| **前端** | xz-frontend-dev/ | Vue3, React |
| **运维** | xz-devops/ | Docker, CI/CD |

---

## 4. Server 端特有操作

### 4.1 远程同步 (每任务完成)

```bash
# 任务完成即时同步 + 广播
memory.sync --direction push --broadcast

# 定时全量同步
memory.sync --repos all --direction both
```

### 4.2 跨网关广播

```bash
# 通知 OpenClaw 任务完成
memory.broadcast --event task_complete --payload '{"task":"XZ-IDMP"}'

# 通知 OpenCode 代码提交
memory.broadcast --event code_commit --payload '{"repo":"code","files":15}'
```

### 4.3 Gitea Label 维护

```bash
# 自动标注置信度
curl -X POST https://git.osc.life/api/v1/repos/claws-memory/claude-code-1-memory-private/labels \
  -H "Authorization: token <TOKEN>" \
  -d '{"name":"confidence/confirmed","color":"3fb950"}'
```

---

## 5. 安装后初始化

### 5.1 首次安装 (Server 模式)

```bash
# 1. 复制记忆宫殿
cp -r .memory-palace/claude-code/* ~/.claude/agent-memory/

# 2. 初始化 Gitea 仓库 (Server 端)
cd ~/.claude
git clone https://git.osc.life/claws-memory/claude-code-1-memory-private.git agent-memory/

# 3. 配置 Server 环境变量
export GITEA_TOKEN=<TOKEN>
export AGENT_MODE=server
export AGENT_NAME=claude-code

# 4. 初始化 Gitea labels
node -e "
const https = require('https');
['confidence/confirmed','confidence/likely','confidence/uncertain'].forEach(name => {
  const req = https.request({
    hostname: 'git.osc.life',
    path: '/api/v1/repos/claws-memory/claude-code-1-memory-private/labels',
    method: 'POST',
    headers: {'Authorization': 'token ' + process.env.GITEA_TOKEN, 'Content-Type': 'application/json'}
  });
  req.write(JSON.stringify({name, color: name.includes('confirmed')?'3fb950':name.includes('likely')?'d29922':'f85149'}));
  req.end();
});
"

# 5. 启动 FullMemory Agent Server
node -e "
const { FullMemoryAgentServer, gitSyncManager, eventBus } = require('@multi-claw/shared-memory-core');
const server = new FullMemoryAgentServer('claude-code', 'claude-code', gitSyncManager, eventBus);
// 启动定时同步
gitSyncManager.startScheduledSync();
console.log('FullMemory Agent Server started (claude-code)');
"
```

### 5.2 同步命令

```bash
# 同步 + 广播
bash scripts/sync-memory.sh

# 查看 Server 状态
cat ~/.claude/server-state/sync-status.json
```

---

*Claude Code 记忆宫殿规则 v2.0 | FullMemory Agent Server | 2026-05-10*
