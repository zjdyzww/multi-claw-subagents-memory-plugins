#!/bin/bash
# upgrade.sh - Multi-Claw Memory Plugins 版本升级脚本 v1.0
#
# 功能:
# 1. 检测当前版本
# 2. 获取最新版本
# 3. 比较版本差异
# 4. 执行升级
# 5. 迁移配置
# 6. 更新记忆宫殿
#
# 用法:
#   bash upgrade.sh [--check] [--dry-run] [--force]
#
# 示例:
#   bash upgrade.sh              # 检查并升级
#   bash upgrade.sh --check      # 仅检查版本
#   bash upgrade.sh --dry-run    # 预览升级内容
#   bash upgrade.sh --force      # 强制升级

set -e

# 默认配置
LOCAL_PATH="${LOCAL_PATH:-$HOME/.openclaw/memory-plugins}"
GITGROUP="${GITGROUP:-claws-memory}"
REMOTE_URL="https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins"

# 解析参数
CHECK_ONLY=false
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --check) CHECK_ONLY=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force) FORCE=true; shift ;;
    *) shift ;;
  esac
done

# 颜色输出
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

# 打印横幅
print_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                                          ║${NC}"
  echo -e "${CYAN}║   Multi-Claw Memory Plugins Upgrade Script v1.0      ║${NC}"
  echo -e "${CYAN}║   版本升级脚本                                        ║${NC}"
  echo -e "${CYAN}║                                                          ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# 获取当前版本
get_local_version() {
  if [[ -f "$LOCAL_PATH/VERSION" ]]; then
    cat "$LOCAL_PATH/VERSION"
  else
    echo "unknown"
  fi
}

# 获取最新版本
get_remote_version() {
  curl -sL "$REMOTE_URL/raw/main/VERSION" 2>/dev/null || echo "unknown"
}

# 比较版本
compare_versions() {
  local v1="$1"
  local v2="$2"
  
  if [[ "$v1" == "$v2" ]]; then
    echo "equal"
  elif [[ "$v1" == "unknown" ]] || [[ "$v2" == "unknown" ]]; then
    echo "unknown"
  else
    # 简单比较：假设版本格式为 X.Y
    local v1_major=$(echo "$v1" | cut -d. -f1)
    local v1_minor=$(echo "$v1" | cut -d. -f2)
    local v2_major=$(echo "$v2" | cut -d. -f1)
    local v2_minor=$(echo "$v2" | cut -d. -f2)
    
    if (( v1_major > v2_major )) || \
       (( v1_major == v2_major && v1_minor > v2_minor )); then
      echo "newer"
    else
      echo "older"
    fi
  fi
}

# 显示当前配置
show_current_config() {
  log_step "当前配置..."
  
  local_version=$(get_local_version)
  remote_version=$(get_remote_version)
  
  echo ""
  echo -e "  本地版本: ${GREEN}$local_version${NC}"
  echo -e "  最新版本: ${GREEN}$remote_version${NC}"
  echo "  安装路径: $LOCAL_PATH"
  echo "  Git 组: $GITGROUP"
  echo ""
  
  # 比较版本
  case $(compare_versions "$local_version" "$remote_version") in
    equal)
      echo -e "  ${GREEN}✅ 版本一致，无需升级${NC}"
      ;;
    older)
      echo -e "  ${YELLOW}⚠️  发现新版本: $local_version → $remote_version${NC}"
      ;;
    newer)
      echo -e "  ${BLUE}ℹ️  本地版本较新 (预览版?)${NC}"
      ;;
    unknown)
      echo -e "  ${YELLOW}⚠️  版本检测失败${NC}"
      ;;
  esac
  echo ""
}

# 备份当前安装
backup_current() {
  log_step "备份当前安装..."
  
  local backup_dir="$LOCAL_PATH.backup.$(date +%Y%m%d_%H%M%S)"
  
  if [[ -d "$LOCAL_PATH" ]]; then
    cp -r "$LOCAL_PATH" "$backup_dir"
    log_success "  备份已创建: $backup_dir"
    echo "$backup_dir"
  else
    log_warn "  未找到当前安装，跳过备份"
    echo ""
  fi
}

# 获取升级日志
get_upgrade_log() {
  local from_version="$1"
  local to_version="$2"
  
  curl -sL "$REMOTE_URL/raw/main/docs/UPGRADE.md" 2>/dev/null | head -100
}

# 执行升级
do_upgrade() {
  log_step "执行升级..."
  
  local current_version=$(get_local_version)
  local latest_version=$(get_remote_version)
  
  # 检查是否需要升级
  if [[ "$current_version" == "$latest_version" ]] && [[ "$FORCE" != "true" ]]; then
    log_success "  版本已是最新，无需升级"
    return 0
  fi
  
  # 创建备份
  backup_dir=$(backup_current)
  
  # 切换到安装目录
  cd "$LOCAL_PATH"
  
  # 保存 Git 凭据
  git remote -v | grep "origin" | grep "push" || true
  ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")
  
  # 升级主仓库
  log_info "  拉取最新代码..."
  git fetch origin main 2>/dev/null || true
  
  # 检查是否有更新
  BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
  
  if [[ "$BEHIND" == "0" ]] && [[ "$FORCE" != "true" ]]; then
    log_success "  代码已是最新"
  else
    log_info "  拉取 $BEHIND 个提交..."
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/main
    git submodule update --init --recursive 2>/dev/null || true
    log_success "  代码更新完成"
  fi
  
  # 更新版本号文件
  echo "$latest_version" > VERSION
  git add VERSION
  git commit -m "chore: Update version to $latest_version" 2>/dev/null || true
  git push origin main 2>/dev/null || true
  
  # 更新记忆宫殿
  log_info "  更新记忆宫殿..."
  update_memory_palace
  
  # 更新 skills
  log_info "  更新 Skills..."
  update_skills
  
  log_success "  升级完成!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  升级摘要:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $current_version → $latest_version"
  echo "  备份: $backup_dir"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 更新记忆宫殿
update_memory_palace() {
  # 更新 OpenClaw 记忆宫殿
  if [[ -d "$HOME/.openclaw/memory-palace" ]]; then
    mkdir -p "$HOME/.openclaw/memory-palace.backup"
    cp -r "$HOME/.openclaw/memory-palace/"* "$HOME/.openclaw/memory-palace.backup/" 2>/dev/null || true
    cp -r "$LOCAL_PATH/.memory-palace/openclaw/"* "$HOME/.openclaw/memory-palace/" 2>/dev/null || true
    log_info "    ✅ OpenClaw 记忆宫殿已更新"
  fi
  
  # 更新 Hermes 记忆宫殿
  if [[ -d "$HOME/.hermes/memories" ]]; then
    mkdir -p "$HOME/.hermes/memories.backup"
    cp -r "$HOME/.hermes/memories/"* "$HOME/.hermes/memories.backup/" 2>/dev/null || true
    cp -r "$LOCAL_PATH/.memory-palace/hermes/"* "$HOME/.hermes/memories/" 2>/dev/null || true
    log_info "    ✅ Hermes 记忆宫殿已更新"
  fi
  
  # 更新 Claude Code 记忆宫殿
  if [[ -d "$HOME/.claude/agent-memory" ]]; then
    mkdir -p "$HOME/.claude/agent-memory.backup"
    cp -r "$HOME/.claude/agent-memory/"* "$HOME/.claude/agent-memory.backup/" 2>/dev/null || true
    cp -r "$LOCAL_PATH/.memory-palace/claude-code/"* "$HOME/.claude/agent-memory/" 2>/dev/null || true
    log_info "    ✅ Claude Code 记忆宫殿已更新"
  fi
  
  # 更新 OpenCode 记忆宫殿
  if [[ -d "$HOME/.opencode/memory" ]]; then
    mkdir -p "$HOME/.opencode/memory.backup"
    cp -r "$HOME/.opencode/memory/"* "$HOME/.opencode/memory.backup/" 2>/dev/null || true
    cp -r "$LOCAL_PATH/.memory-palace/opencode/"* "$HOME/.opencode/memory/" 2>/dev/null || true
    log_info "    ✅ OpenCode 记忆宫殿已更新"
  fi
}

# 更新 Skills
update_skills() {
  # 更新 OpenClaw Skills
  if [[ -d "$HOME/.openclaw/workspace/skills" ]]; then
    cp "$LOCAL_PATH/agents/openclaw/SKILL.md" "$HOME/.openclaw/workspace/skills/memory-palace.md" 2>/dev/null || true
    log_info "    ✅ OpenClaw Skills 已更新"
  fi
  
  # 更新 Hermes Skills
  if [[ -d "$HOME/.hermes/skills/productivity" ]]; then
    cp "$LOCAL_PATH/agents/hermes/SKILL.md" "$HOME/.hermes/skills/productivity/memory-palace.md" 2>/dev/null || true
    log_info "    ✅ Hermes Skills 已更新"
  fi
  
  # 更新 memory-agent-files
  if [[ -d "$HOME/.openclaw/memory-agent-files" ]]; then
    mkdir -p "$HOME/.openclaw/memory-agent-files.backup"
    cp -r "$HOME/.openclaw/memory-agent-files/"* "$HOME/.openclaw/memory-agent-files.backup/" 2>/dev/null || true
    cp -r "$LOCAL_PATH/.memory-agent-files/"* "$HOME/.openclaw/memory-agent-files/" 2>/dev/null || true
    log_info "    ✅ memory-agent-files 已更新"
  fi
}

# 预览升级
preview_upgrade() {
  log_step "预览升级内容..."
  
  local current_version=$(get_local_version)
  local latest_version=$(get_remote_version)
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  升级预览: $current_version → $latest_version"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  将更新的文件:"
  echo "  - VERSION"
  echo "  - scripts/install.sh"
  echo "  - scripts/upgrade.sh (新增)"
  echo "  - README.md"
  echo "  - docs/INSTALL.md"
  echo "  - .memory-palace/*/"
  echo "  - agents/*/SKILL.md"
  echo "  - .memory-agent-files/*"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主函数
main() {
  print_banner
  
  # 检查安装目录
  if [[ ! -d "$LOCAL_PATH" ]]; then
    log_error "未找到安装目录: $LOCAL_PATH"
    echo ""
    echo "请先运行安装命令:"
    echo "  add multi-claw-subagents-memory-plugins where ..."
    exit 1
  fi
  
  show_current_config
  
  if [[ "$CHECK_ONLY" == "true" ]]; then
    exit 0
  fi
  
  if [[ "$DRY_RUN" == "true" ]]; then
    preview_upgrade
    exit 0
  fi
  
  # 确认升级
  if [[ "$FORCE" != "true" ]]; then
    echo -n "是否升级? (y/N): "
    read -r response
    case "$response" in
      [yY][eE][sS]|[yY])
        ;;
      *)
        log_info "取消升级"
        exit 0
        ;;
    esac
  fi
  
  do_upgrade
}

main
