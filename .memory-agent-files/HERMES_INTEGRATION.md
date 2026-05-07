# Hermès Agent Integration Guide — Hermès 集成指南

> 如何在 Hermès Agent 中配置和使用记忆强化代理插件

---

## 快速开始（5分钟）

### Step 1: 创建 Gitea 记忆仓库

```bash
# 在 Gitea 上创建仓库
# 仓库名: memory-agent（或其他名称）
# 访问: https://git.osc.life/{your-username}/memory-agent

# 本地克隆
git clone https://git.osc.life/{your-username}/memory-agent.git ~/memory-agent
cd ~/memory-agent

# 创建初始文件
cat > MEMORY.md << 'EOF'
# Memory Index — 记忆索引结构

## ◆ L1 — 核心结论（必须记住）

1. **[公司/身份]**: [填写]
2. **[用户偏好]**: [填写]
...（使用 MEMORY_INDEX.md 模板）
EOF

git add -A
git commit -m "Memory v1 — initial"
git push origin main
```

### Step 2: 配置 Gitea Token

```bash
# 保存 token（如果没有）
echo "your-gitea-token" > ~/.git.osc.life.token

# 验证
curl -s -H "Authorization: token $(cat ~/.git.osc.life.token)" \
  https://git.osc.life/api/v1/user | jq .login
```

### Step 3: 创建同步 Cron 任务

```bash
# 创建每天 10:00 和 22:00 的同步任务
hermes cron create \
  --name "memory-sync-gitea" \
  --schedule "0 10,22 * * *" \
  --prompt "执行记忆同步：
1. 读取 ~/.hermes/memories/MEMORY.md
2. cd ~/memory-agent
3. cp ~/.hermes/memories/*.md .
4. git add -A && git commit -m \"Memory \$(date '+%Y-%m-%d %H:%M')\" && git push origin main
5. 返回同步结果" \
  --skills "memory-manager"
```

### Step 4: 注册 Agent Prompt

将 `AGENT_PROMPT.md` 的全部内容：
1. 复制到 Hermès Agent 的自定义 System Prompt 配置中
2. 或通过 `hermes config set system.prompt "$(cat AGENT_PROMPT.md)"`

### Step 5: 启用 Skills

```bash
# 确认 dual-thinking skill 已存在
ls ~/.hermes/skills/productivity/dual-thinking/

# 确认 memory-manager skill 已存在
ls ~/.hermes/skills/productivity/memory-manager/
```

---

## 完整配置检查清单

```
[ ] Gitea 记忆仓库已创建并推送
[ ] Token 已保存到 ~/.git.osc.life.token
[ ] memory-sync-gitea cron 任务已创建
[ ] dual-thinking skill 已加载
[ ] memory-manager skill 已加载
[ ] AGENT_PROMPT.md 内容已注册为 System Prompt
[ ] 本地 MEMORY.md 已初始化
[ ] 首次对话已触发记忆更新
```

---

## 目录结构

集成完成后，完整目录结构：

```
~/.hermes/
├── memories/
│   ├── MEMORY.md          # 核心记忆（L1-L4，金字塔）
│   ├── USER.md            # 用户画像（L1-L4）
│   └── HERMES_MEMORY.md   # Hermès 配置备份
├── skills/
│   └── productivity/
│       ├── dual-thinking/
│       │   └── SKILL.md
│       └── memory-manager/
│           └── SKILL.md
└── config.yaml            # Hermès 配置

~/memory-agent/            # Gitea 同步仓库
├── MEMORY.md
├── USER.md
├── THINKING_RULES.md
├── VERSION_INDEX.md
└── README.md

~/.git.osc.life.token      # Gitea API Token
```

---

## 工作流验证

### 验证 System 1 工作

```bash
# 发送一个简单查询
hermes send "你好，介绍一下你自己"

# 期望：< 3 秒响应，< 200 字，结论先行
# 如果触发了深度分析，说明 System 1 判定有问题
```

### 验证 System 2 工作

```bash
# 发送一个复杂问题
hermes send "帮我分析一下我们公司的战略方向，需要结合技术、市场、竞争多个维度"

# 期望：60 秒内，结构化报告，L1 结论前置
# 应该读取 Gitea 全量记忆
```

### 验证记忆更新

```bash
# 触发记忆更新（告诉 Agent 一些新信息）
hermes send "我以后希望这部分用英文回复，技术文档保持中英双语"

# 检查本地 MEMORY.md 是否更新
grep -n "英文" ~/.hermes/memories/MEMORY.md

# 检查是否在下次 cron 时推送到 Gitea
# 或手动触发同步
cd ~/memory-agent && git log --oneline -3
```

### 验证 Gitea 同步

```bash
# 查看最近的 commit
cd ~/memory-agent && git log --oneline -5

# 查看文件状态
git status

# 如果有未同步的变更，手动 push
git add -A && git commit -m "Manual sync" && git push
```

---

## 故障排除

### 问题：Cron 同步失败

```bash
# 检查 cron 任务状态
hermes cron list

# 手动运行一次
hermes cron run memory-sync-gitea

# 检查错误日志
hermes logs --tail 50
```

### 问题：System 2 一直不触发

检查 `dual-thinking` skill 是否正确加载：
```bash
skill_view(name='dual-thinking')
```

确认触发条件是否满足。

### 问题：MEMORY.md 超出 ~2200 字

```bash
# 检查字数
wc -c ~/.hermes/memories/MEMORY.md

# 如果超限，压缩 L3/L4
# 原则：优先外置到文件索引
# L1/L2 必须保留完整性
```

### 问题：Gitea 版本冲突

```bash
# 查看本地和远程差异
cd ~/memory-agent && git fetch origin && git diff main origin/main

# 如果有冲突，保留本地版本（对话最新）
git reset --hard origin/main  # 先拉取远程
# 然后重新应用本地变更
```

---

## 升级记忆插件包

```bash
# 克隆最新插件包
git clone https://git.osc.life/myz/memory-agent-plugins.git /tmp/plugins

# 对比本地版本
diff ~/.hermes/skills/productivity/dual-thinking/SKILL.md \
     /tmp/plugins/SKILL_DUAL_THINKING.md

# 更新 skill
cp /tmp/plugins/SKILL_DUAL_THINKING.md \
   ~/.hermes/skills/productivity/dual-thinking/SKILL.md

# 更新记忆模板
cp /tmp/plugins/MEMORY_INDEX.md ~/memory-agent/

# 提交变更
cd ~/memory-agent
git add -A && git commit -m "Upgrade memory-agent-plugins to latest" && git push
```

---

## 自定义配置

### 调整 System 2 触发条件

编辑 `~/.hermes/skills/productivity/dual-thinking/SKILL.md` 中的触发条件部分。

### 调整金字塔层级

编辑 `~/.hermes/memories/MEMORY.md` 的 L1-L4 结构。

### 调整同步节奏

```bash
# 修改 cron 任务
hermes cron update memory-sync-gitea --schedule "0 8,20 * * *"
```

### 添加更多 Skills

参考 `SKILL_DUAL_THINKING.md` 和 `SKILL_MEMORY_MANAGER.md` 的格式创建新 Skill：
```bash
mkdir -p ~/.hermes/skills/{category}/{skill-name}/
# 创建 SKILL.md
```

---

*集成指南版本: v1 | 2026-05-07*
*适用于 Hermès Agent*
