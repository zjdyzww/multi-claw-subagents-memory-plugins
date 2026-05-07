#!/bin/bash
# install.sh - Multi-Claw Memory Plugins 一次安装脚本 v5.0
#
# 功能:
# 1. 创建记忆仓库（支持动态数量的私有仓库）
# 2. 安装记忆宫殿到各网关
# 3. 配置插件（可选）
#
# 用法:
#   bash install.sh \
#     --plugins-url <URL> \
#     --gitserver-url <URL> \
#     --gitserver-token <TOKEN> \
#     --gitgroup-name <group-name> \
#     [--agents hermes:1,openclaw:3,opencode:2,claude-code:0] \
#     [--local-path <path>]
#
# 示例:
#   bash install.sh \
#     --plugins-url https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
#     --gitserver-url https://git.osc.life \
#     --gitserver-token gho_xxxxxxxxxxxx \
#     --gitgroup-name claws-memory \
#     --agents hermes:1,openclaw:3,opencode:2,claude-code:0
#
# LLM Agent 用法:
#   add multi-claw-subagents-memory-plugins where \
#     plugins-url=https://git.osc.life/yushanhe/multi-claw-subagents-memory-plugins \
#     gitserver-url=https://git.osc.life \
#     gitserver-token=<TOKEN> \
#     gitgroup-name=claws-memory \
#     agents=hermes:1,openclaw:3,opencode:2,claude-code:0

set -e

# 默认配置
GITGROUP="${GITGROUP:-claws-memory}"
LOCAL_PATH="${LOCAL_PATH:-$HOME/.openclaw/memory-plugins}"
OPENCLAW_PATH="${OPENCLAW_PATH:-$HOME/.openclaw}"
HERMES_PATH="${HERMES_PATH:-$HOME/.hermes}"
CLAUDE_PATH="${CLAUDE_PATH:-$HOME/.claude}"
OPENCODE_PATH="${OPENCODE_PATH:-$HOME/.opencode}"

# 默认：每种类型1个
HERMES_COUNT="${HERMES_COUNT:-1}"
OPENCLAW_COUNT="${OPENCLAW_COUNT:-1}"
OPENCODE_COUNT="${OPENCODE_COUNT:-1}"
CLAUDE_CODE_COUNT="${CLAUDE_CODE_COUNT:-1}"

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --plugins-url) PLUGINS_URL="$2"; shift 2 ;;
    --gitserver-url) GITSERVER_URL="$2"; shift 2 ;;
    --gitserver-token) GITSERVER_TOKEN="$2"; shift 2 ;;
    --gitgroup-name) GITGROUP="$2"; shift 2 ;;
    --gitgroup) GITGROUP="$2"; shift 2 ;;
    --group) GITGROUP="$2"; shift 2 ;;
    --agents)
      # 解析 agents=hermes:1,openclaw:3,opencode:2,claude-code:0
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
log_agent() { echo -e "${CYAN}[AGENT]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# 打印横幅
print_banner() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}║   Multi-Claw Subagents Memory Plugins Installer v5.0   ║${NC}"
  echo -e "${GREEN}║   支持动态数量的私有仓库                              ║${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# 验证参数
validate_params() {
  if [[ -z "$PLUGINS_URL" ]]; then
    log_error "缺少参数: --plugins-url"
    exit 1
  fi
  
  if [[ -z "$GITSERVER_URL" ]]; then
    log_error "缺少参数: --gitserver-url"
    exit 1
  fi
  
  if [[ -z "$GITSERVER_TOKEN" ]]; then
    log_error "缺少参数: --gitserver-token"
    exit 1
  fi
  
  if [[ -z "$GITGROUP" ]]; then
    log_error "缺少参数: --gitgroup-name"
    exit 1
  fi
  
  log_info "参数验证通过"
  log_info "  插件仓库: $PLUGINS_URL"
  log_info "  Git 服务器: $GITSERVER_URL"
  log_info "  Git 组名: $GITGROUP"
  log_info "  智能体数量:"
  log_info "    Hermes: $HERMES_COUNT"
  log_info "    OpenClaw: $OPENCLAW_COUNT"
  log_info "    OpenCode: $OPENCODE_COUNT"
  log_info "    Claude Code: $CLAUDE_CODE_COUNT"
  log_info "  安装路径: $LOCAL_PATH"
}

# 测试 Git 服务器连接
test_connection() {
  log_step "测试 Git 服务器连接..."
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/user" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_info "  ✅ 连接成功"
  else
    log_warn "  ⚠️  API 返回: $HTTP_CODE"
  fi
}

# 检查组织是否存在
check_org() {
  log_step "检查组织: $GITGROUP"
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/orgs/$GITGROUP" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_success "  ✅ 组织已存在"
    return 0
  else
    log_error "  ❌ 组织不存在: $GITGROUP"
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
    log_info "    ✅ $REPO_NAME (已存在)"
    return 0
  fi
  
  # 创建仓库
  RESULT=$(curl -s -X POST \
    -H "Authorization: token $GITSERVER_TOKEN" \
    -H "Content-Type: application/json" \
    "$GITSERVER_URL/api/v1/orgs/$GITGROUP/repos" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":$REPO_PRIVATE,\"auto_init\":true,\"default_branch\":\"main\"}" 2>&1)
  
  if echo "$RESULT" | grep -q '"id"'; then
    log_success "    ✅ $REPO_NAME (创建成功)"
  else
    if echo "$RESULT" | grep -qi "already"; then
      log_info "    ✅ $REPO_NAME (已存在)"
    else
      log_error "    ❌ $REPO_NAME (失败)"
    fi
  fi
}

# 创建公共仓库
create_public_repos() {
  log_step "创建公共记忆仓库..."
  
  create_repo "main-memory-shared" "Multi-Claw 公共记忆主仓 - 存储全局规则、协作协议、共享知识"
  create_repo "business-memory-shared" "Multi-Claw 公共业务子仓 - 存储项目知识、行业知识、业务流程"
  create_repo "code-memory-shared" "Multi-Claw 公共代码子仓 - 存储代码片段、设计模式、运维脚本"
}

# 创建私有仓库（动态数量）
create_private_repos() {
  log_step "创建私有记忆仓库..."
  
  # Hermes 私有仓库
  if [[ "$HERMES_COUNT" -gt 0 ]]; then
    log_agent "Hermes 私有仓库 ($HERMES_COUNT 个):"
    for i in $(seq 1 "$HERMES_COUNT"); do
      create_repo "hermes-${i}-memory-private" "Hermes #${i} 私有记忆仓 - 存储个体上下文"
    done
  else
    log_info "  ⏭️  Hermes: 0 个 (跳过)"
  fi
  
  # OpenClaw 私有仓库
  if [[ "$OPENCLAW_COUNT" -gt 0 ]]; then
    log_agent "OpenClaw 私有仓库 ($OPENCLAW_COUNT 个):"
    for i in $(seq 1 "$OPENCLAW_COUNT"); do
      create_repo "openclaw-${i}-memory-private" "OpenClaw #${i} 私有记忆仓 - 存储个体上下文"
    done
  else
    log_info "  ⏭️  OpenClaw: 0 个 (跳过)"
  fi
  
  # OpenCode 私有仓库
  if [[ "$OPENCODE_COUNT" -gt 0 ]]; then
    log_agent "OpenCode 私有仓库 ($OPENCODE_COUNT 个):"
    for i in $(seq 1 "$OPENCODE_COUNT"); do
      create_repo "opencode-${i}-memory-private" "OpenCode #${i} 私有记忆仓 - 存储个体上下文"
    done
  else
    log_info "  ⏭️  OpenCode: 0 个 (跳过)"
  fi
  
  # Claude Code 私有仓库
  if [[ "$CLAUDE_CODE_COUNT" -gt 0 ]]; then
    log_agent "Claude Code 私有仓库 ($CLAUDE_CODE_COUNT 个):"
    for i in $(seq 1 "$CLAUDE_CODE_COUNT"); do
      create_repo "claude-code-${i}-memory-private" "Claude Code #${i} 私有记忆仓 - 存储个体上下文"
    done
  else
    log_info "  ⏭️  Claude Code: 0 个 (跳过)"
  fi
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
  log_agent "安装 OpenClaw 记忆宫殿..."
  
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
  log_agent "安装 Hermes 记忆宫殿..."
  
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
    log_info "  ⏭️  Claude Code: 0 个，跳过安装"
    return
  fi
  
  log_agent "安装 Claude Code 记忆宫殿..."
  
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
    log_info "  ⏭️  OpenCode: 0 个，跳过安装"
    return
  fi
  
  log_agent "安装 OpenCode 记忆宫殿..."
  
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

# 安装所有网关的记忆宫殿
install_all_agents() {
  log_step "为每个网关安装记忆宫殿..."
  
  # Hermes
  if [[ "$HERMES_COUNT" -gt 0 ]]; then
    install_hermes
  fi
  
  # OpenClaw
  if [[ "$OPENCLAW_COUNT" -gt 0 ]]; then
    install_openclaw
  fi
  
  # Claude Code
  install_claude_code
  
  # OpenCode
  install_opencode
}

# 主函数
main() {
  print_banner
  
  log_info "开始安装 Multi-Claw Memory Plugins v5.0..."
  echo ""
  
  validate_params
  test_connection
  
  # 检查组织是否存在
  if ! check_org; then
    echo ""
    log_error "安装失败：组织 $GITGROUP 不存在"
    echo ""
    echo "请先手动创建组织："
    echo "  1. 访问 $GITSERVER_URL"
    echo "  2. 点击 + → 新建组织"
    echo "  3. 组织名称: $GITGROUP"
    echo "  4. 可见性: 私有"
    echo "  5. 创建后再运行此安装脚本"
    exit 1
  fi
  
  create_public_repos
  create_private_repos
  clone_main_repo
  install_all_agents
  
  echo ""
  log_success "✅ 安装完成!"
  echo ""
  
  # 打印验证信息
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  验证命令："
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  1. 查看记忆宫殿安装:"
  echo "     ls ~/.openclaw/memory-palace/"
  echo "     cat ~/.openclaw/memory-palace/MEMORY_PALACE.md"
  echo ""
  echo "  2. 查看仓库列表:"
  echo "     https://git.osc.life/$GITGROUP"
  echo ""
  echo "  3. 公共仓库:"
  echo "     $GITSERVER_URL/$GITGROUP/main-memory-shared"
  echo "     $GITSERVER_URL/$GITGROUP/business-memory-shared"
  echo "     $GITSERVER_URL/$GITGROUP/code-memory-shared"
  echo ""
  echo "  4. 私有仓库数量:"
  echo "     Hermes: $HERMES_COUNT"
  echo "     OpenClaw: $OPENCLAW_COUNT"
  echo "     OpenCode: $OPENCODE_COUNT"
  echo "     Claude Code: $CLAUDE_CODE_COUNT"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# 运行
main
