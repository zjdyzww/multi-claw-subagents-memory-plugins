/**
 * Multi-Claw Shared Memory Core
 * 多智能体共享记忆核心库
 */
export * from './types.js';
import { GitSyncManager, gitSyncManager } from './git-sync.js';
import { IndexEngine, indexEngine } from './indexer.js';
import { AccessControl, accessControl } from './access-control.js';
import { EventBus, eventBus } from './event-bus.js';
export { GitSyncManager, gitSyncManager };
export { IndexEngine, indexEngine };
export { AccessControl, accessControl };
export { EventBus, eventBus };
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