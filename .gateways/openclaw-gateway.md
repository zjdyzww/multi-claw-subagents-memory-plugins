# OpenClaw Gateway Configuration v2.0

> OpenClaw 主网关 | 基于 go-gitea/gitea + giteabot 生态
> Gitea 集成: labels/PRs/milestones/webhooks/scheduled-tasks

## 基本配置

```yaml
gateway:
  id: openclaw-gateway-01
  name: OpenClaw Main Gateway
  version: 2.1
  
network:
  port: 18789
  bind: 0.0.0.0
  protocol: ws/wss
  
qqbot:
  app_id: "1903121000"
  ws_endpoint: wss://api.sgroup.qq.com/websocket
```

## 路由规则

```yaml
routes:
  - name: hermes-memory
    pattern: "memory/*"
    target: hermes-gateway
    priority: 10
    methods: [GET, POST, PUT, DELETE]
    
  - name: claude-code
    pattern: "code/*"
    target: claude-code-gateway
    priority: 5
    methods: [GET, POST]
    
  - name: opencode
    pattern: "opensource/*"
    target: opencode-gateway
    priority: 5
    methods: [GET, POST]
    
  - name: default
    pattern: "*"
    target: hermes-gateway
    priority: 1
```

## 广播策略

```yaml
broadcast:
  realtime:
    enabled: true
    events:
      - route.change
      - connection.status
      - agent.online
      - agent.offline
      
  batch:
    enabled: true
    interval: 300000  # 5 minutes
    
  differential:
    enabled: true
    scope: relevant_agents_only
```

## 同步配置

```yaml
sync:
  master: true
  realtime_broadcast: true
  conflict_resolution: priority_based
  
  priorities:
    openclaw: 100
    hermes: 80
    claude-code: 60
    opencode: 60
```

## 访问控制

```yaml
access_control:
  default_policy: deny
  exceptions:
    - agent: hermes
      permissions: [memory.write, sync.trigger]
    - agent: openclaw
      permissions: ["*"]
```
