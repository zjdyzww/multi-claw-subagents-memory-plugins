# OpenClaw Memory Plugin 配置指南

## 配置方式

编辑 `~/.openclaw/openclaw.json`，在 `plugins.entries` 中添加插件配置：

```json
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "mainRepoUrl": "https://git.osc.life/myz/main-memory-shared.git",
          "businessRepoUrl": "https://git.osc.life/myz/business-memory-shared.git",
          "codeRepoUrl": "https://git.osc.life/myz/code-memory-shared.git",
          "privateRepoUrl": "https://git.osc.life/myz/openclaw-memory-private.git",
          "localPath": "~/.openclaw/memory",
          "syncInterval": 300000,
          "syncStrategy": "rebase"
        }
      }
    }
  }
}
```

## 配置参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `mainRepoUrl` | string | 是 | - | 公共主仓 Git URL |
| `businessRepoUrl` | string | 是 | - | 业务子仓 Git URL |
| `codeRepoUrl` | string | 是 | - | 代码子仓 Git URL |
| `privateRepoUrl` | string | 是 | - | 私有仓 Git URL |
| `localPath` | string | 否 | `~/.openclaw/memory` | 本地仓库根目录 |
| `syncInterval` | number | 否 | `300000` | 自动同步间隔（毫秒） |
| `syncStrategy` | string | 否 | `rebase` | 同步策略 (`rebase` 或 `merge`) |
| `conflictResolution` | string | 否 | `timestamp` | 冲突解决策略 |

## 环境变量

也可通过环境变量配置（优先级低于配置文件）：

```bash
export MEMORY_MAIN_REPO_URL="https://git.osc.life/myz/main-memory-shared.git"
export MEMORY_BUSINESS_REPO_URL="https://git.osc.life/myz/business-memory-shared.git"
export MEMORY_CODE_REPO_URL="https://git.osc.life/myz/code-memory-shared.git"
export MEMORY_PRIVATE_REPO_URL="https://git.osc.life/myz/openclaw-memory-private.git"
export MEMORY_LOCAL_PATH="~/.openclaw/memory"
```

## 权限配置

### 仓库访问权限

确保 Git 凭据管理器已配置：

```bash
# 使用 SSH 密钥
git config --global url."git@git.osc.life:".insteadOf "https://git.osc.life/"

# 或使用 HTTPS + 凭据存储
git config --global credential.helper store
```

## 验证配置

配置完成后，可通过以下命令验证：

```bash
# 检查插件状态
openclaw plugins list | grep memory

# 测试记忆工具
memory.status
```

## 故障排除

### 问题：无法克隆仓库

**解决方案**：
1. 检查网络连接
2. 验证 Git URL 是否正确
3. 确保有仓库访问权限

### 问题：同步失败

**解决方案**：
1. 检查是否有未解决的冲突：`git status`
2. 手动解决冲突后重新同步
3. 查看详细日志

### 问题：权限不足

**解决方案**：
1. 检查 SSH 密钥配置
2. 确保有仓库写权限
3. 更新 Git 凭据
