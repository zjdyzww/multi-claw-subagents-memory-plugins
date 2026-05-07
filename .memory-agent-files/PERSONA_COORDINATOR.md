# Persona 协调器

> 版本: v1 | 2026-05-07 | P2优化
> 核心思想: 不同话题激活不同领域专家，跨领域问题触发多专家协作

---

## 1. 领域专家定义

| 专家 | 负责领域 | 激活关键词 | 关联记忆 |
|------|---------|-----------|---------|
| **通用助手** | 基础问答、配置查询 | 通用 | L1_CORE, L3_CONFIG |
| **水体治理专家** | 横店水项目、治理工程 | 水/治理/横店/水质/排污 | L2_A_WATER |
| **机器人专家** | 人形机器人、工业臂、具身AI | 机器/机器人/人形/臂/AI | L2_B_ROBOT |
| **项目管理专家** | 预算、进度、协作 | 项目/预算/进度/计划 | L2_A_WATER, L2_B_ROBOT |

---

## 2. 激活规则

```python
def activate_persona(query: str) -> list:
    """返回激活的专家列表"""
    experts = ["通用助手"]  # 默认激活
    
    # 水体治理专家
    water_keywords = ["水", "治理", "横店", "水体", "河流", "排污", "水质", "调蓄", "清淤"]
    if any(kw in query for kw in water_keywords):
        experts.append("水体治理专家")
    
    # 机器人专家
    robot_keywords = ["机器", "机器人", "人形", "臂", "AI", "智能", "具身", "工业臂"]
    if any(kw in query for kw in robot_keywords):
        experts.append("机器人专家")
    
    # 项目管理专家
    project_keywords = ["项目", "预算", "进度", "计划", "工程", "招标"]
    if any(kw in query for kw in project_keywords):
        experts.append("项目管理专家")
    
    return list(set(experts))  # 去重
```

---

## 3. 协作模式

### 3.1 单专家模式
```
用户查询 → 通用助手 → 单一领域专家 → 回答
```
适用: 简单事实查询，不涉及跨领域

### 3.2 双专家协作模式
```
用户查询 → 通用助手 → 专家A + 专家B → 协作推理 → 回答
```
适用: "横店水项目预算和机器人方向有什么关系"
- 水体治理专家提供水项目信息
- 机器人专家提供技术方向
- 协作得出结论

### 3.3 三专家协作模式
```
用户查询 → 通用助手 → 专家A + 专家B + 专家C → 协作推理 → 回答
```
适用: 复杂战略问题，需要多维度分析

---

## 4. 协作协议

```python
class ExpertCollaboration:
    """多专家协作处理"""
    
    def collaborate(self, query: str, experts: list) -> dict:
        if len(experts) == 1:
            return self.single_expert_mode(experts[0], query)
        elif len(experts) == 2:
            return self.dual_expert_mode(experts[0], experts[1], query)
        else:
            return self.multi_expert_mode(experts, query)
    
    def dual_expert_mode(self, expert_a, expert_b, query):
        # Step 1: 各自独立检索
        result_a = self.retrieve(expert_a, query)
        result_b = self.retrieve(expert_b, query)
        
        # Step 2: 交换信息
        shared_context = self.merge_results(result_a, result_b)
        
        # Step 3: 协作推理
        final_answer = self.collaborative_reasoning(shared_context)
        
        return {
            "experts": [expert_a, expert_b],
            "answer": final_answer,
            "confidence": self.calculate_confidence(result_a, result_b)
        }
```

---

## 5. 检索优先级

当多专家激活时，检索优先级:

```
1. 通用助手 → L1_CORE (始终)
2. 领域专家A → 对应L2
3. 领域专家B → 对应L2
4. L3_CONFIG (按需)
5. L4_INDEX (按需)
```

---

## 6. 置信度计算

多专家协作时，置信度取各专家置信度的**加权平均**:

```python
def calculate_collaboration_confidence(results: list) -> str:
    weights = {"🟢": 1.0, "🟡": 0.6, "🔴": 0.3}
    
    weighted_sum = sum(weights[r.confidence] for r in results)
    avg = weighted_sum / len(results)
    
    if avg >= 0.8:
        return "🟢"
    elif avg >= 0.5:
        return "🟡"
    else:
        return "🔴"
```

---

## 7. Persona 状态机

```markdown
## Persona 激活状态

当前会话: 2026-05-07 17:50

| 专家 | 激活次数 | 最后激活 | 状态 |
|------|---------|---------|------|
| 通用助手 | 0 | - | 待激活 |
| 水体治理专家 | 0 | - | 待激活 |
| 机器人专家 | 0 | - | 待激活 |
| 项目管理专家 | 0 | - | 待激活 |
```

---

*版本: v1 | 2026-05-07*
