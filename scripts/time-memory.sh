#!/bin/bash
# time-memory.sh - 全量记忆自带时间记忆和增量记忆 v1.0
#
# 核心能力：
# 1. 全量记忆 Commit（每个版本 = 全量快照 + 时间戳）
# 2. 增量 Commit（仅 diff 变化部分）
# 3. 分支管理（按时间段/项目/网关创建分支）
# 4. 历史回溯（任意时间点记忆状态）
# 5. 版本对比（diff 查看记忆演变）
#
# 用法:
#   bash time-memory.sh full <repo> "<message>"     # 全量提交
#   bash time-memory.sh inc  <repo> "<message>"     # 增量提交
#   bash time-memory.sh snap <repo>                # 创建时间戳快照
#   bash time-memory.sh branch <repo> <name>       # 创建分支
#   bash time-memory.sh timegoto <repo> <date>    # 回溯到指定时间
#   bash time-memory.sh history <repo> [n]        # 查看历史
#   bash time-memory.sh diff <repo> <v1> <v2>     # 版本对比
#   bash time-memory.sh log <repo>                 # 时间线视图
#   bash time-memory.sh gc <repo>                  # 垃圾回收优化

set -e

LOCAL_BASE="${HOME}/.openclaw/memory"
REPOSitoriES=(
  "main-memory-shared"
  "business-memory-shared"
  "code-memory-shared"
  "openclaw-1-memory-private"
)

# 时间格式
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
DATE_TAG=$(date '+%Y-%m-%d')
ISO_NOW=$(date -Iseconds)

# 路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_PLUGINS_DIR="$(dirname "$SCRIPT_DIR")"

# ============================================================
# 工具函数
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# 获取仓库本地路径
get_repo_path() {
  local repo_name="$1"
  echo "${LOCAL_BASE}/${repo_name}"
}

# 检查仓库是否存在
check_repo() {
  local repo_path=$(get_repo_path "$1")
  if [[ ! -d "$repo_path/.git" ]]; then
    log_error "仓库不存在: $repo_path"
    return 1
  fi
  return 0
}

# 获取仓库当前状态
get_repo_status() {
  local repo_path=$(get_repo_path "$1")
  cd "$repo_path"
  
  # 获取变更文件数
  CHANGED=$(git status --porcelain | wc -l)
  
  # 获取未提交变更
  if [[ "$CHANGED" -gt 0 ]]; then
    echo "modified:$CHANGED"
  else
    echo "clean"
  fi
}

# 获取上次提交的时间
get_last_commit_time() {
  local repo_path=$(get_repo_path "$1")
  cd "$repo_path"
  git log -1 --format='%ci' 2>/dev/null || echo ""
}

# ============================================================
# 命令：全量提交（Full Commit）
# ============================================================
cmd_full() {
  local repo_name="${1:-main-memory-shared}"
  local message="${2:-Full memory snapshot}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "全量提交: $repo_name"
  echo ""
  
  # Stage 所有变更
  git add -A
  
  # 检查是否有变更
  if git diff --cached --quiet; then
    log_warn "没有变更需要提交"
    return 0
  fi
  
  # 创建全量快照 Tag
  local tag_name="v${DATE_TAG}-full"
  
  # 提交
  git commit -m "[FULL] ${message}
  
📦 全量快照: ${DATE_TAG} ${TIMESTAMP}
🕐 时间戳: ${ISO_NOW}
📊 仓库: ${repo_name}
🔖 Tag: ${tag_name}"
  
  # 创建 Tag
  git tag -a "$tag_name" -m "全量快照 ${DATE_TAG}" 2>/dev/null || true
  
  log_success "✅ 全量提交完成"
  echo ""
  echo "  Commit: $(git rev-parse --short HEAD)"
  echo "  Tag: $tag_name"
  echo "  消息: $message"
}

# ============================================================
# 命令：增量提交（Incremental Commit）
# ============================================================
cmd_inc() {
  local repo_name="${1:-main-memory-shared}"
  local message="${2:-Incremental update}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "增量提交: $repo_name"
  echo ""
  
  # Stage 所有变更
  git add -A
  
  # 检查是否有变更
  if git diff --cached --quiet; then
    log_warn "没有变更需要提交"
    return 0
  fi
  
  # 获取变更统计
  CHANGED_FILES=$(git diff --cached --stat | tail -1 | awk '{print $1}')
  INSERTIONS=$(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')
  DELETIONS=$(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')
  
  # 创建增量 Tag
  local tag_name="v${DATE_TAG}-inc-${CHANGED_FILES}f"
  
  # 提交
  git commit -m "[INC] ${message}
  
📈 增量更新: ${DATE_TAG} ${TIMESTAMP}
🕐 时间戳: ${ISO_NOW}
📊 仓库: ${repo_name}
📝 变更: ${CHANGED_FILES} 文件 | +${INSERTIONS} | -${DELETIONS}
🔖 Tag: ${tag_name}"
  
  # 创建 Tag
  git tag -a "$tag_name" -m "增量更新 ${DATE_TAG}" 2>/dev/null || true
  
  log_success "✅ 增量提交完成"
  echo ""
  echo "  Commit: $(git rev-parse --short HEAD)"
  echo "  Tag: $tag_name"
  echo "  变更: $CHANGED_FILES 文件 (+$INSERTIONS -$DELETIONS)"
}

# ============================================================
# 命令：创建时间戳快照（Snapshot）
# ============================================================
cmd_snap() {
  local repo_name="${1:-main-memory-shared}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "创建时间戳快照: $repo_name"
  echo ""
  
  # 获取当前分支
  local current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")
  
  # 创建快照分支：snapshots/YYYY-MM-DD_HH-MM-SS
  local snapshot_branch="snapshots/${TIMESTAMP}"
  
  # 检查是否有未提交的变更
  STATUS=$(get_repo_status "$repo_name")
  if [[ "$STATUS" != "clean" ]]; then
    log_warn "存在未提交的变更，先提交..."
    cmd_full "$repo_name" "Auto-snap before branch"
  fi
  
  # 创建快照分支
  git checkout -b "$snapshot_branch" 2>/dev/null || {
    log_info "快照分支已存在，更新..."
    git checkout "$snapshot_branch"
  }
  
  # 切回原分支
  git checkout "$current_branch" >/dev/null 2>&1
  
  log_success "✅ 快照创建完成"
  echo ""
  echo "  分支: $snapshot_branch"
  echo "  时间: $TIMESTAMP"
  echo "  用途: git checkout $snapshot_branch 查看该时间点状态"
}

# ============================================================
# 命令：创建分支（Branch）
# ============================================================
cmd_branch() {
  local repo_name="${1:-main-memory-shared}"
  local branch_name="${2:-feature-new-memory}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "创建分支: $repo_name -> $branch_name"
  echo ""
  
  # 创建分支
  if git checkout -b "$branch_name" 2>/dev/null; then
    log_success "✅ 分支创建完成"
    echo ""
    echo "  分支: $branch_name"
    echo "  切换到新分支"
  else
    if git show-ref --quiet "refs/heads/$branch_name"; then
      log_warn "分支已存在，切换到该分支..."
      git checkout "$branch_name"
    else
      log_error "创建分支失败"
      return 1
    fi
  fi
  
  echo ""
  echo "  用法:"
  echo "    git checkout $branch_name        # 切换到分支"
  echo "    git merge $branch_name          # 合并分支"
}

# ============================================================
# 命令：时间回溯（Time Goto）
# ============================================================
cmd_timegoto() {
  local repo_name="${1:-main-memory-shared}"
  local target_date="${2:-2026-05-01}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "时间回溯: $repo_name -> $target_date"
  echo ""
  
  # 保存当前状态
  local current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || echo "detached")
  local stash_msg="pre-timegoto-$(date +%s)"
  
  # 暂存当前变更
  if git status --porcelain | grep -q .; then
    log_info "暂存当前变更..."
    git stash push -m "$stash_msg" 2>/dev/null || true
  fi
  
  # 查找目标日期的提交
  local target_commit=$(git log --before="$target_date 23:59:59" --format="%H" -1 2>/dev/null || echo "")
  
  if [[ -z "$target_commit" ]]; then
    # 尝试模糊匹配
    target_commit=$(git log --before="$target_date" --format="%H" -1 2>/dev/null || echo "")
  fi
  
  if [[ -z "$target_commit" ]]; then
    log_error "找不到 $target_date 的提交记录"
    return 1
  fi
  
  local target_short=$(echo "$target_commit" | cut -c1-7)
  local commit_msg=$(git log -1 --format="%s" "$target_commit")
  local commit_date=$(git log -1 --format="%ci" "$target_commit")
  
  log_info "找到提交: $target_short"
  log_info "提交消息: $commit_msg"
  log_info "提交时间: $commit_date"
  echo ""
  
  # 检出目标提交
  git checkout "$target_commit" --detach 2>/dev/null
  
  log_success "✅ 已回溯到 $target_date"
  echo ""
  echo "  ⚠️  当前处于 detached HEAD 状态"
  echo "  提交: $target_short"
  echo "  日期: $commit_date"
  echo ""
  echo "  恢复到原分支: git checkout $current_branch"
  echo "  查看当时状态后，可用 git checkout $current_branch 返回"
}

# ============================================================
# 命令：查看历史（History）
# ============================================================
cmd_history() {
  local repo_name="${1:-main-memory-shared}"
  local limit="${2:-10}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "历史记录: $repo_name (最近 $limit 条)"
  echo ""
  
  git log --oneline -n "$limit" --format="▸ %h | %ad | %s" --date=short
}

# ============================================================
# 命令：版本对比（Diff）
# ============================================================
cmd_diff() {
  local repo_name="${1:-main-memory-shared}"
  local v1="${2:-HEAD~1}"
  local v2="${3:-HEAD}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "版本对比: $repo_name ($v1 vs $v2)"
  echo ""
  
  # 解析版本
  local commit1=$(git rev-parse "$v1" 2>/dev/null || echo "")
  local commit2=$(git rev-parse "$v2" 2>/dev/null || echo "")
  
  if [[ -z "$commit1" ]] || [[ -z "$commit2" ]]; then
    log_error "版本解析失败"
    return 1
  fi
  
  local short1=$(echo "$commit1" | cut -c1-7)
  local short2=$(echo "$commit2" | cut -c1-7)
  
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${v1}: ${short1}"
  echo -e "  ${v2}: ${short2}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  # 文件变化统计
  echo -e "${BLUE}[文件变化]${NC}"
  git diff --stat "$commit1" "$commit2" 2>/dev/null || true
  echo ""
  
  # 详细内容
  echo -e "${BLUE}[详细变更]${NC}"
  git diff --no-color "$commit1" "$commit2" 2>/dev/null || true
}

# ============================================================
# 命令：时间线视图（Log Timeline）
# ============================================================
cmd_log() {
  local repo_name="${1:-main-memory-shared}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "时间线视图: $repo_name"
  echo ""
  
  # 获取所有分支
  local branches=$(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -v "main\|master" | head -20)
  
  # 获取最近的提交，按日期分组
  echo -e "${CYAN}═══ 时间线 ═══${NC}"
  echo ""
  
  git log --graph --format="%C(yellow)%h%Creset %C(bold blue)%ad%Creset %C(bold)%s%Creset%C(red)%d%Creset %C(green)%an%Creset" --date=short -20
  echo ""
  
  # 列出快照分支
  if [[ -n "$branches" ]]; then
    echo -e "${CYAN}═══ 快照分支 ═══${NC}"
    echo ""
    echo "$branches" | while read -r branch; do
      local last_commit=$(git log -1 --format="  %ci  " "$branch" 2>/dev/null || echo "")
      echo -e "  ${GREEN}$branch${NC} $last_commit"
    done
  fi
  
  # 列出 Tags
  echo ""
  echo -e "${CYAN}═══ 版本标签 ═══${NC}"
  echo ""
  git tag --list "v*" 2>/dev/null | tail -20 | while read -r tag; do
    local tag_msg=$(git tag -l "$tag" --format="%(subject)" 2>/dev/null || echo "")
    echo -e "  ${YELLOW}$tag${NC} $tag_msg"
  done
}

# ============================================================
# 命令：垃圾回收（GC）
# ============================================================
cmd_gc() {
  local repo_name="${1:-main-memory-shared}"
  
  check_repo "$repo_name" || return 1
  
  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"
  
  log_step "垃圾回收: $repo_name"
  echo ""
  
  # 获取当前仓库大小
  local before_size=$(du -sh "$repo_path" 2>/dev/null | cut -f1)
  
  log_info "清理前: $before_size"
  echo ""
  
  # 执行 GC
  git -C "$repo_path" gc --aggressive --prune=now 2>/dev/null || true
  
  # 优化
  git -C "$repo_path" repack -ad 2>/dev/null || true
  
  # 获取清理后大小
  local after_size=$(du -sh "$repo_path" 2>/dev/null | cut -f1)
  
  echo ""
  log_success "✅ 清理完成"
  echo ""
  echo "  清理前: $before_size"
  echo "  清理后: $after_size"
  
  # 验证
  echo ""
  echo -e "${BLUE}[仓库健康检查]${NC}"
  git fsck --full 2>/dev/null | tail -3 || true
}

# ============================================================
# 命令：同步所有仓库
# ============================================================
cmd_sync_all() {
  log_step "同步所有记忆仓库"
  echo ""
  
  for repo in "${REPOSitoriES[@]}"; do
    local repo_path=$(get_repo_path "$repo")
    
    if [[ -d "$repo_path/.git" ]]; then
      log_info "同步 $repo..."
      cd "$repo_path"
      
      # 暂存变更
      if git status --porcelain | grep -q .; then
        git add -A
        git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
      fi
      
      # 拉取
      git pull --rebase origin main 2>/dev/null || true
      
      # 推送
      git push origin main 2>/dev/null || true
      
      echo ""
    fi
  done
  
  log_success "✅ 全部同步完成"
}

# ============================================================
# 命令：批量全量快照
# ============================================================
cmd_snap_all() {
  log_step "批量创建全量快照"
  echo ""
  
  for repo in "${REPOSitoriES[@]}"; do
    local repo_path=$(get_repo_path "$repo")
    
    if [[ -d "$repo_path/.git" ]]; then
      log_info "快照 $repo..."
      cmd_snap "$repo"
      echo ""
    fi
  done
  
  log_success "✅ 全部快照创建完成"
}

# ============================================================
# 帮助信息
# ============================================================
show_help() {
  cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║  time-memory.sh - 全量记忆自带时间记忆和增量记忆 v1.0      ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  用法: bash time-memory.sh <command> [args...]           ║
║                                                          ║
║  ─ 时间记忆命令 ─                                         ║
║                                                          ║
║  full <repo> "<msg>"    全量提交（每个版本=全量快照+时间） ║
║  inc  <repo> "<msg>"    增量提交（仅提交变更部分）         ║
║  snap <repo>            创建时间戳快照分支                ║
║                                                          ║
║  ─ 分支管理命令 ─                                         ║
║                                                          ║
║  branch <repo> <name>   创建新分支                        ║
║  timegoto <repo> <date> 回溯到指定日期                    ║
║                                                          ║
║  ─ 历史查询命令 ─                                         ║
║                                                          ║
║  history <repo> [n]     查看最近 n 条历史（默认10条）     ║
║  diff <repo> <v1> <v2>  对比两个版本差异                 ║
║  log <repo>             时间线视图                       ║
║                                                          ║
║  ─ 维护命令 ─                                             ║
║                                                          ║
║  gc <repo>               垃圾回收和优化                    ║
║  sync-all               同步所有仓库                      ║
║  snap-all               批量创建全量快照                  ║
║                                                          ║
║  ─ 示例 ─                                                 ║
║                                                          ║
║  bash time-memory.sh full main-memory-shared "重要决策"    ║
║  bash time-memory.sh inc  main-memory-shared "更新配置"    ║
║  bash time-memory.sh history main-memory-shared 20        ║
║  bash time-memory.sh timegoto main-memory-shared 2026-05-01║
║  bash time-memory.sh diff main-memory-shared HEAD~5 HEAD  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
}

# ============================================================
# 主函数
# ============================================================

main() {
  local command="${1:-help}"
  shift || true
  
  case "$command" in
    full|inc|snap|branch|timegoto|history|diff|log|gc|sync-all|snap-all)
      cmd_"$command" "$@"
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      log_error "未知命令: $command"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

main "$@"