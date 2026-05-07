# Example Memory — 记忆文件示例

> 直接复制此模板到 `~/.hermes/memories/MEMORY.md` 使用

---

## ◆ L1 — 核心结论（必须记住）

1. **[公司/身份]**: 示例公司 — 科技创业公司，核心方向 AI + 硬件
2. **[用户偏好]**: 中文为主 · Cybertruck 工业风 · 简洁直接不废话 · 结论先行
3. **[战略方向]**: 人形机器人研发 + 智能制造解决方案
4. **[关键约束]**: 早期创业，预算有限（单项 < 50万需审批），团队 5 人
5. **[工具配置]**: Hermès Agent · Claude Code · Gitea · Docker · Node.js
6. **[业务主线A]**: 人形机器人 — 研发阶段，目标是 6 个月内出原型
7. **[业务主线B]**: 智能制造 — 已签第一个客户，交付周期 3 个月
8. **[Gitea同步]**: https://git.osc.life/myz/memory-agent · 每天 10:00/22:00

---

## ◆ L2 — 业务主线

### 主线A: 人形机器人

| 项目 | 内容 |
|------|------|
| 目标 | 6 个月出原型，12 个月商业化 |
| 关键参数 | 自由度 30+ · 成本 < 10万 · 续航 4h |
| 当前状态 | 研发中（概念验证阶段） |
| 里程碑 | Q2 完成结构设计，Q3 出原型 |
| 负责人 | CTO（兼） |
| 关联文件 | ~/robot-projects/humanoid/ |

### 主线B: 智能制造解决方案

| 项目 | 内容 |
|------|------|
| 目标 | 第一个客户交付，建立行业案例 |
| 关键参数 | 合同额 80万 · 毛利 40% · 交付周期 3 个月 |
| 当前状态 | 项目启动中 |
| 里程碑 | 第 8 周完成 UAT，第 12 周交付 |
| 负责人 | CEO（兼） |
| 关联文件 | ~/robot-projects/smart-manufacturing/ |

---

## ◆ L3 — 环境配置

### 工具链

| 工具 | 路径/命令 | 用途 |
|------|-----------|------|
| Hermès | /usr/local/bin/hermes | AI Agent 主程序 |
| Claude Code | claude-code | 代码生成和审查 |
| Docker | docker ps | 容器管理 |
| Node.js | ~/.nvm/versions/node/v22/bin/node | 运行时环境 |
| Python | python3 | 脚本和自动化 |

### 账号凭证

| 平台 | 账户 | 备注 |
|------|------|------|
| Gitea | myz / token-file | 自建 Git 服务 |
| Docker Hub | myz/docker | 镜像仓库 |
| OpenAI | api-key-file | GPT API |

### 运行环境

```markdown
- OS: Ubuntu 22.04 LTS
- Node.js: v22.12.0 → ~/.nvm/versions/node/v22.12.0/bin/
- Python: 3.10.12 → /usr/bin/python3
- Docker: 24.0.7
- 代理: 127.0.0.1:7890 (Clash)
```

---

## ◆ L4 — 文件索引

### 项目目录

| 目录/文件 | 说明 |
|-----------|------|
| ~/robot-projects/ | 所有机器人项目根目录 |
| ~/robot-projects/humanoid/ | 人形机器人研发 |
| ~/robot-projects/smart-manufacturing/ | 智能制造项目 |
| ~/hermes-memory/ | 记忆仓库本地克隆 |
| ~/.hermes/memories/ | 本地记忆文件 |
| ~/.hermes/skills/ | Skills 技能目录 |

### Gitea 仓库

| 仓库 | 地址 | 用途 |
|------|------|------|
| memory-agent | https://git.osc.life/myz/memory-agent | 核心记忆 |
| memory-agent-plugins | https://git.osc.life/myz/memory-agent-plugins | 技能包 |
| humanoid-robot | https://git.osc.life/myz/humanoid-robot | 人形机器人代码 |

### Skills

| Skill 名称 | 路径 | 用途 |
|-----------|------|------|
| dual-thinking | ~/.hermes/skills/productivity/dual-thinking/SKILL.md | 双系统思考 |
| memory-manager | ~/.hermes/skills/productivity/memory-manager/SKILL.md | 记忆管理 |

---

## 版本历史

参见 `VERSION_INDEX.md`，最近更新：

```
v5 — 2026-05-07 双系统思考规则 + 版本索引
v4 — 2026-05-07 金字塔结构重构
v3 — 2026-05-06 同步记忆
v2 — 2026-05-05 用户偏好更新
v1 — 2026-05-04 初始记忆
```

---

*示例文件版本: v1 | 2026-05-07*
*替换此模板内容为实际信息后使用*
