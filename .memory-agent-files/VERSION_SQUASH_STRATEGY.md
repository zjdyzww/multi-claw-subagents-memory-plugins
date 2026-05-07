# 版本 Squash 策略

> 版本: v1 | 2026-05-07 | P2优化

## Squash 规则

| 条件 | 触发 | 处理 |
|------|------|------|
| 同一版本多个commit | 版本发布 | 合并为1个 |
| 连续30+个小改动 | 月底 | 合并为1个 |
| 文档更新-only | 随时 | 不squash |

## 保留规则

永不删除:
- 版本发布commit (v1, v2, v3...)
- 重大变更commit (BREAKING CHANGE)
- Gitea首次初始化commit

可squash:
- 连续小优化 (<5文件)
- 文档更新
- 同步commit

## 执行

```bash
# 月度squash（每月1日）
hermes memory squash --month 2026-05

# 版本发布squash
git rebase -i HEAD~5
```
