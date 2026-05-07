# OpenCode 记忆宫殿规则

> **版本**: v1.0 | **日期**: 2026-05-08  
> **适用**: OpenCode 智能体 (开源开发角色)  
> **核心理念**: 记忆强化框架 + 开源协作 + 向量检索

---

## 1. OpenCode 记忆系统架构

### 1.1 记忆目录结构

```
~/.opencode/
├── memory/                    # 记忆存储
│   ├── L1_CORE/             # 核心身份
│   ├── L2_BUSINESS/         # 业务记忆
│   ├── L3_CONFIG/          # 配置记忆
│   └── L4_INDEX/          # 索引记忆
├── projects/                 # 项目记忆
├── skills/                   # 技能
└── cache/                    # 缓存
```

### 1.2 记忆流向

```
任务输入 → System 2 海绵吸收 → 记忆表象
    ↓
System 1 淘金提炼 → 项目上下文
    ↓
向量索引 → Milvus 向量数据库
    ↓
Git 同步 → code-memory-shared
```

---

## 2. 记忆宫殿规则 (Looms)

### 2.1 核心 Loom (L1)

| Loom | 位置 | 内容 |
|------|------|------|
| **角色** | ~/.opencode/memory/L1_CORE/ | 开源开发者 |
| **排他规则** | L1_CORE/ | 不破坏开源生态 |
| **协作协议** | L1_CORE/ | PR, Issue, Review 规则 |

### 2.2 业务 Loom (L2)

| Loom | 位置 | 触发词 |
|------|------|--------|
| **XZ-IDMP** | L2_BUSINESS/xz-idmp/ | 项目、模块、API |
| **代码规范** | L2_BUSINESS/standards/ | 编码规范 |
| **开源项目** | L2_BUSINESS/open-source/ | GitHub, PR |

### 2.3 配置 Loom (L3)

| Loom | 位置 | 用途 |
|------|------|------|
| **开发环境** | L3_CONFIG/dev-env/ | IDE, SDK |
| **CI/CD** | L3_CONFIG/cicd/ | GitHub Actions |
| **部署配置** | L3_CONFIG/deploy/ | Docker, K8s |

---

## 3. OpenCode 特有的记忆操作

### 3.1 向量检索

```bash
# 语义搜索代码
memory.search --query "如何实现 JWT 认证" --type vector

# 搜索项目文档
memory.search --query "XZ-IDMP 模块设计" --repos code
```

### 3.2 保存代码片段

```bash
# 保存到代码库
memory.save --repo code --path "auth/jwt-implementation.md" --content "..."

# 更新索引
memory.index --rebuild
```

### 3.3 定时同步

| 时机 | 同步内容 |
|------|----------|
| PR 合并 | 相关代码片段 |
| 每日 22:00 | 全量同步 |
| Issue 关闭 | 解决方案记录 |

---

## 4. 与 OpenClaw 的协作

### 4.1 任务委派接收

当 OpenClaw 分配开源相关任务时：

```
1. 接收任务 → 保存到 projects/
2. 搜索相关代码 → 利用向量检索
3. 执行任务 → 遵守开源协议
4. 提交 PR → 通知 OpenClaw 审核
```

### 4.2 广播协议

```
PR 合并 → OpenClaw → 更新 business-memory-shared
代码贡献 → Claude Code → 更新 code-memory-shared
```

---

## 5. 安装后初始化

### 5.1 首次安装

```bash
# 1. 复制记忆宫殿规则
cp -r .memory-palace/opencode/* ~/.opencode/memory/

# 2. 初始化向量索引
memory.index --init --provider milvus

# 3. 初始化 Git
cd ~/.opencode
git remote add origin https://git.osc.life/claws-memory/opencode-memory-private.git

# 4. 配置定时同步
# 添加 cron job: 22:00 memory.sync --repos opencode
```

### 5.2 同步命令

```bash
# 同步所有记忆
memory.sync --repos opencode --direction both

# 重建向量索引
memory.index --rebuild

# 查看状态
memory.status
```

---

## 6. 残差趋零清理

### 6.1 清理规则

| 条件 | 处理 |
|------|------|
| T > 24h 未解决 | 降级归档 |
| T > 7天 未解决 | 移入 archive/ |
| T > 30天 未解决 | 彻底删除 |

### 6.2 质量指标

- 残差队列长度 ≤ 10
- 平均残差驻留时间 ≤ 48h
- 向量索引准确率 ≥ 85%

---

*OpenCode 记忆宫殿规则 v1.0 | 2026-05-08*
