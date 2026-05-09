/**
 * Multi-Claw Shared Memory Core
 * 多智能体共享记忆核心库
 */

// 类型导出
export * from './types.js';

// 核心模块导入和导出
import { GitSyncManager, gitSyncManager } from './git-sync.js';
import { IndexEngine, indexEngine } from './indexer.js';
import { AccessControl, accessControl } from './access-control.js';
import { EventBus, eventBus } from './event-bus.js';
import type { AgentInfo } from './types.js';

// v9 新增：三代理引擎
import { System2Agent, createSystem2Agent } from './system2-agent.js';
import { System1Agent, createSystem1Agent } from './system1-agent.js';
import { FullMemoryAgentClient, createFullMemoryAgentClient } from './full-memory-agent-client.js';
import { FullMemoryAgentServer, createFullMemoryAgentServer } from './full-memory-agent-server.js';
import { AgentCommunicationManager, createAgentCommunicationManager } from './agent-communication.js';

// v10 新增：核心创新引擎
import { ResidualEngine, residualEngine } from './residual-engine.js';
import { RouterEngine, routerEngine } from './router-engine.js';
import { ConfidenceEngine, confidenceEngine } from './confidence-engine.js';
import { PersonaEngine, personaEngine } from './persona-engine.js';

// v11 新增：Git 结构化 commit
export { buildStructuredMessage, buildStructuredMessageWithContext, getAgentAuthor } from './git-sync.js';

// v13 新增：高级特性引擎
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
export async function initializeCore(config: {
  mainRepoUrl: string;
  businessRepoUrl: string;
  codeRepoUrl: string;
  privateRepoUrl: string;
  localBasePath: string;
  agentId: string;
  agentType: string;
}): Promise<void> {
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
    agentType: config.agentType as AgentInfo['agentType'],
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
    agentType: config.agentType as AgentInfo['agentType'],
    displayName: config.agentId,
    priority: 100,
    capabilities: ['memory:read', 'memory:write', 'memory:sync'],
    memoryRepoUrl: privateRepoUrl,
    lastActiveAt: new Date().toISOString(),
    status: 'online'
  });
}
