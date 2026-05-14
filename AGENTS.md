# Multi-Claw Subagents Memory Plugins — Agent Guide

Framework version: v13.1 | Paper-code consistency: 100%

## Build & Test

```bash
# Build core library
cd plugins/shared-memory-core && npm install && npm run build

# Build plugin
cd plugins/openclaw-memory-plugin && npm install && npm run build

# Run all tests (from root)
npx vitest run

# Run specific test file
npx vitest run tests/unit/confidence-engine.test.ts

# Coverage
npx vitest run --coverage
```

## Project Structure

- `plugins/shared-memory-core/src/` — 21 TS source files, 14 engines, 3 agents
- `plugins/openclaw-memory-plugin/src/` — 12 OpenClaw plugin tools
- `mcp-server/server.mjs` — 14 MCP bridge tools
- `tests/` — 12 test files, 145 tests (unit/integration/e2e/benchmark)
- `scripts/time-memory.sh` — 14 time-memory commands (v2.0)

## Conventions

- TypeScript strict mode, zero `as any`, zero CRLF
- Vitest v4 for testing
- Structured commit messages: `[CONFIDENCE][agent][type] message`
- All engines expose EventBus events and serialization
- 3-agent pipeline: System2 → System1 → FullMemory (Client/Server)

## Key Files

| File | Purpose |
|------|---------|
| `plugins/shared-memory-core/src/types.ts` | Core type system (307 lines) |
| `plugins/shared-memory-core/src/git-sync.ts` | Git sync + structured commits (450 lines) |
| `plugins/shared-memory-core/src/residual-engine.ts` | R=Σ formula, L1/L2/L3 cleanup (354 lines) |
| `plugins/shared-memory-core/src/router-engine.ts` | 3-strategy adaptive routing (280 lines) |
| `plugins/shared-memory-core/src/confidence-engine.ts` | 🟢🟡🔴 confidence propagation (290 lines) |
| `plugins/shared-memory-core/src/persona-engine.ts` | 4-expert persona coordination (405 lines) |

## MCP Tools (14)

Bridge: `mcp-server/server.mjs`

- `memory_search`, `memory_vector_search`, `memory_residuals`
- `memory_route`, `memory_confidence`, `memory_annotate`
- `memory_collaborate`, `memory_forgetting`, `memory_fuse`
- `memory_graph`, `memory_assess`
- `agent_system2_capture`, `agent_system1_refine`, `agent_fullmemory_persist`
