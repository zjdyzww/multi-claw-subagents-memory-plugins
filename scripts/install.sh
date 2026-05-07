#!/bin/bash
# install.sh - Multi-Claw Memory Plugins 一次安装脚本 v6.1
#
# 功能:
# 1. 创建记忆仓库（默认每种类型1个）
# 2. 安装记忆宫殿到各网关
# 3. 动态增加私有仓库数量
#
# 用法:
#   # 初始安装（默认每种1个）
#   bash install.sh \
#     --plugins-url <URL> \
#     --gitserver-url <URL> \
#     --gitserver-token <TOKEN> \
#     --gitgroup-name <group-name>
#
#   # 动态增加私有仓库
#   bash install.sh \
#     --add-agent openclaw:3 \
#     --gitgroup-name <group-name> \
#     --gitserver-token <TOKEN>
#
#   # 查看状态
#   bash install.sh --status --gitgroup-name <group-name>
#
# LLM Agent 用法:
#   add multi-claw-subagents-memory-plugins where \
#     plugins-url=https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
#     gitserver-url=https://git.osc.life \
#     gitserver-token=<TOKEN> \
#     gitgroup-name=claws-memory

set -e

# 默认配置
GITGROUP="${GITGROUP:-claws-memory}"
LOCAL_PATH="${LOCAL_PATH:-$HOME/.openclaw/memory-plugins}"
OPENCLAW_PATH="${OPENCLAW_PATH:-$HOME/.openclaw}"
HERMES_PATH="${HERMES_PATH:-$HOME/.hermes}"
CLAUDE_PATH="${CLAUDE_PATH:-$HOME/.claude}"
OPENCODE_PATH="${OPENCODE_PATH:-$HOME/.opencode}"

# 默认：每种类型1个
HERMES_COUNT=1
OPENCLAW_COUNT=1
OPENCODE_COUNT=1
CLAUDE_CODE_COUNT=1

# 操作模式
MODE="install"
ADD_AGENT_TYPE=""
ADD_AGENT_COUNT=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --plugins-url) PLUGINS_URL="$2"; shift 2 ;;
    --gitserver-url) GITSERVER_URL="$2"; shift 2 ;;
    --gitserver-token) GITSERVER_TOKEN="$2"; shift 2 ;;
    --gitgroup-name) GITGROUP="$2"; shift 2 ;;
    --gitgroup) GITGROUP="$2"; shift 2 ;;
    --group) GITGROUP="$2"; shift 2 ;;
    --add-agent)
      MODE="add-agent"
      IFS=':' read -ra KV <<< "$2"
      ADD_AGENT_TYPE="${KV[0]}"
      ADD_AGENT_COUNT="${KV[1]}"
      shift 2 ;;
    --status) MODE="status"; shift ;;
    --agents)
      # 解析 agents=hermes:1,openclaw:3,opencode:2,claude-code:0（兼容旧格式）
      IFS=',' read -ra AGENT_SPECS <<< "$2"
      for spec in "${AGENT_SPECS[@]}"; do
        IFS=':' read -ra KV <<< "$spec"
        case "${KV[0]}" in
          hermes) HERMES_COUNT="${KV[1]:-1}" ;;
          openclaw) OPENCLAW_COUNT="${KV[1]:-1}" ;;
          opencode) OPENCODE_COUNT="${KV[1]:-1}" ;;
          claude-code) CLAUDE_CODE_COUNT="${KV[1]:-1}" ;;
        esac
      done
      shift 2 ;;
    --local-path) LOCAL_PATH="$2"; shift 2 ;;
    *) echo "未知参数: $1"; shift ;;
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
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}║   Multi-Claw Subagents Memory Plugins Installer v6.1 ║${NC}"
  echo -e "${GREEN}║   一次安装 + 动态扩展                              ║${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# 测试 Git 服务器连接
test_connection() {
  log_step "测试 Git 服务器连接..."
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/user" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_info "  ✅ 连接成功"
    return 0
  else
    log_error "  ❌ 连接失败: HTTP $HTTP_CODE"
    return 1
  fi
}

# 检查组织是否存在
check_org() {
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/orgs/$GITGROUP" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    return 0
  else
    return 1
  fi
}

# 创建仓库
create_repo() {
  local REPO_NAME="$1"
  local REPO_DESC="$2"
  local REPO_PRIVATE="${3:-true}"
  
  # 先检查仓库是否存在
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/$REPO_NAME" 2>/dev/null || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "  ⏭️  $REPO_NAME (已存在)"
    return 0
  fi
  
  # 创建仓库
  RESULT=$(curl -s -X POST \
    -H "Authorization: token $GITSERVER_TOKEN" \
    -H "Content-Type: application/json" \
    "$GITSERVER_URL/api/v1/orgs/$GITGROUP/repos" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":$REPO_PRIVATE,\"auto_init\":true,\"default_branch\":\"main\"}" 2>&1)
  
  if echo "$RESULT" | grep -q '"id"'; then
    echo "  ✅ $REPO_NAME (创建成功)"
  else
    if echo "$RESULT" | grep -qi "already"; then
      echo "  ⏭️  $REPO_NAME (已存在)"
    else
      echo "  ❌ $REPO_NAME (失败)"
    fi
  fi
}

# 创建单个类型的私有仓库
create_private_repos_for_type() {
  local TYPE="$1"
  local COUNT="$2"
  local DISPLAY_NAME="$3"
  
  if [[ "$COUNT" -le 0 ]]; then
    return
  fi
  
  echo "  创建 $DISPLAY_NAME 私有仓库 ($COUNT 个):"
  for i in $(seq 1 "$COUNT"); do
    create_repo "${TYPE}-${i}-memory-private" "$DISPLAY_NAME #${i} 私有记忆仓"
  done
}

# 创建所有公共仓库
create_public_repos() {
  log_step "创建公共记忆仓库..."
  
  create_repo "main-memory-shared" "Multi-Claw 公共记忆主仓 - 存储全局规则、协作协议、共享知识"
  create_repo "business-memory-shared" "Multi-Claw 公共业务子仓 - 存储项目知识、行业知识、业务流程"
  create_repo "code-memory-shared" "Multi-Claw 公共代码子仓 - 存储代码片段、设计模式、运维脚本"
}

# 创建所有私有仓库
create_all_private_repos() {
  log_step "创建私有记忆仓库..."
  
  create_private_repos_for_type "hermes" "$HERMES_COUNT" "Hermes"
  create_private_repos_for_type "openclaw" "$OPENCLAW_COUNT" "OpenClaw"
  create_private_repos_for_type "opencode" "$OPENCODE_COUNT" "OpenCode"
  create_private_repos_for_type "claude-code" "$CLAUDE_CODE_COUNT" "Claude Code"
}

# 克隆主仓库
clone_main_repo() {
  log_step "克隆主仓库..."
  
  PARENT_DIR=$(dirname "$LOCAL_PATH")
  REPO_NAME=$(basename "$PLUGINS_URL")
  
  mkdir -p "$PARENT_DIR"
  cd "$PARENT_DIR"
  
  if [[ -d "$LOCAL_PATH/.git" ]]; then
    log_info "  📦 更新现有仓库..."
    cd "$LOCAL_PATH"
    git pull origin main 2>/dev/null || git pull origin main --rebase
    git submodule update --init --recursive 2>/dev/null || true
  else
    log_info "  📥 克隆仓库..."
    git clone --recursive "$PLUGINS_URL" "$LOCAL_PATH"
  fi
  
  log_success "  ✅ 主仓库就绪"
}

# 安装 OpenClaw 记忆宫殿
install_openclaw() {
  log_info "安装 OpenClaw 记忆宫殿..."
  
  mkdir -p "$OPENCLAW_PATH/memory-palace"
  mkdir -p "$OPENCLAW_PATH/workspace/skills"
  
  # 复制记忆宫殿规则
  cp -r "$LOCAL_PATH/.memory-palace/openclaw/"* "$OPENCLAW_PATH/memory-palace/" 2>/dev/null || true
  
  # 复制 Skills
  cp "$LOCAL_PATH/agents/openclaw/SKILL.md" "$OPENCLAW_PATH/workspace/skills/memory-palace.md" 2>/dev/null || true
  
  # 复制 memory-agent-files
  mkdir -p "$OPENCLAW_PATH/memory-agent-files"
  cp -r "$LOCAL_PATH/.memory-agent-files/"* "$OPENCLAW_PATH/memory-agent-files/" 2>/dev/null || true
  
  log_success "  ✅ OpenClaw 记忆宫殿安装完成"
}

# 安装 Hermes 记忆宫殿
install_hermes() {
  log_info "安装 Hermes 记忆宫殿..."
  
  mkdir -p "$HERMES_PATH/memories/L1_CORE"
  mkdir -p "$HERMES_PATH/memories/L2_BUSINESS"
  mkdir -p "$HERMES_PATH/memories/L3_CONFIG"
  mkdir -p "$HERMES_PATH/memories/L4_INDEX"
  mkdir -p "$HERMES_PATH/skills/productivity/dual-thinking"
  mkdir -p "$HERMES_PATH/skills/productivity/memory-manager"
  mkdir -p "$HERMES_PATH/archive/residuals"
  mkdir -p "$HERMES_PATH/episodes"
  
  # 复制记忆宫殿规则
  cp -r "$LOCAL_PATH/.memory-palace/hermes/"* "$HERMES_PATH/memories/" 2>/dev/null || true
  
  # 复制 Skills
  cp "$LOCAL_PATH/agents/hermes/SKILL.md" "$HERMES_PATH/skills/productivity/memory-palace.md" 2>/dev/null || true
  
  # 复制 memory-agent-files
  cp -r "$LOCAL_PATH/.memory-agent-files/"* "$HERMES_PATH/memories/" 2>/dev/null || true
  
  log_success "  ✅ Hermes 记忆宫殿安装完成"
}

# 安装 Claude Code 记忆宫殿
install_claude_code() {
  if [[ "$CLAUDE_CODE_COUNT" -eq 0 ]]; then
    return
  fi
  
  log_info "安装 Claude Code 记忆宫殿..."
  
  mkdir -p "$CLAUDE_PATH/agent-memory"
  mkdir -p "$CLAUDE_PATH/projects"
  mkdir -p "$CLAUDE_PATH/skills"
  mkdir -p "$CLAUDE_PATH/memories/L1_CORE"
  mkdir -p "$CLAUDE_PATH/memories/L2_BUSINESS"
  mkdir -p "$CLAUDE_PATH/memories/L3_CONFIG"
  
  # 复制记忆宫殿规则
  cp -r "$LOCAL_PATH/.memory-palace/claude-code/"* "$CLAUDE_PATH/agent-memory/" 2>/dev/null || true
  
  # 复制 Skills
  cp "$LOCAL_PATH/agents/claude-code/SKILL.md" "$CLAUDE_PATH/skills/memory-palace.md" 2>/dev/null || true
  
  # 复制 memory-agent-files
  mkdir -p "$CLAUDE_PATH/memory-agent-files"
  cp -r "$LOCAL_PATH/.memory-agent-files/"* "$CLAUDE_PATH/memory-agent-files/" 2>/dev/null || true
  
  log_success "  ✅ Claude Code 记忆宫殿安装完成"
}

# 安装 OpenCode 记忆宫殿
install_opencode() {
  if [[ "$OPENCODE_COUNT" -eq 0 ]]; then
    return
  fi
  
  log_info "安装 OpenCode 记忆宫殿..."
  
  mkdir -p "$OPENCODE_PATH/memory/L1_CORE"
  mkdir -p "$OPENCODE_PATH/memory/L2_BUSINESS"
  mkdir -p "$OPENCODE_PATH/memory/L3_CONFIG"
  mkdir -p "$OPENCODE_PATH/memory/L4_INDEX"
  mkdir -p "$OPENCODE_PATH/projects"
  mkdir -p "$OPENCODE_PATH/skills"
  mkdir -p "$OPENCODE_PATH/cache"
  
  # 复制记忆宫殿规则
  cp -r "$LOCAL_PATH/.memory-palace/opencode/"* "$OPENCODE_PATH/memory/" 2>/dev/null || true
  
  # 复制 Skills
  cp "$LOCAL_PATH/agents/opencode/SKILL.md" "$OPENCODE_PATH/skills/memory-palace.md" 2>/dev/null || true
  
  # 复制 memory-agent-files
  mkdir -p "$OPENCODE_PATH/memory-agent-files"
  cp -r "$LOCAL_PATH/.memory-agent-files/"* "$OPENCODE_PATH/memory-agent-files/" 2>/dev/null || true
  
  log_success "  ✅ OpenCode 记忆宫殿安装完成"
}

# 查看状态
show_status() {
  echo ""
  echo -e "${BLUE}=== 记忆仓库状态 ===${NC}"
  echo ""
  
  if ! check_org; then
    echo -e "${RED}❌ 组织不存在: $GITGROUP${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✅ 组织: $GITGROUP${NC}"
  echo ""
  
  # 公共仓库
  echo "公共仓库:"
  for repo in main-memory-shared business-memory-shared code-memory-shared; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: token $GITSERVER_TOKEN" \
      "$GITSERVER_URL/api/v1/repos/$GITGROUP/$repo" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
      echo -e "  ✅ $repo"
    else
      echo -e "  ❌ $repo"
    fi
  done
  
  echo ""
  echo "私有仓库:"
  
  # Hermes
  COUNT=0
  while HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/hermes-$((COUNT+1))-memory-private" 2>/dev/null); do
    if [[ "$HTTP_CODE" == "200" ]]; then
      ((COUNT++))
    else
      break
    fi
  done
  echo -e "  Hermes: ${COUNT} 个"
  
  # OpenClaw
  COUNT=0
  while HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/openclaw-$((COUNT+1))-memory-private" 2>/dev/null); do
    if [[ "$HTTP_CODE" == "200" ]]; then
      ((COUNT++))
    else
      break
    fi
  done
  echo -e "  OpenClaw: ${COUNT} 个"
  
  # OpenCode
  COUNT=0
  while HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/opencode-$((COUNT+1))-memory-private" 2>/dev/null); do
    if [[ "$HTTP_CODE" == "200" ]]; then
      ((COUNT++))
    else
      break
    fi
  done
  echo -e "  OpenCode: ${COUNT} 个"
  
  # Claude Code
  COUNT=0
  while HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/claude-code-$((COUNT+1))-memory-private" 2>/dev/null); do
    if [[ "$HTTP_CODE" == "200" ]]; then
      ((COUNT++))
    else
      break
    fi
  done
  echo -e "  Claude Code: ${COUNT} 个"
  
  echo ""
}

# 添加私有仓库
add_private_repo() {
  log_step "添加私有仓库..."
  
  if [[ -z "$ADD_AGENT_TYPE" ]] || [[ -z "$ADD_AGENT_COUNT" ]]; then
    log_error "缺少参数: --add-agent 需要 类型:数量 格式"
    exit 1
  fi
  
  # 检查组织
  if ! check_org; then
    log_error "组织不存在: $GITGROUP"
    exit 1
  fi
  
  # 获取当前数量
  local CURRENT_COUNT=0
  while HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GITGROUP/${ADD_AGENT_TYPE}-$((CURRENT_COUNT+1))-memory-private" 2>/dev/null); do
    if [[ "$HTTP_CODE" == "200" ]]; then
      ((CURRENT_COUNT++))
    else
      break
    fi
  done
  
  local TARGET_COUNT="$ADD_AGENT_COUNT"
  local TYPE_DISPLAY=$(echo "$ADD_AGENT_TYPE" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
  
  log_info "当前: $CURRENT_COUNT 个 $TYPE_DISPLAY"
  log_info "目标: $TARGET_COUNT 个 $TYPE_DISPLAY"
  
  if [[ "$TARGET_COUNT" -le "$CURRENT_COUNT" ]]; then
    log_warn "目标数量不大于当前数量，无需添加"
    return 0
  fi
  
  echo ""
  log_step "创建新的私有仓库..."
  
  for i in $(seq $((CURRENT_COUNT+1)) "$TARGET_COUNT"); do
    create_repo "${ADD_AGENT_TYPE}-${i}-memory-private" "$TYPE_DISPLAY #${i} 私有记忆仓"
  done
  
  log_success "✅ 添加完成: $CURRENT_COUNT → $TARGET_COUNT 个 $TYPE_DISPLAY"
}

# 检测已安装的旧版本
detect_existing_installation() {
  if [[ -d "$LOCAL_PATH/.git" ]]; then
    # 已安装，检测版本
    CURRENT_VERSION="unknown"
    if [[ -f "$LOCAL_PATH/VERSION" ]]; then
      CURRENT_VERSION=$(cat "$LOCAL_PATH/VERSION")
    fi
    
    # 获取最新版本
    LATEST_VERSION=$(curl -sL "$PLUGINS_URL/raw/main/VERSION" 2>/dev/null || echo "unknown")
    
    if [[ "$CURRENT_VERSION" != "$LATEST_VERSION" ]] && [[ "$CURRENT_VERSION" != "unknown" ]]; then
      echo ""
      echo -e "${YELLOW}⚠️  检测到已安装旧版本${NC}"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo -e "  当前版本: ${YELLOW}$CURRENT_VERSION${NC}"
      echo -e "  最新版本: ${GREEN}$LATEST_VERSION${NC}"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
      echo "建议使用升级脚本:"
      echo ""
      echo -e "  ${CYAN}bash <(curl -sL $PLUGINS_URL/raw/main/scripts/upgrade.sh)${NC}"
      echo ""
      echo "或使用 --force 强制安装（会覆盖现有配置）:"
      echo ""
      echo "  bash $0 --force ..."
      echo ""
      echo -n "是否继续安装? (将升级到最新版本) (y/N): "
      read -r response
      case "$response" in
        [yY][eE][sS]|[yY])
          log_info "继续安装，将升级到 v$LATEST_VERSION..."
          ;;
        *)
          log_info "取消安装"
          exit 0
          ;;
      esac
    fi
  fi
}

# 主安装流程
do_install() {
  print_banner
  
  log_info "开始安装 Multi-Claw Memory Plugins v6.1..."
  echo ""
  
  # 检测已安装的旧版本
  detect_existing_installation
  
  # 验证必要参数
  if [[ -z "$PLUGINS_URL" ]] || [[ -z "$GITSERVER_URL" ]] || [[ -z "$GITSERVER_TOKEN" ]] || [[ -z "$GITGROUP" ]]; then
    log_error "缺少必要参数"
    echo "用法:"
    echo "  bash install.sh --plugins-url <URL> --gitserver-url <URL> --gitserver-token <TOKEN> --gitgroup-name <GROUP>"
    exit 1
  fi
  
  log_info "参数:"
  log_info "  插件仓库: $PLUGINS_URL"
  log_info "  Git 服务器: $GITSERVER_URL"
  log_info "  Git 组名: $GITGROUP"
  log_info "  智能体数量: Hermes=$HERMES_COUNT, OpenClaw=$OPENCLAW_COUNT, OpenCode=$OPENCODE_COUNT, Claude Code=$CLAUDE_CODE_COUNT"
  echo ""
  
  if ! test_connection; then
    exit 1
  fi
  
  if ! check_org; then
    log_error "组织不存在: $GITGROUP"
    echo ""
    echo "请先手动创建组织："
    echo "  1. 访问 $GITSERVER_URL"
    echo "  2. 点击 + → 新建组织"
    echo "  3. 组织名称: $GITGROUP"
    echo "  4. 可见性: 私有"
    exit 1
  fi
  
  create_public_repos
  create_all_private_repos
  clone_main_repo
  
  # 安装记忆宫殿
  echo ""
  log_step "安装记忆宫殿..."
  install_openclaw
  install_hermes
  install_claude_code
  install_opencode
  
  echo ""
  log_success "✅ 安装完成!"
  echo ""
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  验证命令："
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  查看状态:"
  echo "  bash $0 --status --gitgroup-name $GITGROUP --gitserver-token <TOKEN>"
  echo ""
  echo "  增加私有仓库:"
  echo "  bash $0 --add-agent openclaw:3 --gitgroup-name $GITGROUP --gitserver-token <TOKEN>"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 主函数
main() {
  case "$MODE" in
    install)
      do_install
      ;;
    add-agent)
      add_private_repo
      ;;
    status)
      show_status
      ;;
    *)
      echo "未知模式: $MODE"
      exit 1
      ;;
  esac
}

main
