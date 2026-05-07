# Business Memory Shared Repository

> 公共记忆业务子仓 - 项目和行业知识库

## 仓库用途

本仓库存储所有智能体共享的业务相关记忆，包括：

- **项目知识**：各项目的需求、架构、决策、状态
- **行业知识**：工业物联网、智能制造等相关行业知识
- **业务流程**：标准操作流程、最佳实践
- **模板库**：各类业务文档模板

## 目录结构

```
business-memory-shared/
├── _index/                   # 业务索引
│   └── business-index.yaml
├── projects/                 # 项目知识
│   ├── xz-idmp/             # XZ-IDMP 智联网平台
│   │   ├── overview.md
│   │   ├── requirements/
│   │   ├── architecture/
│   │   ├── decisions/
│   │   └── team/
│   └── {other-projects}/
├── domains/                 # 业务领域
│   ├── iot-platform/
│   ├── smart-manufacturing/
│   └── industrial-ai/
└── templates/                # 文档模板
    ├── project-charter.md
    └── requirement-doc.md
```

## 项目规范

### 新增项目

在 `projects/` 下创建项目目录，包含：
- `overview.md` - 项目概述
- `requirements/` - 需求文档
- `architecture/` - 架构文档
- `decisions/` - 决策记录
- `status/` - 项目状态

### 项目状态更新

定期更新项目状态，包括：
- 当前阶段和里程碑
- 关键风险和问题
- 团队资源和分工
