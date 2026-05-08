#!/bin/bash
# build-all.sh - Build all plugins in the correct order
# Usage: bash scripts/build-all.sh [--force]

set -e

FORCE_BUILD="${1:-false}"
[[ "$FORCE_BUILD" == "--force" ]] && FORCE_BUILD="true"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLUGINS_DIR="$PROJECT_ROOT/plugins"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

for color in RED GREEN YELLOW BLUE NC; do
  [[ -z "${!color}" ]] && eval "$color=''"
done

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

build_plugin() {
  local dir="$1" name="$2"
  [[ ! -d "$dir" ]] && { log_warn "  Directory not found: $dir"; return 0; }

  log_info "  Building $name..."
  cd "$dir"

  if [[ "$FORCE_BUILD" == "true" ]] || [[ ! -d "node_modules" ]]; then
    log_info "    npm install..."
    npm install --legacy-peer-deps 2>&1 | tail -1 || log_warn "    npm install had warnings"
  fi

  log_info "    npm run build..."
  npm run build 2>&1 || { log_error "    Build failed for $name"; return 1; }

  # Verify dist artifacts
  local missing=()
  [[ ! -f "dist/index.js" ]] && missing+=("dist/index.js")
  [[ ! -f "dist/index.d.ts" ]] && missing+=("dist/index.d.ts")
  [[ ! -f "dist/openclaw.plugin.json" ]] && missing+=("dist/openclaw.plugin.json")

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_warn "    Missing artifacts: ${missing[*]}"
  else
    log_info "    All artifacts present in dist/"
  fi

  log_info "  $name done."
}

echo ""
echo -e "${GREEN}Multi-Claw Memory Plugins - Build All${NC}"
echo ""

# Step 1: shared-memory-core (dependency of openclaw-memory-plugin)
log_step "Step 1/2: Building shared-memory-core..."
build_plugin "$PLUGINS_DIR/shared-memory-core" "shared-memory-core"

# Step 2: openclaw-memory-plugin
log_step "Step 2/2: Building openclaw-memory-plugin..."
build_plugin "$PLUGINS_DIR/openclaw-memory-plugin" "openclaw-memory-plugin"

echo ""
echo -e "${GREEN}All plugins built successfully.${NC}"
