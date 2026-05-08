/**
 * FullMemoryAgent Server — 远程同步 + 跨网关广播消息中枢
 * 负责将本地记忆推送到 Gitea 远程仓库，接受跨网关广播
 */
import { EventEmitter } from 'eventemitter3';
import type { AgentInterface, AgentStatus, AgentRole, MemoryRepresentation, CleanupRecord } from './types.js';
import { GitSyncManager } from './git-sync.js';
import { EventBus } from './event-bus.js';
export declare class FullMemoryAgentServer extends EventEmitter implements AgentInterface {
    readonly agentId: string;
    readonly role: AgentRole;
    readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
    private _status;
    get status(): 'idle' | 'processing' | 'error';
    private currentInput;
    private currentResult;
    private gitSync;
    private eventBus;
    private cleanupRecords;
    private receivedBroadcasts;
    constructor(agentId: string, agentType: string, gitSync: GitSyncManager, eventBus: EventBus);
    getStatus(): AgentStatus;
    startProcessing(input: MemoryRepresentation): Promise<void>;
    getResult(): Promise<MemoryRepresentation>;
    shutdown(): Promise<void>;
    /**
     * 接收来自其他网关的广播
     */
    receiveBroadcast(broadcast: MemoryRepresentation): void;
    getReceivedBroadcasts(): MemoryRepresentation[];
    /**
     * 记录清理操作
     */
    recordCleanup(record: CleanupRecord): void;
    getCleanupRecords(): CleanupRecord[];
    /**
     * 同步所有仓库
     */
    private syncAllRepos;
    /**
     * 跨网关广播
     */
    private broadcastToGateways;
    /**
     * 设置事件监听
     */
    private setupEventListeners;
}
export declare function createFullMemoryAgentServer(agentId: string, agentType: string, gitSync: GitSyncManager, eventBus: EventBus): FullMemoryAgentServer;
//# sourceMappingURL=full-memory-agent-server.d.ts.map