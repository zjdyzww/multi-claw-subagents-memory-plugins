# Hermes Gateway Configuration

> Hermes 记忆网关配置文件

## 基本配置

```yaml
gateway:
  id: hermes-gateway-01
  name: Hermes Memory Gateway
  version: 3.0
  role: memory_sync
  
network:
  port: 18790
  bind: localhost
  protocol: internal
```

## 同步配置

```yaml
sync:
  schedule:
    - time: "10:00"
      scope: full
      priority: high
    - time: "22:00"
      scope: full
      priority: high
    - time: "14:00"
      scope: incremental
      priority: normal
      
  compression:
    level: 5
    preserve_cache_friendly: true
    strategies:
      - name: progressive
        levels: 5
      - name: quality_based
        min_score: 60
```

## 记忆审核队列

```yaml
review_queue:
  max_pending: 100
  auto_approve_threshold: 90
  
  stages:
    - name: hermes_review
      required: true
    - name: openclaw_approval
      required: true
    - name: agent_confirmation
      required: false
      
  notification:
    channels:
      - openclaw
      - source_agent
    on_complete: true
    on_reject: true
```

## 质量评分

```yaml
quality:
  auto_score: true
  scoring_criteria:
    relevance: 0.3
    accuracy: 0.3
    completeness: 0.2
    timeliness: 0.2
    
  thresholds:
    excellent: 90
    good: 70
    fair: 50
    poor: 30
```
