#!/bin/bash
# init-repos.sh - 初始化所有记忆仓库

set -e

BASE_URL="https://git.osc.life/myz"
LOCAL_BASE="${HOME}/.openclaw/memory"

echo "=========================================="
echo "  Multi-Claw Memory Repos Initialization"
echo "=========================================="

# 创建本地目录
mkdir -p "${LOCAL_BASE}"

# 公共仓库列表
declare -A PUBLIC_REPOS
PUBLIC_REPOS["main-memory-shared"]="${BASE_URL}/main-memory-shared.git"
PUBLIC_REPOS["business-memory-shared"]="${BASE_URL}/business-memory-shared.git"
PUBLIC_REPOS["code-memory-shared"]="${BASE_URL}/code-memory-shared.git"

# 私有仓库（需要根据实际智能体调整）
declare -A PRIVATE_REPOS
PRIVATE_REPOS["openclaw-memory-private"]="${BASE_URL}/openclaw-memory-private.git"

echo ""
echo "📦 初始化公共仓库..."
echo ""

# 克隆或更新公共仓库
for repo_name in "${!PUBLIC_REPOS[@]}"; do
    repo_url="${PUBLIC_REPOS[$repo_name]}"
    local_path="${LOCAL_BASE}/${repo_name}"
    
    echo "  处理仓库: ${repo_name}"
    
    if [ -d "${local_path}/.git" ]; then
        echo "    ✅ 已存在，更新中..."
        cd "${local_path}"
        git pull origin main
    else
        echo "    📥 克隆中..."
        git clone "${repo_url}" "${local_path}"
    fi
done

echo ""
echo "🔐 初始化私有仓库..."
echo ""

# 克隆或更新私有仓库
for repo_name in "${!PRIVATE_REPOS[@]}"; do
    repo_url="${PRIVATE_REPOS[$repo_name]}"
    local_path="${LOCAL_BASE}/${repo_name}"
    
    echo "  处理仓库: ${repo_name}"
    
    if [ -d "${local_path}/.git" ]; then
        echo "    ✅ 已存在，更新中..."
        cd "${local_path}"
        git pull origin main
    else
        echo "    📥 克隆中..."
        git clone "${repo_url}" "${local_path}"
    fi
done

echo ""
echo "=========================================="
echo "  ✅ 初始化完成!"
echo "=========================================="
echo ""
echo "📁 本地仓库位置: ${LOCAL_BASE}"
echo ""
echo "仓库列表:"
ls -la "${LOCAL_BASE}"
