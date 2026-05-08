/**
 * Multi-Claw Shared Memory Core
 * 多智能体共享记忆核心库
 */
// 类型导出
export * from './types.js';
// 核心模块导出
export { GitSyncManager, gitSyncManager } from './git-sync.js';
export { IndexEngine, indexEngine } from './indexer.js';
export { AccessControl, accessControl } from './access-control.js';
export { EventBus, eventBus } from './event-bus.js';
/**
 * 初始化所有核心模块
 */
export async function initializeCore(config) {
    const { mainRepoUrl, businessRepoUrl, codeRepoUrl, privateRepoUrl, localBasePath } = config;
    // 注册仓库配置
    gitSyncManager.registerRepo({
        url: mainRepoUrl,
        localPath: `${localBasePath}/main-memory-shared`,
        type: 'main',
        defaultBranch: 'main'
    });
    gitSyncManager.registerRepo({
        url: businessRepoUrl,
        localPath: `${localBasePath}/business-memory-shared`,
        type: 'business',
        defaultBranch: 'main'
    });
    gitSyncManager.registerRepo({
        url: codeRepoUrl,
        localPath: `${localBasePath}/code-memory-shared`,
        type: 'code',
        defaultBranch: 'main'
    });
    gitSyncManager.registerRepo({
        url: privateRepoUrl,
        localPath: `${localBasePath}/${config.agentId}-memory-private`,
        type: 'private',
        defaultBranch: 'main'
    });
    // 注册智能体
    accessControl.registerAgent({
        agentId: config.agentId,
        agentType: config.agentType,
        displayName: config.agentId,
        priority: 100,
        capabilities: ['memory:read', 'memory:write', 'memory:sync'],
        memoryRepoUrl: privateRepoUrl,
        lastActiveAt: new Date().toISOString(),
        status: 'online'
    });
    // 初始化索引
    await indexEngine.indexRepo(`${localBasePath}/main-memory-shared`, 'main');
    await indexEngine.indexRepo(`${localBasePath}/business-memory-shared`, 'business');
    await indexEngine.indexRepo(`${localBasePath}/code-memory-shared`, 'code');
    await indexEngine.indexRepo(`${localBasePath}/${config.agentId}-memory-private`, 'private');
    // 发布上线事件
    eventBus.publishAgentOnline({
        agentId: config.agentId,
        agentType: config.agentType,
        displayName: config.agentId,
        priority: 100,
        capabilities: ['memory:read', 'memory:write', 'memory:sync'],
        memoryRepoUrl: privateRepoUrl,
        lastActiveAt: new Date().toISOString(),
        status: 'online'
    });
}
//# sourceMappingURL=index.js.map