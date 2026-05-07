# Multi-Claw Memory Plugins 安装指南

> **版本**: v3.0  
> **日期**: 2026-05-08  
> **安装时间**: < 5 分钟

---

## 零配置安装

> 参考 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) 的一次安装模式设计

### 方法一：复制提示词（推荐）

复制以下提示词到任何 LLM Agent 对话中，即可自动完成安装：

```
Install and configure multi-claw-subagents-memory-plugins by following the instructions here:
https://raw.githubusercontent.com/code-yeongyu/multi-claw-subagents-memory-plugins/main/docs/INSTALL.md
```

### 方法二：手动安装脚本

```bash
# 标准安装
bash <(curl -sL https://git.osc.life/myz/multi-claw-subagents-memory-plugins/raw/main/scripts/install.sh) \
  --plugins-url https://git.osc.life/myz/multi-claw-subagents-memory-plugins \
  --gitserver-url https://git.osc.life \
  --gitserver-token YOUR_GIT_TOKEN

# 自定义参数
bash install.sh \
  --plugins-url <插件源码仓库URL> \
  --gitserver-url <Git服务器URL> \
  --gitserver-token <Git服务器Token> \
  --group claws-memory \
  --agents openclaw,hermes,claude-code,opencode \
  --local-path ~/.openclaw/memory-plugins
```

### 方法三：LLM Agent 命令行

如果你是 LLM Agent，直接理解以下命令并执行：

```
add multi-claw-subagents-memory-plugins where plugins-url=https://git.osc.life/myz/multi-claw-subagents-memory-plugins gitserver-url=https://git.osc.life gitserver-token=<YOUR_TOKEN>
```

---

## 参数说明

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `plugins-url` | ✅ | 插件源码仓库地址 | `https://git.osc.life/myz/multi-claw-subagents-memory-plugins` |
| `gitserver-url` | ✅ | Git 服务器地址 | `https://git.osc.life` |
| `gitserver-token` | ✅ | Git 服务器访问令牌 | `gho_xxxxxxxxxxxx` |
| `group` | ❌ | 组织/组名，默认 `claws-memory` | `my-org-memory` |
| `agents` | ❌ | 智能体列表，默认 `openclaw,hermes,claude-code,opencode` | `openclaw,hermes` |
| `local-path` | ❌ | 本地安装路径 | `~/.openclaw/memory-plugins` |

---

## 安装流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    Installation Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1️⃣  解析参数                                                   │
│      └── plugins-url, gitserver-url, gitserver-token            │
│                                                                  │
│  2️⃣  测试连接                                                   │
│      └── 验证 Git 服务器连通性和 Token 权限                       │
│                                                                  │
│  3️⃣  创建组织                                                   │
│      └── 创建 claws-memory 组（如果不存在）                       │
│                                                                  │
│  4️⃣  创建仓库                                                   │
│      ├── main-memory-shared (公共主仓)                           │
│      ├── business-memory-shared (业务子仓)                        │
│      ├── code-memory-shared (代码子仓)                           │
│      ├── openclaw-memory-private (OpenClaw 私有)                 │
│      ├── hermes-memory-private (Hermes 私有)                     │
│      ├── claude-code-memory-private (Claude-Code 私有)           │
│      └── opencode-memory-private (OpenCode 私有)                 │
│                                                                  │
│  5️⃣  克隆并初始化                                                │
│      └── git clone --recursive                                   │
│                                                                  │
│  6️⃣  安装插件                                                   │
│      └── npm install                                             │
│                                                                  │
│  7️⃣  配置 OpenClaw Gateway                                       │
│      └── 更新 openclaw.json                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 安装前准备

### 1. 获取 Git 服务器 Token

#### Gitea

1. 登录 Gitea
2. 进入 **设置** → **应用程序**
3. 创建访问令牌（需要 `repo` 和 `org` 权限）
4. 复制令牌

![Gitea Token 创建示意](https://git.osc.life/assets/images/token-create.png)

#### GitHub（如果使用 GitHub）

1. 登录 GitHub
2. 进入 **Settings** → **Developer settings** → **Personal access tokens**
3. 生成新令牌（需要 `repo` 和 `org` 权限）
4. 复制令牌

### 2. 确保组织存在

安装脚本会自动创建 `claws-memory` 组织。如果需要手动创建：

#### Gitea

```bash
# API 创建组织
curl -X POST "https://git.osc.life/api/v1/orgs" \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "claws-memory", "description": "Multi-Claw Memory System"}'
```

---

## 仓库命名规则

所有仓库默认创建在 `claws-memory` 组织下：

| 仓库类型 | 仓库名 | 说明 |
|----------|--------|------|
| **公共主仓** | `claws-memory/main-memory-shared` | 存储全局规则、协作协议、共享知识 |
| **业务子仓** | `claws-memory/business-memory-shared` | 存储项目知识、行业知识 |
| **代码子仓** | `claws-memory/code-memory-shared` | 存储代码片段、设计模式 |
| **OpenClaw 私有** | `claws-memory/openclaw-memory-private` | OpenClaw 智能体私有记忆 |
| **Hermes 私有** | `claws-memory/hermes-memory-private` | Hermes 智能体私有记忆 |
| **Claude-Code 私有** | `claws-memory/claude-code-memory-private` | Claude-Code 私有记忆 |
| **OpenCode 私有** | `claws-memory/opencode-memory-private` | OpenCode 智能体私有记忆 |

---

## 安装后配置

### 1. 重启 OpenClaw Gateway

```bash
openclaw gateway restart
```

### 2. 验证插件状态

```bash
openclaw plugins list | grep memory
```

### 3. 测试记忆工具

```bash
# 查看状态
memory.status

# 保存记忆
memory.save --repo main --path "test/hello.md" --content "# Hello

这是一条测试记忆。"

# 加载记忆
memory.load --repo main --path "test/hello.md"

# 搜索记忆
memory.search --query "测试"
```

---

## 常见问题

### Q1: Token 权限不足

**错误信息**:
```
ERROR: API 返回 403 Forbidden
```

**解决方案**: 确保 Token 拥有以下权限：
- `repo` - 仓库读写
- `org` - 组织管理
- `create_repo` - 创建仓库（如果自动创建）

### Q2: 组织已存在

**错误信息**:
```
ERROR: 组织创建失败: name already exists
```

**解决方案**: 这不是错误，安装脚本会自动跳过已存在的组织。

### Q3: 仓库克隆失败

**错误信息**:
```
fatal: could not read Username
```

**解决方案**: 
1. 确保 Token 有仓库访问权限
2. 使用 HTTPS URL 而非 SSH
3. 检查网络连接

### Q4: 安装后插件不生效

**解决方案**:
1. 重启 Gateway: `openclaw gateway restart`
2. 检查配置: `openclaw config file`
3. 查看日志: `tail -f ~/.openclaw/logs/gateway.log`

---

## 卸载

```bash
# 删除本地文件
rm -rf ~/.openclaw/memory-plugins
rm -rf ~/.openclaw/memory

# 删除 OpenClaw 配置中的插件引用
# 编辑 ~/.openclaw/openclaw.json，移除 memory-plugin 相关配置

# 重启 Gateway
openclaw gateway restart
```

---

## 快速参考

```bash
# 完整安装命令
bash <(curl -sL <install-script-url>) \
  --plugins-url <URL> \
  --gitserver-url <URL> \
  --gitserver-token <TOKEN> \
  --group claws-memory

# 验证安装
memory.status
memory.save --repo main --path test.md --content "# Test"

# 查看帮助
memory.help
```

---

## 获取帮助

- **文档**: [https://git.osc.life/myz/multi-claw-subagents-memory-plugins](https://git.osc.life/myz/multi-claw-subagents-memory-plugins)
- **问题反馈**: [https://git.osc.life/myz/multi-claw-subagents-memory-plugins/issues](https://git.osc.life/myz/multi-claw-subagents-memory-plugins/issues)
