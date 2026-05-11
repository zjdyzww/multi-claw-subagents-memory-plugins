#!/bin/bash
# sync-memory.sh - 同步所有记忆仓库
# 支持环境变量配置，兼容 .env 和 CLI 参数

set -e

# ============================================================
# 配置加载优先级：环境变量 > 配置文件 > 默认值
# ============================================================

# 配置文件路径（可被 MEMORY_SYNC_CONFIG 环境变量覆盖）
CONFIG_FILE="${MEMORY_SYNC_CONFIG:-${HOME}/.config/memory-sync.env}"

# 加载配置文件（如果存在）
if [ -f "$CONFIG_FILE" ]; then
  set -a
  source "$CONFIG_FILE"
  set +a
fi

# 基础路径
LOCAL_BASE="${MEMORY_LOCAL_PATH:-${HOME}/.openclaw/memory}"

# 同步仓库列表（逗号分隔，支持环境变量覆盖）
SHARED_REPOS_STR="${MEMORY_SHARED_REPOS:-main-memory-shared,business-memory-shared,code-memory-shared}"
IFS=',' read -ra SHARED_REPOS <<< "$SHARED_REPOS_STR"

# 智能体类型列表（逗号分隔，支持环境变量覆盖）
AGENT_TYPES_STR="${MEMORY_AGENT_TYPES:-openclaw,hermes,claude-code,opencode}"
IFS=',' read -ra AGENT_TYPES <<< "$AGENT_TYPES_STR"

# 每个智能体的私有仓库数量
AGENT_COUNT="${MEMORY_AGENT_COUNT:-5}"

# Gitea 远程地址模板（用于没有 .git 时初始化）
GITEA_REMOTE_TEMPLATE="${MEMORY_GITEA_TEMPLATE:-}"

# ============================================================
# 逻辑
# ============================================================

PRIVATE_REPOS=()
for agent in "${AGENT_TYPES[@]}"; do
  for i in $(seq 1 "$AGENT_COUNT"); do
    if [ -d "${LOCAL_BASE}/${agent}-${i}-memory-private/.git" ]; then
      PRIVATE_REPOS+=("${agent}-${i}-memory-private")
    fi
  done
done
REPOS=("${SHARED_REPOS[@]}" "${PRIVATE_REPOS[@]}")

echo "=========================================="
echo "  Multi-Claw Memory Sync"
echo "  Config: ${CONFIG_FILE}"
echo "  Base:   ${LOCAL_BASE}"
echo "  Repos:  ${#REPOS[@]}"
echo "=========================================="
echo ""

# 同步函数
sync_repo() {
    local repo_name=$1
    local local_path="${LOCAL_BASE}/${repo_name}"

    echo "🔄 同步 ${repo_name}..."

    if [ ! -d "${local_path}/.git" ]; then
      echo "  ⚠️  仓库不存在: ${local_path}"
      if [ -n "$GITEA_REMOTE_TEMPLATE" ]; then
        local remote_url=$(echo "$GITEA_REMOTE_TEMPLATE" | sed "s/{repo}/$repo_name/g")
        echo "  🔧 尝试克隆: ${remote_url}"
        git clone "$remote_url" "$local_path" 2>/dev/null || {
          echo "  ❌ 克隆失败，跳过"
          return 1
        }
      else
        echo "  ⏭️  跳过（无 GITEA_REMOTE_TEMPLATE）"
        return 1
      fi
    fi

    cd "${local_path}"

    # 获取远程更新
    echo "  📥 拉取远程更新..."
    git fetch origin 2>/dev/null || echo "  ⚠️  fetch 失败（可能无远程）"

    # 检查状态
    status=$(git status --porcelain)

    if [ -n "$status" ]; then
        echo "  📝 有本地变更待提交..."
        git add .
        git commit -m "Sync: $(date '+%Y-%m-%d %H:%M:%S')"
    fi

    # 检查是否有远程分支
    if git show-ref --verify --quiet refs/remotes/origin/main; then
      echo "  🔀 执行 pull --rebase..."
      git pull --rebase origin main 2>/dev/null || {
        echo "  ⚠️  rebase 失败，尝试 merge..."
        git pull origin main 2>/dev/null || echo "  ⚠️  pull 失败"
      }
    fi

    # 推送（如果有远程）
    if git remote get-url origin &>/dev/null; then
      echo "  📤 推送本地变更..."
      git push origin main 2>/dev/null || echo "  ⚠️  push 失败"
    fi

    echo "  ✅ ${repo_name} 同步完成"
}

# 统计
success_count=0
fail_count=0

# 同步所有仓库
for repo in "${REPOS[@]}"; do
    if sync_repo "$repo"; then
      ((success_count++))
    else
      ((fail_count++))
    fi
    echo ""
done

echo "=========================================="
echo "  ✅ 同步完成! 成功: ${success_count}, 跳过/失败: ${fail_count}"
echo "=========================================="
