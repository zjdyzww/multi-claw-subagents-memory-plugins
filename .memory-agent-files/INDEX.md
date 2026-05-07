# 文件索引

## 记忆仓库
- /home/myz/hermes-memory/ — gitea本地克隆
- /tmp/memory-agent-plugins/ — 插件备份

## Skills
- dual-thinking: ~/.hermes/skills/productivity/dual-thinking/SKILL.md
- memory-manager: ~/.hermes/skills/productivity/memory-manager/SKILL.md

## 自适应路由（内置）
| 策略 | 触发 | 加载 |
|------|------|------|
| direct | <30字简单 | L1_CORE |
| parallel | 多跳关系 | L1+多L2 |
| iterative | 模糊探索 | 全量 |

## 置信度（内置）
| 🟢 高 | 🟡 中 | 🔴 低 |
|--------|--------|--------|
| 用户明确 | 单次获取 | 模糊表达 |
