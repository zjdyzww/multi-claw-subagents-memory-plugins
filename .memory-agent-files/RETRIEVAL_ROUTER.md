# 自适应检索路由

> 版本: v1 | 2026-05-07 | P1优化

---

## 检索策略类型

| 策略 | 触发条件 | 加载范围 | 响应时间 |
|------|---------|---------|---------|
| `direct` | 简单事实查询 | L1_CORE | < 100ms |
| `parallel` | 多跳/关系问题 | L1_CORE + 多L2 | < 500ms |
| `iterative` | 模糊/探索性问题 | 全量 L1-L4 | < 2s |

---

## 路由规则

### 1. 直接检索 (direct)

**触发条件**:
- 查询长度 < 30字
- 包含触发词: "是什么", "谁", "在哪", "多少", "我的微信", "公司名"
- **不包含**: "和...关系", "...和...哪个", "可能", "大概"

**路由逻辑**:
```
IF len(query) < 30
   AND any(trigger in query for trigger in ["是什么", "谁", "在哪", "多少", "我的", "公司"])
   AND NOT any(complex_trigger in query for complex_trigger in ["和", "关系", "哪个"])
THEN
   return "direct"
```

### 2. 并行分解检索 (parallel)

**触发条件**:
- 包含关系触发词: "和...关系", "...与...区别", "...和...哪个"
- 涉及多个业务域

**路由逻辑**:
```
IF any(parallel_trigger in query for parallel_trigger in ["和", "与", "哪个", "关系", "区别"])
THEN
   return "parallel"
```

### 3. 迭代链式检索 (iterative)

**触发条件**:
- 包含探索触发词: "可能", "大概", "有什么", "还有什么", "建议"
- 查询模糊/开放式

**路由逻辑**:
```
IF any(vague_trigger in query for vague_trigger in ["可能", "大概", "有什么", "建议", "方向"])
THEN
   return "iterative"
```

---

## 路由执行

```python
def route_retrieval(query: str) -> dict:
    """返回路由结果"""
    
    # Step 1: 检测复杂度
    query_type = classify_query(query)
    
    # Step 2: 确定加载范围
    if query_type == "direct":
        memory_files = ["L1_CORE/L1_CORE.md"]
        strategy = "直接检索"
    elif query_type == "parallel":
        memory_files = identify_business_domains(query)  # ["L1_CORE"] + 相关L2
        strategy = "并行分解"
    else:  # iterative
        memory_files = load_all_segments()  # 全量
        strategy = "迭代链式"
    
    # Step 3: 返回结果
    return {
        "strategy": strategy,
        "files": memory_files,
        "estimated_time": "direct:<100ms / parallel:<500ms / iterative:<2s"
    }
```

---

## 业务域识别

```python
def identify_business_domains(query: str) -> list:
    """识别查询涉及的业务域"""
    domains = ["L1_CORE"]  # 始终包含L1
    
    if any(word in query for word in ["水", "治理", "横店", "水体", "河流", "排污"]):
        domains.append("L2_BUSINESS/L2_A_WATER.md")
    if any(word in query for word in ["机器", "机器人", "人形", "臂", "AI", "智能"]):
        domains.append("L2_BUSINESS/L2_B_ROBOT.md")
    if any(word in query for word in ["gitea", "微信", "网站", "配置", "环境"]):
        domains.append("L3_CONFIG/L3_CONFIG.md")
    if any(word in query for word in ["文件", "目录", "路径", "在哪"]):
        domains.append("L4_INDEX/L4_INDEX.md")
    
    return domains
```

---

*版本: v1 | 2026-05-07*
