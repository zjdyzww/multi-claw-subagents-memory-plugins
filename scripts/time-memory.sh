#!/bin/bash
# time-memory.sh - 全量记忆自带时间记忆和增量记忆 v2.0
#
# 核心能力：
# 1. 全量记忆 Commit（每个版本 = 全量快照 + 时间戳）
# 2. 增量 Commit（仅 diff 变化部分）
# 3. 分支管理（按时间段/项目/网关创建分支）
# 4. 历史回溯（任意时间点记忆状态）
# 5. 版本对比（diff 查看记忆演变）
#
# v2.0 (v12) 新增：
# 6. time-travel: 可视化时间线 (HTML)
# 7. time-compare: 多版本对比统计
# 8. time-alert: Webhook 变更通知
# 9. time-backup: 定时多仓备份
# 10. time-insight: 记忆演变分析报告
#
# 用法:
#   bash time-memory.sh full <repo> "<message>"
#   bash time-memory.sh time-travel <repo> [output.html]
#   bash time-memory.sh time-compare <repo> <v1> <v2>
#   bash time-memory.sh time-alert <repo> <webhook_url>
#   bash time-memory.sh time-backup [--install-cron]
#   bash time-memory.sh time-insight <repo> [days]

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
# v12 新增：time-travel — 可视化时间线 (HTML)
# ============================================================
cmd_time_travel() {
  local repo_name="${1:-main-memory-shared}"
  local output_file="${2:-time-travel-${DATE_TAG}.html}"

  check_repo "$repo_name" || return 1

  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"

  log_step "生成可视化时间线: $repo_name -> $output_file"
  echo ""

  # 收集提交历史数据
  local commits_json="["
  local first=true
  while IFS='|' read -r hash date subject author; do
    [[ -z "$hash" ]] && continue
    if [[ "$first" == false ]]; then commits_json+=","; fi
    first=false
    # escape JSON
    local escaped_subject=$(echo "$subject" | sed 's/"/\\"/g')
    local escaped_author=$(echo "$author" | sed 's/"/\\"/g')
    commits_json+="{\"hash\":\"$hash\",\"date\":\"$date\",\"subject\":\"$escaped_subject\",\"author\":\"$escaped_author\"}"
  done < <(git log --format="%h|%ad|%s|%an" --date=short -100 2>/dev/null)
  commits_json+="]"

  local total_commits=$(echo "$commits_json" | grep -o '"hash"' | wc -l)
  local first_date=$(git log --reverse --format="%ad" --date=short -1 2>/dev/null || echo "N/A")
  local last_date=$(git log --format="%ad" --date=short -1 2>/dev/null || echo "N/A")
  local branch_count=$(git branch -a 2>/dev/null | wc -l)
  local tag_count=$(git tag 2>/dev/null | wc -l)

  # 生成 HTML
  cat > "$output_file" << HTMLEOF
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>记忆时间线 — $repo_name</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background:#0d1117; color:#c9d1d9; padding:2rem; }
h1 { color:#58a6ff; margin-bottom:.5rem; }
.subtitle { color:#8b949e; margin-bottom:2rem; }
.stats { display:flex; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap; }
.stat { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:1rem 1.5rem; text-align:center; }
.stat .num { font-size:2rem; font-weight:700; color:#58a6ff; }
.stat .label { font-size:.8rem; color:#8b949e; }
.timeline { border-left:3px solid #30363d; padding-left:2rem; margin-left:1rem; }
.commit { position:relative; margin-bottom:1.5rem; padding:1rem; background:#161b22; border:1px solid #21262d; border-radius:6px; }
.commit::before { content:''; position:absolute; left:-2.45rem; top:1.2rem; width:12px; height:12px; background:#58a6ff; border-radius:50%; border:2px solid #0d1117; }
.commit .hash { font-family:monospace; color:#58a6ff; margin-right:.5rem; }
.commit .date { color:#8b949e; font-size:.9rem; margin-right:.5rem; }
.commit .subject { display:block; margin-top:.3rem; }
.commit .author { color:#6e7681; font-size:.85rem; margin-top:.3rem; }
.commit.type-full { border-left:3px solid #3fb950; }
.commit.type-inc { border-left:3px solid #d29922; }
.commit.type-snap { border-left:3px solid #a371f7; }
footer { margin-top:3rem; text-align:center; color:#484f58; font-size:.8rem; }
</style>
</head>
<body>
<h1>⏰ 记忆时间线</h1>
<p class="subtitle">仓库: $repo_name | 生成: $(date '+%Y-%m-%d %H:%M:%S')</p>
<div class="stats">
  <div class="stat"><div class="num">$total_commits</div><div class="label">提交数</div></div>
  <div class="stat"><div class="num">$first_date</div><div class="label">最早</div></div>
  <div class="stat"><div class="num">$last_date</div><div class="label">最新</div></div>
  <div class="stat"><div class="num">$branch_count</div><div class="label">分支</div></div>
  <div class="stat"><div class="num">$tag_count</div><div class="label">标签</div></div>
</div>
<div class="timeline" id="timeline"></div>
<footer>Generated by time-memory.sh v2.0 — Multi-Claw Memory Plugins</footer>
<script>
const data = $commits_json;
const tl = document.getElementById('timeline');
data.forEach(c => {
  const div = document.createElement('div');
  let cls = 'commit';
  if (c.subject.match(/\[FULL\]/)) cls += ' type-full';
  else if (c.subject.match(/\[INC\]/)) cls += ' type-inc';
  else if (c.subject.match(/snap/)) cls += ' type-snap';
  div.className = cls;
  div.innerHTML = '<span class="hash">' + c.hash + '</span>' +
    '<span class="date">' + c.date + '</span>' +
    '<span class="subject">' + c.subject + '</span>' +
    '<span class="author">— ' + c.author + '</span>';
  tl.appendChild(div);
});
</script>
</body>
</html>
HTMLEOF

  local filesize=$(wc -c < "$output_file" 2>/dev/null || echo "0")
  log_success "✅ 时间线已生成"
  echo ""
  echo "  文件: $output_file"
  echo "  大小: $filesize bytes"
  echo "  提交: $total_commits"
  echo "  打开: open $output_file"
}

# ============================================================
# v12 新增：time-compare — 多版本差异对比统计
# ============================================================
cmd_time_compare() {
  local repo_name="${1:-main-memory-shared}"
  local v1="${2:-HEAD~10}"
  local v2="${3:-HEAD}"

  check_repo "$repo_name" || return 1

  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"

  log_step "版本对比: $repo_name ($v1 → $v2)"
  echo ""

  local c1=$(git rev-parse --short "$v1" 2>/dev/null || echo "?")
  local c2=$(git rev-parse --short "$v2" 2>/dev/null || echo "?")
  local d1=$(git log -1 --format="%ad" --date=short "$v1" 2>/dev/null || echo "?")
  local d2=$(git log -1 --format="%ad" --date=short "$v2" 2>/dev/null || echo "?")

  # 统计
  local files_changed=$(git diff --name-only "$v1" "$v2" 2>/dev/null | wc -l)
  local insertions=$(git diff --numstat "$v1" "$v2" 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
  local deletions=$(git diff --numstat "$v1" "$v2" 2>/dev/null | awk '{sum+=$2} END {print sum+0}')
  local commits_between=$(git log --oneline "$v1..$v2" 2>/dev/null | wc -l)

  # 输出对比报告
  echo -e "${CYAN}═══ 版本对比报告 ═══${NC}"
  echo ""
  echo -e "  ${BLUE}版本 A:${NC} $c1 ($d1)"
  echo -e "  ${BLUE}版本 B:${NC} $c2 ($d2)"
  echo ""
  echo -e "  ${GREEN}━━ 变更统计 ━━${NC}"
  echo -e "  提交数:     ${YELLOW}$commits_between${NC}"
  echo -e "  变更文件:   ${YELLOW}$files_changed${NC}"
  echo -e "  新增行:     ${GREEN}+$insertions${NC}"
  echo -e "  删除行:     ${RED}-$deletions${NC}"
  echo -e "  净变更:     ${YELLOW}$((insertions - deletions))${NC}"

  local net=$((insertions - deletions))
  if [[ $net -gt 0 ]]; then
    echo -e "  趋势:       ${GREEN}📈 增长中${NC}"
  elif [[ $net -lt 0 ]]; then
    echo -e "  趋势:       ${RED}📉 缩减中${NC}"
  else
    echo -e "  趋势:       ${YELLOW}➡ 持平${NC}"
  fi
  echo ""

  # 按作者统计
  echo -e "  ${GREEN}━━ 作者贡献 ━━${NC}"
  git log --format="%an" "$v1..$v2" 2>/dev/null | sort | uniq -c | sort -rn | while read count author; do
    echo -e "  $author: ${YELLOW}$count${NC} commits"
  done
  echo ""

  # 变更文件列表 (top 10)
  echo -e "  ${GREEN}━━ Top 10 变更文件 ━━${NC}"
  git diff --stat "$v1" "$v2" 2>/dev/null | tail -1
  git diff --numstat "$v1" "$v2" 2>/dev/null | sort -rn | head -10 | awk '{printf "  +%-5s -%-5s %s\n", $1, $2, $3}'
  echo ""

  # 分类统计
  local full_count=$(git log --oneline "$v1..$v2" 2>/dev/null | grep -c "\[FULL\]" || echo 0)
  local inc_count=$(git log --oneline "$v1..$v2" 2>/dev/null | grep -c "\[INC\]" || echo 0)
  echo -e "  ${GREEN}━━ 提交类型 ━━${NC}"
  echo -e "  全量提交: $full_count"
  echo -e "  增量提交: $inc_count"

  log_success "✅ 对比报告完成"
}

# ============================================================
# v12 新增：time-alert — Webhook 变更通知
# ============================================================
cmd_time_alert() {
  local repo_name="${1:-main-memory-shared}"
  local webhook_url="${2:-}"

  check_repo "$repo_name" || return 1

  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"

  if [[ -z "$webhook_url" ]]; then
    log_warn "未提供 Webhook URL，使用模拟模式"
    echo ""
  fi

  log_step "变更通知: $repo_name"
  echo ""

  # 获取最近一次提交
  local latest_hash=$(git log -1 --format="%h" 2>/dev/null || echo "?")
  local latest_subject=$(git log -1 --format="%s" 2>/dev/null || echo "?")
  local latest_author=$(git log -1 --format="%an" 2>/dev/null || echo "?")
  local latest_date=$(git log -1 --format="%ad" --date=iso 2>/dev/null || echo "?")
  local files_changed=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | wc -l)

  # 构建通知 payload
  local alert_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%SZ')

  local markdown_content="## 🔔 记忆变更通知

**仓库**: $repo_name
**提交**: $latest_hash
**时间**: $latest_date
**作者**: $latest_author
**消息**: $latest_subject
**变更文件**: $files_changed"

  # 钉钉 / 企微 Markdown 格式
  local dingtalk_payload=$(cat << PAYLOAD
{
  "msgtype": "markdown",
  "markdown": {
    "title": "记忆变更: $repo_name",
    "text": "$markdown_content"
  },
  "at": {
    "isAtAll": false
  }
}
PAYLOAD
)

  # 企微格式
  local wecom_payload=$(cat << PAYLOAD
{
  "msgtype": "markdown",
  "markdown": {
    "content": "$markdown_content"
  }
}
PAYLOAD
)

  # 通用 Webhook 格式 (Slack compatible)
  local slack_payload=$(cat << PAYLOAD
{
  "text": "🔔 Memory Update in *$repo_name*",
  "blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "🔔 记忆变更"}},
    {"type": "section", "fields": [
      {"type": "mrkdwn", "text": "*仓库:*\n$repo_name"},
      {"type": "mrkdwn", "text": "*提交:*\n$latest_hash"},
      {"type": "mrkdwn", "text": "*作者:*\n$latest_author"},
      {"type": "mrkdwn", "text": "*文件:*\n$files_changed"}
    ]},
    {"type": "section", "text": {"type": "mrkdwn", "text": "$latest_subject"}},
    {"type": "context", "elements": [{"type": "mrkdwn", "text": "$latest_date"}]}
  ]
}
PAYLOAD
)

  if [[ -n "$webhook_url" ]]; then
    # 尝试用 curl 发送 (通用格式)
    if command -v curl &> /dev/null; then
      local response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$slack_payload" \
        "$webhook_url" 2>/dev/null || echo "000")

      local latency=$( (time curl -s -o /dev/null -X POST -H "Content-Type: application/json" -d "{}" "$webhook_url" 2>/dev/null) 2>&1 | grep real | awk '{print $2}' || echo "?")
      log_info "HTTP 状态: $response"
      log_info "延迟: ${latency:-?}"
    else
      log_warn "curl 不可用，跳过实际发送"
    fi
  else
    log_info "模拟模式 — 通知内容预览:"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "$markdown_content"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  fi

  echo ""
  log_success "✅ 通知生成完成"
  echo ""
  echo "  钉钉格式: $(echo "$dingtalk_payload" | wc -c) bytes"
  echo "  企微格式: $(echo "$wecom_payload" | wc -c) bytes"
  echo "  Slack格式: $(echo "$slack_payload" | wc -c) bytes"
}

# ============================================================
# v12 新增：time-backup — 定时多仓自动备份
# ============================================================
cmd_time_backup() {
  local mode="${1:-run}"
  local backup_dir="${2:-${HOME}/.openclaw/memory-backups}"

  if [[ "$mode" == "--install-cron" ]]; then
    log_step "安装定时备份任务 (cron)"
    echo ""

    local script_path="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/time-memory.sh"
    local cron_line="0 */6 * * * bash $script_path time-backup run >> ${HOME}/.openclaw/time-backup.log 2>&1"

    log_info "建议的 cron 配置:"
    echo ""
    echo -e "  ${YELLOW}$cron_line${NC}"
    echo ""
    echo "  手动安装:"
    echo "    crontab -e"
    echo "    # 添加以下行:"
    echo "    $cron_line"
    echo ""
    log_info "每 6 小时自动备份到 Gitea 多仓库"
    return 0
  fi

  log_step "多仓自动备份"
  echo ""

  mkdir -p "$backup_dir"

  local success_count=0
  local fail_count=0
  local total_repos=0
  local backup_timestamp=$(date '+%Y-%m-%d_%H-%M-%S')

  for repo in "${REPOSitoriES[@]}"; do
    total_repos=$((total_repos + 1))
    local repo_path=$(get_repo_path "$repo")

    if [[ ! -d "$repo_path/.git" ]]; then
      log_warn "跳过 $repo (不存在)"
      fail_count=$((fail_count + 1))
      continue
    fi

    cd "$repo_path"

    # 1. Git bundle 备份
    local bundle_file="$backup_dir/${repo}-${backup_timestamp}.bundle"
    if git bundle create "$bundle_file" --all 2>/dev/null; then
      log_info "✅ $repo bundle: $(du -h "$bundle_file" 2>/dev/null | cut -f1)"
    else
      log_warn "⚠ $repo bundle 失败，使用 tar"
      tar -czf "$backup_dir/${repo}-${backup_timestamp}.tar.gz" -C "$repo_path" . 2>/dev/null
    fi

    # 2. 推送到远程 (作为在线备份)
    if git push origin main 2>/dev/null; then
      log_info "✅ $repo push 成功"
      success_count=$((success_count + 1))
    else
      log_warn "⚠ $repo push 失败"
      fail_count=$((fail_count + 1))
    fi

    echo ""
  done

  # 清理旧备份 (保留最近 10 个)
  for repo in "${REPOSitoriES[@]}"; do
    ls -t "$backup_dir/${repo}-"*.bundle 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    ls -t "$backup_dir/${repo}-"*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
  done

  local backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "?")

  log_success "✅ 备份完成"
  echo ""
  echo "  仓库数:     $total_repos"
  echo "  成功推送:   $success_count"
  echo "  失败:       $fail_count"
  echo "  备份目录:   $backup_dir"
  echo "  目录大小:   $backup_size"

  if [[ $total_repos -gt 0 ]]; then
    local success_rate=$(( success_count * 100 / total_repos ))
    if [[ $success_rate -ge 99 ]]; then
      log_success "成功率: ${success_rate}% ≥ 99% ✅"
    else
      log_warn "成功率: ${success_rate}% < 99% ⚠"
    fi
  fi
}

# ============================================================
# v12 新增：time-insight — 记忆演变分析报告
# ============================================================
cmd_time_insight() {
  local repo_name="${1:-main-memory-shared}"
  local days="${2:-30}"
  local output_file="time-insight-${repo_name}-${DATE_TAG}.md"

  check_repo "$repo_name" || return 1

  local repo_path=$(get_repo_path "$repo_name")
  cd "$repo_path"

  log_step "记忆演变分析: $repo_name (近 $days 天)"
  echo ""

  local since_date=$(date -d "$days days ago" '+%Y-%m-%d' 2>/dev/null || date -v-${days}d '+%Y-%m-%d' 2>/dev/null || echo "2026-01-01")

  # 统计数据
  local total_commits=$(git log --oneline --since="$since_date" 2>/dev/null | wc -l)
  local total_authors=$(git log --format="%an" --since="$since_date" 2>/dev/null | sort -u | wc -l)
  local total_files=$(git log --name-only --since="$since_date" --format="" 2>/dev/null | sort -u | wc -l)
  local total_insertions=$(git log --numstat --since="$since_date" 2>/dev/null | awk '{sum+=$1} END {print sum+0}')
  local total_deletions=$(git log --numstat --since="$since_date" 2>/dev/null | awk '{sum+=$2} END {print sum+0}')
  local peak_day=$(git log --format="%ad" --date=short --since="$since_date" 2>/dev/null | sort | uniq -c | sort -rn | head -1 | awk '{print $2" ("$1" commits)"}' || echo "N/A")

  # 高峰期分析
  local peak_hour=$(git log --format="%ad" --date=format:"%H" --since="$since_date" 2>/dev/null | sort | uniq -c | sort -rn | head -1 | awk '{print $2":00 ("$1" commits)"}' || echo "N/A")

  # 用 --date=format-local 获取星期分布
  local most_active_day=$(git log --format="%ad" --date=format-local:"%a" --since="$since_date" 2>/dev/null | sort | uniq -c | sort -rn | head -1 | awk '{print $2" ("$1" commits)"}' || echo "N/A")

  # 生成 Markdown 报告
  cat > "$output_file" << REPORTEOF
# 📊 记忆演变分析报告

> **仓库**: $repo_name
> **分析周期**: $since_date → $(date '+%Y-%m-%d')
> **生成时间**: $(date '+%Y-%m-%d %H:%M:%S')

---

## 1. 总览

| 指标 | 数值 |
|------|------|
| 总提交数 | **$total_commits** |
| 活跃作者 | $total_authors |
| 涉及文件 | $total_files |
| 新增行数 | $total_insertions |
| 删除行数 | $total_deletions |
| 净变更 | $((total_insertions - total_deletions)) |
| 日均提交 | $(awk "BEGIN {printf \"%.1f\", $total_commits / $days}") |

---

## 2. 活跃度分析

- **最高产日**: $peak_day
- **最活跃时段**: $peak_hour
- **最活跃星期**: $most_active_day

---

## 3. 提交趋势（按天）

\`\`\`
$(git log --format="%ad" --date=short --since="$since_date" 2>/dev/null | sort | uniq -c | sort -k2 | awk '{printf "%-12s %s\n", $2, sprintf("%*s", $1, "") gsub(/ /, "█")}' | sed "s/ / /g" || echo "N/A")
\`\`\`

---

## 4. 作者贡献

| 作者 | 提交数 | 占比 |
|------|--------|------|
$(git log --format="%an" --since="$since_date" 2>/dev/null | sort | uniq -c | sort -rn | awk -v total=$total_commits '{pct=sprintf("%.1f%%", $1/total*100); printf "| %s | %s | %s |\n", $2, $1, pct}' || echo "N/A")

---

## 5. 提交类型分布

| 类型 | 数量 |
|------|------|
| 🟢 全量快照 (FULL) | $(git log --oneline --since="$since_date" 2>/dev/null | grep -c "\[FULL\]" || echo 0) |
| 🟡 增量更新 (INC) | $(git log --oneline --since="$since_date" 2>/dev/null | grep -c "\[INC\]" || echo 0) |

---

## 6. 高频变更文件 Top 10

| 文件 | 变更次数 |
|------|----------|
$(git log --name-only --since="$since_date" --format="" 2>/dev/null | sort | uniq -c | sort -rn | head -10 | awk '{printf "| %s | %s |\n", $2, $1}' || echo "N/A")

---

## 7. 建议

$(if [[ $total_commits -lt 5 ]]; then
  echo "- ⚠ 提交频率偏低，建议增加记忆同步频率"
elif [[ $total_commits -gt 100 ]]; then
  echo "- 📈 提交活跃度高，考虑定期 squash 合并"
fi
if [[ $total_deletions -gt $total_insertions ]]; then
  echo "- 📉 删除多于新增，可能在进行记忆清理"
fi
if [[ $total_authors -le 1 ]]; then
  echo "- 👤 仅单一作者贡献，建议多代理协作"
fi
echo "- ✅ 建议启用 time-alert 实现关键变更实时通知"
echo "- ✅ 建议配置 time-backup 定时多仓备份")

---

> 本报告由 time-memory.sh v2.0 自动生成 | Multi-Claw Memory Plugins
REPORTEOF

  log_success "✅ 分析报告已生成"
  echo ""
  echo "  文件: $output_file"
  echo "  周期: $since_date → 今天"
  echo "  提交: $total_commits 个"
  echo "  作者: $total_authors 人"
  echo ""
  echo "  查看: cat $output_file"
}

# ============================================================
# 帮助信息
# ============================================================
show_help() {
  cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║  time-memory.sh - 全量记忆自带时间记忆和增量记忆 v2.0      ║
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
║  ─ v2.0 增强命令 ─                                        ║
║                                                          ║
║  time-travel <repo> [out] HTML时间线可视化               ║
║  time-compare <repo> <v1> <v2> 多版本统计对比             ║
║  time-alert <repo> [url] Webhook变更通知                 ║
║  time-backup [--install-cron] 多仓定时备份                ║
║  time-insight <repo> [days] 记忆演变分析报告              ║
║                                                          ║
║  ─ 维护命令 ─                                             ║
║                                                          ║
║  gc <repo>               垃圾回收和优化                    ║
║  sync-all               同步所有仓库                      ║
║  snap-all               批量创建全量快照                  ║
║                                                          ║
║  ─ 示例 ─                                                 ║
║                                                          ║
║  bash time-memory.sh time-travel main-memory-shared       ║
║  bash time-memory.sh time-compare main HEAD~20 HEAD       ║
║  bash time-memory.sh time-alert main https://hooks.xxx    ║
║  bash time-memory.sh time-backup --install-cron           ║
║  bash time-memory.sh time-insight main-memory-shared 90   ║
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
    full|inc|snap|branch|timegoto|history|diff|log|gc|sync-all|snap-all|time-travel|time-compare|time-alert|time-backup|time-insight)
      cmd_"${command//-/_}" "$@"
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