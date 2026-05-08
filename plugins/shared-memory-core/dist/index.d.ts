/**
 * Multi-Claw Shared Memory Core
 * 多智能体共享记忆核心库
 */
export * from './types.js';
import { GitSyncManager, gitSyncManager } from './git-sync.js';
import { IndexEngine, indexEngine } from './indexer.js';
import { AccessControl, accessControl } from './access-control.js';
import { EventBus, eventBus } from './event-bus.js';
import { System2Agent, createSystem2Agent } from './system2-agent.js';
import { System1Agent, createSystem1Agent } from './system1-agent.js';
import { FullMemoryAgentClient, createFullMemoryAgentClient } from './full-memory-agent-client.js';
import { FullMemoryAgentServer, createFullMemoryAgentServer } from './full-memory-agent-server.js';
import { AgentCommunicationManager, createAgentCommunicationManager } from './agent-communication.js';
export { GitSyncManager, gitSyncManager };
export { IndexEngine, indexEngine };
export { AccessControl, accessControl };
export { EventBus, eventBus };
export { System2Agent, createSystem2Agent };
export { System1Agent, createSystem1Agent };
export { FullMemoryAgentClient, createFullMemoryAgentClient };
export { FullMemoryAgentServer, createFullMemoryAgentServer };
export { AgentCommunicationManager, createAgentCommunicationManager };
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