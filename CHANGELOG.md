# CHANGELOG

本项目的所有显著变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0-alpha.1] — *Sandbox* — 2026-05-09

> 技术预览版。框架版本 v9.0。发布版本 v1.0.0-alpha.1。

### Added
- MemoryDocument 新增 11 个字段（`confidence`, `confidenceUpdated`, `confidenceChain`, `factSource`, `traceabilityId`, `residualQueue`, `residualSize`, `ageWeight`, `memoryType`, `accessCount`, `lastAccessTime`）
- 新增 7 个类型接口：`AgentInterface`, `MemoryRepresentation`, `FactPoint`, `ConfidenceMetadata`, `AgentMessage`, `QueryMessage`, `RouteDecision`
- 新增 7 个辅助类型：`ConfidenceLevel`, `MemoryType`, `AgentRole`, `AgentStatus`, `ResidualInfo`, `CleanupRecord`, `ConfidenceChainEntry`
- 新建 `system2-agent.ts`：System2 记忆代理（海绵式全量捕获）
- 新建 `system1-agent.ts`：System1 记忆代理（7 标准淘金式精炼）
- 新建 `full-memory-agent-client.ts`：全量代理-Client（本地文件写入 + 残差队列调度）
- 新建 `full-memory-agent-server.ts`：全量代理-Server（远程同步 + 跨网关广播消息中枢）
- 新建 `agent-communication.ts`：三代理通信协议 CMS（消息定义 + 心跳 + 重试 + 广播）
- 新建 `.gitattributes`：强制 LF 行尾，防止 Windows CRLF 污染
- 新建 `VERSION_PLAN.md`：版本开发计划
- 新建 `RELEASE_PLAN.md`：发布版本计划

### Fixed
- `indexer.ts`: 修复 `path.relative(filePath, filePath)` 始终返回空字符串的 Bug（改用 `path.basename`）
- `access-control.ts`: 修复私有仓 `allowedAgents: ['*']` 跨网关越权访问漏洞（改为 `deniedAgents: ['*']` + 所有权校验）
- `git-sync.ts`: 消除 4 处 `as any` 类型压制（pull/checkout/log 调用改为正确类型）
- `event-bus.ts`: 消除 6 处 `repoType as any`（改为 `as RepoType`）
- `index.ts`: 消除 2 处 `config.agentType as any`（改为 `as AgentInfo['agentType']`）

### Changed
- `VERSION`: 7.1 → 9.0 (release v1.0.0-alpha.1)
- `package.json`: 1.0.0 → 9.0.0（双包同步）
- `README.md`: 更新版本号至 v9.0，添加 v7.1/v9.0 版本历史
- `openclaw.plugin.json`: 新增 5 个 agent 模块的 libraries 和 exports 声明
- 所有 `.sh` 脚本：CRLF → LF 行尾转换
- 所有 `.ts` 源文件：CRLF → LF 行尾转换

---

## 版本映射

| 发布版本 | 框架版本 | 代号 |
|----------|----------|------|
| v1.0.0-alpha.1 | v9.0 | Sandbox |
| v1.0.0-beta.1 | v10.0 | Foundry |
| v1.0.0 | v10.0 | Atlas |
| v1.1.0 | v11.0 | Anvil |
| v2.0.0 | v12.0 | Chronos |
| v3.0.0 | v13.0 | Academy |
