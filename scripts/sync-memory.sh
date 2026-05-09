#!/bin/bash
# sync-memory.sh - 同步所有记忆仓库

set -e

LOCAL_BASE="${HOME}/.openclaw/memory"
REPOS=("main-memory-shared" "business-memory-shared" "code-memory-shared" "openclaw-1-memory-private")

echo "=========================================="
echo "  Multi-Claw Memory Sync"
echo "=========================================="
echo ""

# 同步函数
sync_repo() {
    local repo_name=$1
    local local_path="${LOCAL_BASE}/${repo_name}"
    
    echo "🔄 同步 ${repo_name}..."
    
    if [ ! -d "${local_path}/.git" ]; then
        echo "  ⚠️  仓库不存在: ${local_path}"
        return 1
    fi
    
    cd "${local_path}"
    
    # 获取远程更新
    echo "  📥 拉取远程更新..."
    git fetch origin
    
    # 检查状态
    status=$(git status --porcelain)
    
    if [ -n "$status" ]; then
        echo "  📝 有本地变更待提交..."
        git add .
        git commit -m "Sync: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # 拉取并 Rebase
    echo "  🔀 执行 pull --rebase..."
    git pull --rebase origin main
    
    # 推送
    echo "  📤 推送本地变更..."
    git push origin main
    
    echo "  ✅ ${repo_name} 同步完成"
}

# 同步所有仓库
for repo in "${REPOS[@]}"; do
    sync_repo "$repo" || true
    echo ""
done

echo "=========================================="
echo "  ✅ 全部同步完成!"
echo "=========================================="
