---
name: openclaw-memory
description: |
  OpenClaw 智能体记忆管理技能，支持多智能体环境下的共享记忆同步和个体记忆管理。
  用于保存学习成果、项目上下文、决策记录、代码片段等到共享仓库或私有记忆库。
  当用户要求保存记忆、搜索记忆、同步记忆、或需要跨会话保持上下文时使用此技能。
metadata:
  openclaw:
    emoji: 🧠
    requires:
      config:
        - memory.mainRepoUrl
        - memory.businessRepoUrl
        - memory.codeRepoUrl
        - memory.privateRepoUrl
        - memory.localPath
---

# OpenClaw Memory Plugin - 记忆管理技能

## 核心功能

### 1. 记忆存储 (memory.save)

将信息保存到指定的记忆仓库。

**使用场景**：
- 保存学习到的知识点
- 记录项目决策和上下文
- 存储代码片段和配置
- 记录会议纪要和待办事项

**参数**：
```typescript
{
  repo: 'main' | 'business' | 'code' | 'private',
  path: string,           // 文件路径，如 "knowledge/ai-patterns.md"
  content: string,        // Markdown 内容
  title?: string,         // 文档标题
  tags?: string[],        // 标签数组
  access?: 'SHARED' | 'PRIVATE',  // 访问级别
  author?: string         // 作者（默认自动填充）
}
```

**输出**：
```
✅ 记忆已保存
📁 仓库: main-memory-shared
📄 路径: knowledge/ai-patterns.md
🆔 ID: abc123
```

### 2. 记忆加载 (memory.load)

从记忆仓库加载指定内容。

**使用场景**：
- 恢复项目上下文
- 查阅之前的学习成果
- 获取团队共享知识

**参数**：
```typescript
{
  repo: 'main' | 'business' | 'code' | 'private',
  path: string            // 文件路径
}
```

### 3. 记忆搜索 (memory.search)

在记忆仓库中搜索相关内容。

**使用场景**：
- 查找之前是否学习过某个主题
- 搜索项目相关文档
- 寻找可复用的代码片段

**参数**：
```typescript
{
  query: string,          // 搜索关键词
  repos?: string[],       // 搜索范围，默认全部
  tags?: string[],        // 标签过滤
  limit?: number          // 返回数量，默认 10
}
```

**示例**：
```
🔍 搜索 "XZ-IDMP 项目架构"
找到 3 条相关记忆：

1. [main] XZ-IDMP 系统架构设计
   匹配度: 95%
   📄 architecture/system-design.md
   
2. [business] XZ-IDMP 技术选型决策
   匹配度: 87%
   📄 xz-idmp/decisions/tech-stack.md
   
3. [code] XZ-IDMP 后端代码结构
   匹配度: 72%
   📄 snippets/java/spring-boot/
```

### 4. 记忆同步 (memory.sync)

同步本地记忆仓库与远程仓库。

**使用场景**：
- 开始工作前同步最新记忆
- 完成工作后提交并推送变更
- 解决合并冲突

**参数**：
```typescript
{
  repos?: string[],       // 要同步的仓库，默认全部
  direction?: 'pull' | 'push' | 'both',
  message?: string        // 提交消息
}
```

### 5. 记忆状态 (memory.status)

查看各记忆仓库的同步状态。

**参数**：无

**输出**：
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

## 仓库架构

```
┌─────────────────────────────────────────────────────────┐
│           Multi-Claw Memory Architecture                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ OpenClaw    │  │   Hermes     │  │ Claude Code  │ │
│  │ 私有记忆仓   │  │   私有记忆仓  │  │   私有记忆仓  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │          公共记忆主仓 (main-memory-shared)          │ │
│  │  协议 / 规则 / 共享知识 / 决策记录                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │ 业务子仓          │  │ 代码子仓                   │   │
│  │ business-shared  │  │ code-shared               │   │
│  └──────────────────┘  └────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 仓库说明

| 仓库 | 用途 | 内容 |
|------|------|------|
| **main-memory-shared** | 公共主仓 | 全局规则、协作协议、共享知识、决策记录 |
| **business-memory-shared** | 业务子仓 | 项目文档、需求分析、业务流程、行业知识 |
| **code-memory-shared** | 代码子仓 | 代码片段、设计模式、脚本、CI/CD 模板 |
| *-memory-private** | 私有仓 | 个体上下文、用户偏好、个人学习笔记 |

## 使用示例

### 保存学习成果

```
我: 帮我记忆今天学习的 Kubernetes 部署最佳实践
助手: 
```
