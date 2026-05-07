# Main Memory Shared Repository

> 公共记忆主仓 - 所有智能体共享的核心记忆库

## 仓库用途

本仓库存储所有智能体（OpenClaw、Hermes、Claude Code、OpenCode）共享的核心记忆，包括：

- **全局规则**：跨智能体协作规则、访问控制策略
- **协作协议**：记忆同步协议、任务委托协议、冲突解决机制
- **共享知识**：通用技术知识、最佳实践、经验教训
- **决策记录**：重大技术决策、产品决策的记录和理由

## 目录结构

```
main-memory-shared/
├── _index/                       # 知识索引
│   ├── agents/                  # 智能体能力索引
│   ├── domains/                 # 领域索引
│   └── topics/                  # 主题索引
├── _protocols/                  # 协作协议
│   ├── memory-sync.v1.md       # 记忆同步协议
│   ├── conflict-resolution.md   # 冲突解决协议
│   └── access-control.md       # 访问控制协议
├── _templates/                  # 文档模板
│   ├── decision-template.md
│   └── lesson-learned-template.md
├── shared-rules/               # 共享规则
│   ├── security-rules.md
│   └── collaboration-protocols.md
├── shared-knowledge/           # 共享知识
│   ├── common-terms.md
│   └── best-practices/
└── decision-log/               # 决策记录
```

## 使用规范

### 提交规范

```
类型: 描述

类型:
- docs: 文档更新
- rule: 规则变更
- protocol: 协议更新
- knowledge: 知识添加
- decision: 决策记录
```

### 冲突处理

1. 发现冲突后，立即通知相关智能体
2. 根据优先级和时间戳自动解决简单冲突
3. 复杂冲突需要人工介入

## 维护者

- OpenClaw Agent
- Hermes Agent
- Claude Code Agent
- OpenCode Agent
