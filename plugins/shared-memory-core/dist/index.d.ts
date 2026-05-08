/**
 * Multi-Claw Shared Memory Core
 * 多智能体共享记忆核心库
 */
export * from './types.js';
export { GitSyncManager, gitSyncManager } from './git-sync.js';
export { IndexEngine, indexEngine } from './indexer.js';
export { AccessControl, accessControl } from './access-control.js';
export { EventBus, eventBus } from './event-bus.js';
/**
 * 初始化所有核心模块
 */
export declare function initializeCore(config: {
    mainRepoUrl: string;
    businessRepoUrl: string;
    codeRepoUrl: string;
    privateRepoUrl: string;
    localBasePath: string;
    agentId: string;
    agentType: string;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map