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
import { ResidualEngine, residualEngine } from './residual-engine.js';
import { RouterEngine, routerEngine } from './router-engine.js';
import { ConfidenceEngine, confidenceEngine } from './confidence-engine.js';
import { PersonaEngine, personaEngine } from './persona-engine.js';
export { buildStructuredMessage, buildStructuredMessageWithContext, getAgentAuthor } from './git-sync.js';
import { VectorEngine, vectorEngine } from './vector-engine.js';
import { ForgettingEngine, forgettingEngine } from './forgetting-engine.js';
import { GraphEngine, graphEngine } from './graph-engine.js';
import { FusionEngine, fusionEngine } from './fusion-engine.js';
import { SleepEngine, sleepEngine } from './sleep-engine.js';
import { MetacognitionEngine, metacognitionEngine } from './metacognition-engine.js';
export { VectorEngine, vectorEngine };
export { ForgettingEngine, forgettingEngine };
export { GraphEngine, graphEngine };
export { FusionEngine, fusionEngine };
export { SleepEngine, sleepEngine };
export { MetacognitionEngine, metacognitionEngine };
export { GitSyncManager, gitSyncManager };
export { IndexEngine, indexEngine };
export { AccessControl, accessControl };
export { EventBus, eventBus };
export { System2Agent, createSystem2Agent };
export { System1Agent, createSystem1Agent };
export { FullMemoryAgentClient, createFullMemoryAgentClient };
export { FullMemoryAgentServer, createFullMemoryAgentServer };
export { AgentCommunicationManager, createAgentCommunicationManager };
export { ResidualEngine, residualEngine };
export { RouterEngine, routerEngine };
export { ConfidenceEngine, confidenceEngine };
export { PersonaEngine, personaEngine };
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