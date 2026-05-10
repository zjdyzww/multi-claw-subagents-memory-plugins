# Gitea Integration Module

> Gitea 记忆仓库集成配置 | 基于 go-gitea/gitea v1.26 + giteabot patterns

## Gitea 服务器

```yaml
server:
  url: https://git.osc.life
  org: claws-memory
  token_env: GITEA_TOKEN
```

## 仓库定义

```yaml
repositories:
  shared:
    - name: main-memory-shared
      description: 公共记忆主仓
      confidence_labels: true
      milestones: true
      
    - name: business-memory-shared
      description: 公共业务子仓
      confidence_labels: true
      
    - name: code-memory-shared
      description: 公共代码子仓
      confidence_labels: true

  private:
    openclaw:  openclaw-{n}-memory-private
    hermes:    hermes-{n}-memory-private
    claude_code: claude-code-{n}-memory-private
    opencode:  opencode-{n}-memory-private
```

## Label 策略 (giteabot 风格)

```yaml
labels:
  confidence:
    - name: confidence/confirmed
      color: "3fb950"
      description: 🟢 高置信度 — 用户明确/多次验证
      
    - name: confidence/likely
      color: "d29922"
      description: 🟡 中置信度 — 单次获取/推断
      
    - name: confidence/uncertain
      color: "f85149"
      description: 🔴 低置信度 — 模糊表达/需验证

  status:
    - name: memory/pending-review     # 待其他 agent 审查
    - name: memory/consensus-reached  # ≥2 agent 确认
    - name: memory/expired           # 超过30天未更新
    
  pr:
    - name: pr/backport-v13          # giteabot 风格 backport
    - name: pr/lgtm-need-2           # 需 2 个 LGTM
    - name: pr/lgtm-done             # LGTM 达成

  auto:
    - name: auto-labeled             # 自动标注
    - name: stale                    # 陈旧 (T>7d)
```

## PR 共享工作流

```
1. Agent 推送私有仓 → confidence/likely label
2. 创建 PR 到 shared 仓 → memory/pending-review + pr/lgtm-need-2
3. 其他 Agent 通过 PR review 投票 LGTM
4. ≥2 LGTM → pr/lgtm-done → 自动合并 → 广播
5. 合并后 → confidence/confirmed (升级置信度)
```

## Milestone 策略

```yaml
milestones:
  - title: "v13.0 Academy"
    due_on: "2026-05-18"
    description: "记忆强化框架 v13.0 学术版"
  - title: "v14.0 Next"
    due_on: "2026-06-01"
    description: "多模态记忆"
```

## Webhook 配置

```yaml
webhooks:
  - url: https://hooks.webhook.example/memory
    events: [push, pull_request, issues, release]
    content_type: json
    
  - url: dingtalk://webhook.example
    events: [push]  # 关键变更通知
```

## Sync Schedule (giteabot cron style)

```
 10:00 → full sync (全量)   → git pull --rebase → git push
 14:00 → inc sync (增量)    → residual cleanup
 18:00 → label maintenance  → 移除 stale → 自动标注
 22:00 → full sync (全量)   → git sync + time-insight 报告
```
