/**
 * FullMemoryAgent Client — 本地文件写入 + 残差调度
 * 负责将 System1 精炼后的记忆写入本地 MEMORY.md 文件
 */
import { EventEmitter } from 'eventemitter3';
import type { AgentInterface, AgentStatus, AgentRole, MemoryRepresentation, FactPoint } from './types.js';
export declare class FullMemoryAgentClient extends EventEmitter implements AgentInterface {
    readonly agentId: string;
    readonly role: AgentRole;
    readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
    private _status;
    get status(): 'idle' | 'processing' | 'error';
    private currentInput;
    private currentResult;
    private localMemoryPath;
    private residualQueue;
    constructor(agentId: string, agentType: string, localMemoryPath: string);
    getStatus(): AgentStatus;
    startProcessing(input: MemoryRepresentation): Promise<void>;
    getResult(): Promise<MemoryRepresentation>;
    shutdown(): Promise<void>;
    /**
     * 获取残差队列
     */
    getResidualQueue(): FactPoint[];
    /**
     * 清除残差队列
     */
    clearResidualQueue(): void;
    /**
     * 从残差队列移除已解决的事实
     */
    resolveResidual(factId: string): void;
    private buildMemoryMarkdown;
    private manageResidualQueue;
    private calculateResidualInfo;
}
export declare function createFullMemoryAgentClient(agentId: string, agentType: string, localMemoryPath: string): FullMemoryAgentClient;
//# sourceMappingURL=full-memory-agent-client.d.ts.map