/**
 * System1 Agent — 淘金式精炼
 * 接收 System2 的全量 MemoryRepresentation，按7条标准筛选精炼
 */
import { EventEmitter } from 'eventemitter3';
import type { AgentInterface, AgentStatus, AgentRole, MemoryRepresentation } from './types.js';
export declare class System1Agent extends EventEmitter implements AgentInterface {
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
     * 按7项标准筛选精炼事实点
     *
     * 1. 用户明确表达 — 置信度: CONFIRMED
     * 2. 关键决策结论 — 置信度: CONFIRMED
     * 3. 环境/配置变更 — 置信度: CONFIRMED
     * 4. 合理推断 — 置信度: LIKELY
     * 5. 首次获取信息 — 置信度: LIKELY
     * 6. 模糊表达 — 置信度: UNCERTAIN (保留但不升级)
     * 7. 与已有矛盾 — 置信度: UNCERTAIN (标记冲突)
     */
    private refineFacts;
    private evaluateFact;
    private calculateOverallConfidence;
    private buildRefinedContent;
}
export declare function createSystem1Agent(agentId: string, agentType: string): System1Agent;
//# sourceMappingURL=system1-agent.d.ts.map