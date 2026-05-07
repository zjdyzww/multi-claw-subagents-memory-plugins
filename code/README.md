# Code Memory Shared Repository

> 公共记忆代码子仓 - 代码片段和设计模式库

## 仓库用途

本仓库存储所有智能体共享的代码相关资产，包括：

- **代码片段**：常用功能的可复用代码
- **设计模式**：架构和编码设计模式
- **运维脚本**：部署、监控、备份脚本
- **CI/CD 模板**：流水线配置文件

## 目录结构

```
code-memory-shared/
├── _index/                   # 代码索引
│   └── code-index.yaml
├── snippets/                # 代码片段
│   ├── python/
│   │   ├── data-processing/
│   │   ├── api-clients/
│   │   └── utilities/
│   ├── javascript/
│   │   ├── nodejs/
│   │   └── browser/
│   ├── java/
│   │   ├── spring-boot/
│   │   └── utilities/
│   └── shell/
│       ├── docker/
│       └── system-admin/
├── patterns/                # 设计模式
│   ├── architectural/
│   │   ├── microservices.md
│   │   ├── event-driven.md
│   │   └── layered-architecture.md
│   └── coding/
│       ├── solid-principles.md
│       └── refactoring-patterns.md
├── scripts/                # 运维脚本
│   ├── deployment/
│   ├── monitoring/
│   └── backup/
├── ci-cd/                  # CI/CD 模板
│   ├── github-actions/
│   ├── gitlab-ci/
│   └── jenkins/
└── infrastructure/         # 基础设施代码
    ├── docker/
    └── kubernetes/
```

## 代码片段规范

### 命名规范

```
{语言}-{功能}-{版本}.{扩展名}

示例：
python-dataframe-csv-reader-v1.py
java-spring-boot-rest-controller.java
javascript-async-await-fetch.js
shell-docker-compose-deploy.sh
```

### 文件头注释

```markdown
"""
文件名: {文件名}
功能: {功能描述}
作者: {作者}
版本: {版本}
日期: {日期}
依赖: {依赖库}
"""
```

### 使用许可

除非另有说明，所有代码片段采用 MIT License。

## 设计模式规范

### 文档格式

每个设计模式文档应包含：
1. 模式名称和分类
2. 意图和动机
3. 结构图（PlantUML）
4. 实现代码示例
5. 适用场景
6. 优缺点分析

## 贡献流程

1. 在对应目录下创建文件
2. 添加必要的注释和文档
3. 更新 `_index/code-index.yaml`
4. 提交 Pull Request
