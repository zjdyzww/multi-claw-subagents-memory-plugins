/**
 * FullMemoryAgent Server — 远程同步 + 跨网关广播消息中枢
 * 负责将本地记忆推送到 Gitea 远程仓库，接受跨网关广播
 */
import { EventEmitter } from 'eventemitter3';
export class FullMemoryAgentServer extends EventEmitter {
    agentId;
    role = 'full_server';
    agentType;
    _status;
    get status() {
        return this._status.status;
    }
    currentInput = null;
    currentResult = null;
    gitSync;
    eventBus;
    cleanupRecords = [];
    receivedBroadcasts = [];
    constructor(agentId, agentType, gitSync, eventBus) {
        super();
        this.agentId = agentId;
        this.agentType = agentType;
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
    getStatus() {
        return { ...this._status };
    }
    async startProcessing(input) {
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
        }
        catch (error) {
            this._status.status = 'error';
            this._status.errorCount++;
            this._status.errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('processingError', { agentId: this.agentId, error });
            throw error;
        }
    }
    async getResult() {
        if (!this.currentResult) {
            throw new Error('No result available. Call startProcessing first.');
        }
        return this.currentResult;
    }
    async shutdown() {
        this._status.status = 'idle';
        this.currentInput = null;
        this.currentResult = null;
        this.eventBus.removeAllListeners();
        this.emit('shutdown', { agentId: this.agentId });
    }
    /**
     * 接收来自其他网关的广播
     */
    receiveBroadcast(broadcast) {
        this.receivedBroadcasts.push(broadcast);
        this.emit('broadcastReceived', { agentId: this.agentId, broadcast });
    }
    getReceivedBroadcasts() {
        return [...this.receivedBroadcasts];
    }
    /**
     * 记录清理操作
     */
    recordCleanup(record) {
        this.cleanupRecords.push(record);
        this.emit('cleanupRecorded', { agentId: this.agentId, record });
    }
    getCleanupRecords() {
        return [...this.cleanupRecords];
    }
    /**
     * 同步所有仓库
     */
    async syncAllRepos(input) {
        const results = [];
        const repos = this.gitSync.getRegisteredRepos();
        for (const repo of repos) {
            try {
                const result = await this.gitSync.syncRepo(repo.type, {
                    message: `[FULL-PERSIST] ${input.id || 'auto'} - ${new Date().toISOString()}`,
                });
                results.push(`${repo.type}: ${result.success ? 'OK' : 'FAIL'}`);
            }
            catch {
                results.push(`${repo.type}: ERROR`);
            }
        }
        return results;
    }
    /**
     * 跨网关广播
     */
    broadcastToGateways(input, _syncResults) {
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
    setupEventListeners() {
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
export function createFullMemoryAgentServer(agentId, agentType, gitSync, eventBus) {
    return new FullMemoryAgentServer(agentId, agentType, gitSync, eventBus);
}
//# sourceMappingURL=full-memory-agent-server.js.map