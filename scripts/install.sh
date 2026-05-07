#!/bin/bash
# install.sh - Multi-Claw Memory Plugins 一次安装脚本
#
# 用法:
#   bash install.sh \
#     --plugins-url <URL> \
#     --gitserver-url <URL> \
#     --gitserver-token <TOKEN> \
#     [--group <group-name>] \
#     [--agents <agent-list>] \
#     [--local-path <path>]
#
# 示例:
#   bash install.sh \
#     --plugins-url https://git.osc.life/myz/multi-claw-subagents-memory-plugins \
#     --gitserver-url https://git.osc.life \
#     --gitserver-token gho_xxxxxxxxxxxx \
#     --group claws-memory
#
# LLM Agent 用法:
#   add multi-claw-subagents-memory-plugins where \
#     plugins-url=https://git.osc.life/myz/multi-claw-subagents-memory-plugins \
#     gitserver-url=https://git.osc.life \
#     gitserver-token=<TOKEN>

set -e

# 默认配置
GROUP="${GROUP:-claws-memory}"
AGENTS="${AGENTS:-openclaw,hermes,claude-code,opencode}"
LOCAL_PATH="${LOCAL_PATH:-$HOME/.openclaw/memory-plugins}"

# 解析参数
while [[ $# -gt 0 ]]; do
  case $1 in
    --plugins-url) PLUGINS_URL="$2"; shift 2 ;;
    --gitserver-url) GITSERVER_URL="$2"; shift 2 ;;
    --gitserver-token) GITSERVER_TOKEN="$2"; shift 2 ;;
    --group) GROUP="$2"; shift 2 ;;
    --agents) AGENTS="$2"; shift 2 ;;
    --local-path) LOCAL_PATH="$2"; shift 2 ;;
    *) echo "未知参数: $1"; shift ;;
  esac
done

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 打印横幅
print_banner() {
  echo ""
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}║   Multi-Claw Subagents Memory Plugins Installer         ║${NC}"
  echo -e "${GREEN}║   一次安装，多智能体记忆管理系统                        ║${NC}"
  echo -e "${GREEN}║                                                          ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# 验证参数
validate_params() {
  if [[ -z "$PLUGINS_URL" ]]; then
    log_error "缺少参数: --plugins-url"
    echo "用法: $0 --plugins-url <URL> --gitserver-url <URL> --gitserver-token <TOKEN>"
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
  
  log_info "参数验证通过"
  log_info "  插件仓库: $PLUGINS_URL"
  log_info "  Git 服务器: $GITSERVER_URL"
  log_info "  组织/组: $GROUP"
  log_info "  智能体: $AGENTS"
  log_info "  安装路径: $LOCAL_PATH"
}

# 测试 Git 服务器连接
test_connection() {
  log_step "测试 Git 服务器连接..."
  
  # 测试 API 访问
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/user" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_info "  ✅ 连接成功"
  else
    log_warn "  ⚠️  API 返回: $HTTP_CODE (可能需要检查 Token 权限)"
  fi
}

# 创建组织
create_org() {
  log_step "检查/创建组织: $GROUP"
  
  # 检查组织是否存在
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/orgs/$GROUP" || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_info "  ✅ 组织已存在"
  elif [[ "$HTTP_CODE" == "404" ]]; then
    log_info "  📦 创建组织..."
    RESULT=$(curl -s -X POST \
      -H "Authorization: token $GITSERVER_TOKEN" \
      -H "Content-Type: application/json" \
      "$GITSERVER_URL/api/v1/orgs" \
      -d "{\"name\":\"$GROUP\",\"description\":\"Multi-Claw Memory System Repositories\",\"visibility\":\"private\"}")
    
    if echo "$RESULT" | grep -q '"id"'; then
      log_info "  ✅ 组织创建成功"
    else
      log_warn "  ⚠️  组织创建失败: $RESULT"
    fi
  else
    log_warn "  ⚠️  检查组织失败: HTTP $HTTP_CODE"
  fi
}

# 创建仓库
create_repo() {
  local REPO_NAME="$1"
  local REPO_DESC="$2"
  local REPO_PRIVATE="${3:-true}"
  
  log_info "  创建仓库: $GROUP/$REPO_NAME"
  
  # 检查仓库是否存在
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITSERVER_TOKEN" \
    "$GITSERVER_URL/api/v1/repos/$GROUP/$REPO_NAME" 2>/dev/null || echo "000")
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_info "    ✅ 仓库已存在"
    return 0
  fi
  
  # 创建仓库
  RESULT=$(curl -s -X POST \
    -H "Authorization: token $GITSERVER_TOKEN" \
    -H "Content-Type: application/json" \
    "$GITSERVER_URL/api/v1/repos/$GROUP/$REPO_NAME" \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESC\",\"private\":$REPO_PRIVATE,\"auto_init\":true,\"default_branch\":\"main\"}" 2>&1)
  
  if echo "$RESULT" | grep -q '"id"'; then
    log_info "    ✅ 创建成功"
  else
    # 可能已存在，忽略错误
    if echo "$RESULT" | grep -q "already"; then
      log_info "    ✅ 仓库已存在"
    else
      log_warn "    ⚠️  创建失败: $(echo $RESULT | head -c 100)"
    fi
  fi
}

# 创建所有仓库
create_repos() {
  log_step "创建记忆仓库..."
  
  # 公共仓库
  create_repo "main-memory-shared" "Multi-Claw 公共记忆主仓 - 存储全局规则、协作协议、共享知识"
  create_repo "business-memory-shared" "Multi-Claw 公共业务子仓 - 存储项目知识、行业知识、业务流程"
  create_repo "code-memory-shared" "Multi-Claw 公共代码子仓 - 存储代码片段、设计模式、运维脚本"
  
  # 私有仓库
  for agent in $(echo "$AGENTS" | tr ',' ' '); do
    AGENT_UPPER=$(echo "$agent" | tr '[:lower:]' '[:upper:]')
    AGENT_DISPLAY=$(echo "$agent" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
    create_repo "${agent}-memory-private" "${AGENT_DISPLAY} 私有记忆仓 - 存储个体上下文、偏好设置"
  done
  
  # 主插件仓
  PLUGIN_REPO_NAME=$(basename "$PLUGINS_URL")
  create_repo "$PLUGIN_REPO_NAME" "Multi-Claw Memory Plugins 插件源码" "false"
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
    git submodule update --init --recursive
  else
    log_info "  📥 克隆仓库..."
    git clone --recursive "$PLUGINS_URL" "$LOCAL_PATH"
  fi
  
  log_info "  ✅ 主仓库就绪"
}

# 初始化子仓库
init_submodules() {
  log_step "初始化子仓库为独立仓库..."
  
  cd "$LOCAL_PATH"
  
  for agent in $(echo "$AGENTS" | tr ',' ' '); do
    REPO_PATH="${GITSERVER_URL}/${GROUP}/${agent}-memory-private.git"
    LOCAL_SUBMODULE="${agent}-memory-private"
    
    if [[ -d "$LOCAL_SUBMODULE/.git" ]]; then
      log_info "  ✅ $LOCAL_SUBMODULE 已存在"
    else
      log_info "  📥 克隆 $REPO_PATH"
      git clone "$REPO_PATH" "$LOCAL_SUBMODULE" 2>/dev/null || \
        log_warn "    ⚠️  克隆失败，请手动处理"
    fi
  done
}

# 配置插件
configure_plugins() {
  log_step "配置插件..."
  
  # 配置 shared-memory-core
  if [[ -d "$LOCAL_PATH/plugins/shared-memory-core" ]]; then
    cd "$LOCAL_PATH/plugins/shared-memory-core"
    npm install 2>/dev/null || npm install --legacy-peer-deps || true
    log_info "  ✅ shared-memory-core 配置完成"
  fi
  
  # 配置 openclaw-memory-plugin
  if [[ -d "$LOCAL_PATH/plugins/openclaw-memory-plugin" ]]; then
    cd "$LOCAL_PATH/plugins/openclaw-memory-plugin"
    npm install 2>/dev/null || npm install --legacy-peer-deps || true
    log_info "  ✅ openclaw-memory-plugin 配置完成"
  fi
}

# 更新 OpenClaw 配置
update_openclaw_config() {
  log_step "更新 OpenClaw 配置..."
  
  CONFIG_FILE="${HOME}/.openclaw/openclaw.json"
  CONFIG_DIR=$(dirname "$CONFIG_FILE")
  
  mkdir -p "$CONFIG_DIR"
  
  if [[ -f "$CONFIG_FILE" ]]; then
    log_info "  📄 更新现有配置..."
    # TODO: 使用 jq 合并配置
    log_warn "  ⚠️  请手动更新 $CONFIG_FILE"
  else
    log_info "  📄 创建新配置..."
    cat > "$CONFIG_FILE" << EOF
{
  "plugins": {
    "entries": {
      "openclaw-memory-plugin": {
        "enabled": true,
        "config": {
          "mainRepoUrl": "${GITSERVER_URL}/${GROUP}/main-memory-shared.git",
          "businessRepoUrl": "${GITSERVER_URL}/${GROUP}/business-memory-shared.git",
          "codeRepoUrl": "${GITSERVER_URL}/${GROUP}/code-memory-shared.git",
          "privateRepoUrl": "${GITSERVER_URL}/${GROUP}/openclaw-memory-private.git",
          "localPath": "${HOME}/.openclaw/memory",
          "syncInterval": 300000,
          "syncStrategy": "rebase"
        }
      }
    }
  }
}
EOF
    log_info "  ✅ 配置创建完成"
  fi
}

# 验证安装
verify_installation() {
  log_step "验证安装..."
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  安装完成！以下是验证命令："
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  1. 重启 OpenClaw Gateway:"
  echo "     openclaw gateway restart"
  echo ""
  echo "  2. 验证插件状态:"
  echo "     openclaw plugins list | grep memory"
  echo ""
  echo "  3. 测试记忆工具:"
  echo "     memory.status"
  echo "     memory.save --repo main --path test.md --content '# Test'"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

# 主函数
main() {
  print_banner
  
  log_info "开始安装 Multi-Claw Memory Plugins..."
  echo ""
  
  validate_params
  test_connection
  create_org
  create_repos
  clone_main_repo
  init_submodules
  configure_plugins
  update_openclaw_config
  
  echo ""
  log_info "✅ 安装完成!"
  echo ""
  
  verify_installation
}

# 运行
main
