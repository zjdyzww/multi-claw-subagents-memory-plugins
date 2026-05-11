/**
 * FullMemoryAgent Client — 本地文件写入 + 残差调度
 * 负责将 System1 精炼后的记忆写入本地 MEMORY.md 文件
 */
import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs';
import * as path from 'path';
import { residualEngine } from './residual-engine.js';
export class FullMemoryAgentClient extends EventEmitter {
    agentId;
    role = 'full_client';
    agentType;
    _status;
    get status() {
        return this._status.status;
    }
    currentInput = null;
    currentResult = null;
    localMemoryPath;
    constructor(agentId, agentType, localMemoryPath) {
        super();
        this.agentId = agentId;
        this.agentType = agentType;
        this.localMemoryPath = localMemoryPath;
        this._status = {
            agentId,
            role: 'full_client',
            status: 'idle',
            processedCount: 0,
            errorCount: 0,
        };
    }
    getStatus() {
        return { ...this._status };
    }
    async startProcessing(input) {
        this._status.status = 'processing';
        this.currentInput = input;
        this.emit('processingStarted', { agentId: this.agentId, input });
        try {
            // 确保目录存在
            const dir = path.dirname(this.localMemoryPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // 构建写入内容
            const timestamp = new Date().toISOString();
            const markdown = this.buildMemoryMarkdown(input, timestamp);
            // 追加写入本地 MEMORY.md
            fs.appendFileSync(this.localMemoryPath, markdown, 'utf-8');
            // 管理残差队列（委托到中央 ResidualEngine）
            this.delegateResiduals(input);
            this.currentResult = {
                ...input,
                id: input.id || `full-client-${Date.now()}`,
                timestamp,
                residualInfo: residualEngine.getResidualInfo(),
            };
            this._status.processedCount++;
            this._status.lastProcessedAt = timestamp;
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
        this.emit('shutdown', { agentId: this.agentId });
    }
    /**
     * 获取残差队列（委托到中央 ResidualEngine）
     */
    getResidualQueue() {
        return residualEngine.getQueue().map(e => e.fact);
    }
    /**
     * 清除残差队列（委托到中央 ResidualEngine）
     */
    clearResidualQueue() {
        // 遍历并强制解析所有条目
        for (const entry of residualEngine.getQueue()) {
            residualEngine.resolve(entry.fact.id, 'forced');
        }
        this.emit('residualCleared', { agentId: this.agentId });
    }
    /**
     * 从残差队列移除已解决的事实（委托到中央 ResidualEngine）
     */
    resolveResidual(factId) {
        residualEngine.resolve(factId, 'active');
        this.emit('residualResolved', { agentId: this.agentId, factId });
    }
    buildMemoryMarkdown(input, timestamp) {
        const date = timestamp.split('T')[0];
        const time = timestamp.split('T')[1]?.split('.')[0] || '';
        let md = `\n---\n## ${date} ${time}\n\n`;
        if (input.refinedContent) {
            md += input.refinedContent + '\n';
        }
        else {
            for (const fact of input.facts) {
                const marker = fact.confidence === 'CONFIRMED' ? '🟢'
                    : fact.confidence === 'LIKELY' ? '🟡' : '🔴';
                md += `- ${marker} ${fact.content}\n`;
            }
        }
        return md;
    }
    delegateResiduals(input) {
        // 将 UNCERTAIN 的事实加入中央 ResidualEngine
        const uncertainFacts = input.facts.filter(f => f.confidence === 'UNCERTAIN' && !f.verified);
        for (const fact of uncertainFacts) {
            const enqueued = {
                ...fact,
                traceabilityId: `residual-${Date.now()}`,
            };
            residualEngine.enqueue(enqueued);
        }
    }
}
// 导出工厂函数
export function createFullMemoryAgentClient(agentId, agentType, localMemoryPath) {
    return new FullMemoryAgentClient(agentId, agentType, localMemoryPath);
}
//# sourceMappingURL=full-memory-agent-client.js.map