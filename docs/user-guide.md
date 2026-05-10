# Multi-Claw Memory Plugins 用户指南

> 版本: v1.0  
> 日期: 2026-05-08

## 目录

1. [快速开始](#快速开始)
2. [仓库结构](#仓库结构)
3. [记忆工具使用](#记忆工具使用)
4. [最佳实践](#最佳实践)
5. [故障排除](#故障排除)

---

## 快速开始

### 前提条件

- 已安装 OpenClaw Gateway
- 已配置 Git 访问凭证
- 可访问 `https://git.osc.life`

### 安装步骤

#### 1. 克隆主仓库

```bash
git clone https://git.osc.life/myz/multi-claw-subagents-memory-plugins.git
cd multi-claw-subagents-memory-plugins
```

#### 2. 初始化子仓库

```bash
# 运行初始化脚本
bash scripts/init-repos.sh

# 或手动初始化
git submodule update --init --recursive
```

#### 3. 配置插件

编辑 `~/.openclaw/openclaw.json`：

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "mainRepoUrl": "https://git.osc.life/myz/main-memory-shared.git",
          "businessRepoUrl": "https://git.osc.life/myz/business-memory-shared.git",
          "codeRepoUrl": "https://git.osc.life/myz/code-memory-shared.git",
          "privateRepoUrl": "https://git.osc.life/myz/openclaw-1-memory-private.git",
          "localPath": "~/.openclaw/memory",
          "syncInterval": 300000
        }
      }
    }
  }
}
```

#### 4. 重启 Gateway

```bash
openclaw gateway restart
```

---

## 仓库结构

### 仓库类型

| 仓库 | 用途 | 访问权限 |
|------|------|----------|
| `main-memory-shared` | 全局规则、协议、共享知识 | 所有智能体 |
| `business-memory-shared` | 项目文档、行业知识 | 所有智能体 |
| `code-memory-shared` | 代码片段、设计模式 | 所有智能体 |
| `*-memory-private` | 个体私有记忆 | 各智能体私有 |

### 存储位置

```
~/.openclaw/memory/
├── main-memory-shared/         # 公共主仓
├── business-memory-shared/    # 业务子仓
├── code-memory-shared/        # 代码子仓
└── openclaw-1-memory-private/   # OpenClaw 私有仓
```

---

## 记忆工具使用

### 1. 保存记忆 (memory.save)

**命令格式**：

```
memory.save --repo {main|business|code|private} --path "path/to/file.md" --content "# Title\n\nContent"
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--repo` | 是 | 仓库类型 |
| `--path` | 是 | 文件路径 |
| `--content` | 是 | Markdown 内容 |
| `--title` | 否 | 文档标题 |
| `--tags` | 否 | 标签数组 |
| `--access` | 否 | 访问级别 (SHARED/PRIVATE) |

**使用示例**：

```
# 保存学习笔记到业务仓
memory.save --repo business --path "learning/k8s-notes.md" --content "# Kubernetes 学习笔记\n\n## 部署...\n" --tags "kubernetes,devops"

# 保存代码片段到代码仓
memory.save --repo code --path "snippets/python/csv-reader.py" --content "# CSV Reader\n\n```python\nimport pandas as pd\n```" --tags "python,csv"
```

### 2. 加载记忆 (memory.load)

**命令格式**：

```
memory.load --repo {main|business|code|private} --path "path/to/file.md"
```

**使用示例**：

```
# 加载项目文档
memory.load --repo business --path "projects/xz-idmp/overview.md"

# 加载代码片段
memory.load --repo code --path "snippets/java/spring-rest.java"
```

### 3. 搜索记忆 (memory.search)

**命令格式**：

```
memory.search --query "关键词" --repos main,business --limit 10
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--query` | 是 | 搜索关键词 |
| `--repos` | 否 | 搜索范围 |
| `--tags` | 否 | 标签过滤 |
| `--limit` | 否 | 返回数量 |

**使用示例**：

```
# 搜索 XZ-IDMP 相关内容
memory.search --query "XZ-IDMP 架构" --repos main,business

# 搜索 Kubernetes 相关代码
memory.search --query "kubernetes deploy" --repos code --tags "k8s"
```

### 4. 同步记忆 (memory.sync)

**命令格式**：

```
memory.sync --repos main,business,code,private --direction both
```

**参数说明**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `--repos` | 否 | 要同步的仓库 (默认全部) |
| `--direction` | 否 | 同步方向 (pull/push/both) |
| `--message` | 否 | 提交消息 |

**使用示例**：

```
# 同步所有仓库
memory.sync

# 仅拉取最新变更
memory.sync --direction pull

# 推送到远程仓库
memory.sync --direction push
```

### 5. 查看状态 (memory.status)

**命令格式**：

```
memory.status
```

**输出示例**：

```
📊 记忆仓库状态

┌─────────────┬────────┬──────────┬───────────┐
│ 仓库        │ 状态   │ 待推送   │ 最后同步  │
├─────────────┼────────┼──────────┼───────────┤
│ main        │ ✅     │ 3        │ 2分钟前   │
│ business    │ ✅     │ 0        │ 5分钟前   │
│ code        │ ✅     │ 1        │ 1分钟前   │
│ private     │ ✅     │ 2        │ 刚刚     │
└─────────────┴────────┴──────────┴───────────┘
```

---

## 最佳实践

### 1. 记忆组织

#### 按主题分类

```
business-memory-shared/
├── projects/
│   ├── xz-idmp/
│   │   ├── architecture/
│   │   ├── requirements/
│   │   └── decisions/
│   └── other-project/
├── domains/
│   ├── iot-platform/
│   └── manufacturing/
└── templates/
```

#### 命名规范

- 文件名使用小写 + 连字符：`project-overview.md`
- 目录名使用小写 + 连字符：`learning-notes/`
- 代码片段包含版本号：`csv-reader-v1.py`

### 2. Frontmatter 规范

```markdown
---
title: 文档标题
category: architecture
tags: ["kubernetes", "deployment"]
accessLevel: SHARED
author: openclaw-agent
createdAt: "2026-05-08T00:00:00Z"
updatedAt: "2026-05-08T00:00:00Z"
version: 1
---
```

### 3. 提交规范

**格式**：

```
类型: 简短描述

类型：
- docs: 文档更新
- code: 代码片段
- rule: 规则变更
- decision: 决策记录
```

**示例**：

```
docs: 添加 Kubernetes 部署最佳实践

- 新增部署检查清单
- 添加故障排查指南
```

### 4. 同步时机

| 场景 | 建议 |
|------|------|
| 完成重要学习 | 立即同步 |
| 完成项目里程碑 | 立即同步 |
| 日常工作 | 每小时同步 |
| 离开前 | 最后同步一次 |

### 5. 冲突预防

1. **开始工作前**：先同步最新变更
2. **多人协作**：分工明确，避免修改同一文件
3. **重要文档**：加锁或通知其他智能体
4. **小步提交**：减少冲突范围

---

## 故障排除

### 问题：同步失败

**错误信息**：

```
Error: git pull failed: could not resolve hostname
```

**解决方案**：

1. 检查网络连接
2. 验证 Git URL 是否正确
3. 确认 SSH/HTTPS 配置

```bash
# 测试连接
ssh -T git@git.osc.life

# 查看详细错误
git fetch --verbose origin
```

### 问题：权限不足

**错误信息**：

```
Error: permission denied: repository not accessible
```

**解决方案**：

1. 检查 SSH 密钥配置

```bash
# 查看已配置的密钥
ssh-add -l

# 添加密钥
ssh-add ~/.ssh/id_rsa
```

2. 验证仓库访问权限

```bash
# 测试克隆
git clone https://git.osc.life/myz/main-memory-shared.git /tmp/test-clone
```

### 问题：索引过期

**错误信息**：

```
Error: search results not found, index may be outdated
```

**解决方案**：

```bash
# 强制重建索引
memory.sync --rebuild-index

# 或手动触发
memory.sync
```

### 问题：冲突无法解决

**场景**：多个智能体同时修改同一文件

**解决方案**：

1. 查看冲突文件

```bash
git status
```

2. 手动编辑冲突文件，保留需要的内容

3. 标记解决

```bash
git add resolved-file.md
git commit -m "resolve: 手动解决冲突"
```

4. 推送

```bash
memory.sync --direction push
```

---

## 附录

### A. 常用命令速查

| 命令 | 说明 |
|------|------|
| `memory.status` | 查看所有仓库状态 |
| `memory.sync` | 同步所有仓库 |
| `memory.search --query "keyword"` | 搜索记忆 |
| `memory.save --repo X --path Y --content Z` | 保存记忆 |
| `memory.load --repo X --path Y` | 加载记忆 |

### B. 联系方式

如有问题，请联系项目维护团队。
