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

### 6. 置信度标注 (memory.annotate)

为记忆文档标注置信度等级，支持三态冲突自动处理。

**使用场景**：
- 标记高价值知识为 CONFIRMED
- 标记推断信息为 LIKELY
- 标记模糊信息为 UNCERTAIN

**参数**：
```typescript
{
  docId: string,            // 文档 ID
  level: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN',
  source: string,           // 标注来源
  reason?: string           // 标注理由
}
```

### 7. 智能路由 (memory.route)

自适应路由引擎，根据查询特征自动选择 direct/parallel/iterative 策略。

**使用场景**：
- 单点精准查询 → direct
- 多跳/关系查询 → parallel
- 探索性/模糊查询 → iterative

**参数**：
```typescript
{
  query: string,            // 查询内容
  preferSpeed?: boolean,    // 速度优先
  preferAccuracy?: boolean  // 精度优先
}
```

**输出**：
```
🔄 路由决策
策略: parallel
目标: sys1, sys2, full
理由: 宽泛多维度查询，并行多代理提高覆盖率
```

### 8. 专家协作 (memory.collaborate)

4 专家 Persona 协作评估（架构师/审查者/批判者/整合者）。

**使用场景**：
- 评估信息可靠度
- 检测信息矛盾
- 形成多维度共识

**参数**：
```typescript
{
  content: string,                          // 待评估内容
  facts?: Array<{ content: string; confidence?: 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN' }>
}
```

**输出**：
```
🤝 专家协作结果
共识: LIKELY
🟢 CONFIRMED: 1票 (Architect)
🟡 LIKELY: 2票 (Reviewer, Integrator)
🔴 UNCERTAIN: 1票 (Critic)
```

### 9. 残差队列 (memory.residuals)

查看残差趋零清理引擎状态：三层清理进度、分值、统计数据。

**使用场景**：
- 监控记忆清理状态
- 检查未消解残留项
- 评估记忆系统健康度

**参数**：无

**输出**：
```
📊 残差队列状态
总数: 3 | L1: 2 | L2: 1 | L3: 0
残差总分: 456.78
目标: 消解率 ≥70%、驻留 ≤48h、队列 ≤10
```

### 10. 向量语义检索 (memory.vector_search)

基于 128 维向量嵌入的语义相似度搜索。

**使用场景**：
- 语义模糊匹配
- 概念相似度查询
- 超出关键词范围的深层检索

**参数**：
```typescript
{
  query: string,                    // 查询文本
  topK?: number,                    // 返回数量，默认 10
  repoTypes?: string[],             // 仓库过滤
  filterTags?: string[]             // 标签过滤
}
```

### 11. 记忆融合去重 (memory.fuse)

基于 Jaccard 相似度的多源记忆融合去重。

**使用场景**：
- 合并多代理对同一主题的记忆
- 消除重复信息
- 生成统一视图

**参数**：
```typescript
{
  docIds: string[]                  // 需要融合的文档 ID 列表（至少 2 个）
}
```

### 12. 记忆质量评估 (memory.assess)

元认知引擎：从完整性/时效性/一致性/置信度分布 4 维度自动评分。

**使用场景**：
- 定期审查记忆质量
- 发现低质量记忆
- 获取改进建议

**参数**：
```typescript
{
  docId?: string                    // 指定文档 ID，不指定则全局评估
}
```

**输出**：
```
📋 质量评估报告
总评分: 72/100
  - 完整性: 85
  - 时效性: 65
  - 一致性: 90
  - 置信度: 50
⚠ 发现 2 个问题: 内容过短、置信度未标注
💡 建议: 添加至少 1 个标签、使用 confidence-engine 标注置信度
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
