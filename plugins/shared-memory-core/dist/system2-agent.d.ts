/**
 * System2 Agent — 海绵式全量捕获
 * 负责将对话全量捕获为 MemoryRepresentation，不进行筛选
 */
import { EventEmitter } from 'eventemitter3';
import type { AgentInterface, AgentStatus, AgentRole, MemoryRepresentation } from './types.js';
export declare class System2Agent extends EventEmitter implements AgentInterface {
    readonly agentId: string;
    readonly role: AgentRole;
    readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
    private _status;
    get status(): 'idle' | 'processing' | 'error';
    private currentInput;
    private currentResult;
    constructor(agentId: string, agentType: string);
    getStatus(): AgentStatus;
    startProcessing(input: MemoryRepresentation): Promise<void>;
    getResult(): Promise<MemoryRepresentation>;
    shutdown(): Promise<void>;
    /**
     * 从原始输入中提取所有事实点（全量捕获，不做筛选）
     */
    private extractAllFacts;
}
export declare function createSystem2Agent(agentId: string, agentType: string): System2Agent;
//# sourceMappingURL=system2-agent.d.ts.map