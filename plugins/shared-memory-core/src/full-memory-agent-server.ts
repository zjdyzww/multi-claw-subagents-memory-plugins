/**
 * FullMemoryAgent Server — 远程同步 + 跨网关广播消息中枢
 * 负责将本地记忆推送到 Gitea 远程仓库，接受跨网关广播
 */

import { EventEmitter } from 'eventemitter3';
import type {
  AgentInterface,
  AgentStatus,
  AgentRole,
  MemoryRepresentation,
  CleanupRecord,
} from './types.js';
import { GitSyncManager } from './git-sync.js';
import { EventBus } from './event-bus.js';

export class FullMemoryAgentServer extends EventEmitter implements AgentInterface {
  public readonly agentId: string;
  public readonly role: AgentRole = 'full_server';
  public readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
  private _status: AgentStatus;

  get status(): 'idle' | 'processing' | 'error' {
    return this._status.status;
  }
  private currentInput: MemoryRepresentation | null = null;
  private currentResult: MemoryRepresentation | null = null;
  private gitSync: GitSyncManager;
  private eventBus: EventBus;
  private cleanupRecords: CleanupRecord[] = [];
  private receivedBroadcasts: MemoryRepresentation[] = [];

  constructor(agentId: string, agentType: string, gitSync: GitSyncManager, eventBus: EventBus) {
    super();
    this.agentId = agentId;
    this.agentType = agentType as AgentInterface['agentType'];
    this.gitSync = gitSync;
    this.eventBus = eventBus;
    this._status = {
      agentId,
      role: 'full_server',
      status: 'idle',
      processedCount: 0,
      errorCount: 0,
    };

    this.setupEventListeners();
  }

  getStatus(): AgentStatus {
    return { ...this._status };
  }

  async startProcessing(input: MemoryRepresentation): Promise<void> {
    this._status.status = 'processing';
    this.currentInput = input;
    this.emit('processingStarted', { agentId: this.agentId, input });

    try {
      // 推送到远程仓库
      const syncResults = await this.syncAllRepos(input);
      // 广播消息到其他网关
      this.broadcastToGateways(input, syncResults);

      this.currentResult = {
        ...input,
        id: input.id || `full-server-${Date.now()}`,
        timestamp: new Date().toISOString(),
        metadata: {
          ...input.metadata,
          syncResults,
          broadcastSent: true,
        },
      };

      this._status.processedCount++;
      this._status.lastProcessedAt = new Date().toISOString();
      this._status.status = 'idle';
      this.emit('processingComplete', { agentId: this.agentId, result: this.currentResult });
    } catch (error) {
      this._status.status = 'error';
      this._status.errorCount++;
      this._status.errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('processingError', { agentId: this.agentId, error });
      throw error;
    }
  }

  async getResult(): Promise<MemoryRepresentation> {
    if (!this.currentResult) {
      throw new Error('No result available. Call startProcessing first.');
    }
    return this.currentResult;
  }

  async shutdown(): Promise<void> {
    this._status.status = 'idle';
    this.currentInput = null;
    this.currentResult = null;
    this.eventBus.removeAllListeners();
    this.emit('shutdown', { agentId: this.agentId });
  }

  /**
   * 接收来自其他网关的广播
   */
  receiveBroadcast(broadcast: MemoryRepresentation): void {
    this.receivedBroadcasts.push(broadcast);
    this.emit('broadcastReceived', { agentId: this.agentId, broadcast });
  }

  getReceivedBroadcasts(): MemoryRepresentation[] {
    return [...this.receivedBroadcasts];
  }

  /**
   * 记录清理操作
   */
  recordCleanup(record: CleanupRecord): void {
    this.cleanupRecords.push(record);
    this.emit('cleanupRecorded', { agentId: this.agentId, record });
  }

  getCleanupRecords(): CleanupRecord[] {
    return [...this.cleanupRecords];
  }

  /**
   * 同步所有仓库
   */
  private async syncAllRepos(input: MemoryRepresentation): Promise<string[]> {
    const results: string[] = [];
    const repos = this.gitSync.getRegisteredRepos();

    for (const repo of repos) {
      try {
        const result = await this.gitSync.syncRepo(repo.type, {
          message: `[FULL-PERSIST] ${input.id || 'auto'} - ${new Date().toISOString()}`,
        });
        results.push(`${repo.type}: ${result.success ? 'OK' : 'FAIL'}`);
      } catch {
        results.push(`${repo.type}: ERROR`);
      }
    }

    return results;
  }

  /**
   * 跨网关广播
   */
  private broadcastToGateways(input: MemoryRepresentation, _syncResults: string[]): void {
    this.eventBus.publish({
      type: 'memory.synced',
      agentId: this.agentId,
      repoType: 'main',
      payload: {
        memoryId: input.id,
        sourceAgent: this.agentId,
        gatewayType: this.agentType,
        factCount: input.facts.length,
        timestamp: input.timestamp,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听跨网关广播
    this.eventBus.on('memory.synced', (event) => {
      if (event.agentId !== this.agentId) {
        this.emit('externalSync', { agentId: this.agentId, event });
      }
    });

    this.eventBus.on('agent.online', (event) => {
      this.emit('peerOnline', { agentId: this.agentId, peer: event.agentId });
    });

    this.eventBus.on('agent.offline', (event) => {
      this.emit('peerOffline', { agentId: this.agentId, peer: event.agentId });
    });
  }
}

// 导出工厂函数
export function createFullMemoryAgentServer(
  agentId: string,
  agentType: string,
  gitSync: GitSyncManager,
  eventBus: EventBus
): FullMemoryAgentServer {
  return new FullMemoryAgentServer(agentId, agentType, gitSync, eventBus);
}
