/**
 * Event Bus - 事件总线，用于智能体间通信
 */
import { EventEmitter } from 'eventemitter3';
import { MemoryEvent, MemoryEventType, AgentInfo } from './types.js';
interface EventLog {
    event: MemoryEvent;
    deliveredTo: string[];
    timestamp: string;
}
export declare class EventBus extends EventEmitter {
    private subscriptions;
    private eventLog;
    private maxLogSize;
    constructor();
    /**
     * 订阅事件
     */
    subscribe(agentId: string, eventTypes: MemoryEventType[], callback: (event: MemoryEvent) => void, filter?: (event: MemoryEvent) => boolean): string;
    /**
     * 取消订阅
     */
    unsubscribe(subscriptionId: string): void;
    /**
     * 取消智能体的所有订阅
     */
    unsubscribeAll(agentId: string): number;
    /**
     * 发布事件
     */
    publish(event: MemoryEvent): void;
    /**
     * 发布记忆创建事件
     */
    publishMemoryCreated(agentId: string, repoType: string, docId: string, path: string): void;
    /**
     * 发布记忆更新事件
     */
    publishMemoryUpdated(agentId: string, repoType: string, docId: string, path: string, changes: Record<string, unknown>): void;
    /**
     * 发布记忆删除事件
     */
    publishMemoryDeleted(agentId: string, repoType: string, docId: string, path: string): void;
    /**
     * 发布同步完成事件
     */
    publishMemorySynced(agentId: string, repoType: string, result: {
        success: boolean;
        pulled: number;
        pushed: number;
    }): void;
    /**
     * 发布冲突检测事件
     */
    publishConflictDetected(agentId: string, repoType: string, conflicts: Array<{
        filePath: string;
        type: string;
    }>): void;
    /**
     * 发布智能体上线事件
     */
    publishAgentOnline(agent: AgentInfo): void;
    /**
     * 发布智能体离线事件
     */
    publishAgentOffline(agentId: string): void;
    /**
     * 获取事件日志
     */
    getEventLog(limit?: number, eventType?: MemoryEventType): EventLog[];
    /**
     * 获取订阅统计
     */
    getSubscriptionStats(): {
        total: number;
        byAgent: Record<string, number>;
        byType: Record<string, number>;
    };
    /**
     * 清除事件日志
     */
    clearLog(): void;
}
export declare const eventBus: EventBus;
export {};
//# sourceMappingURL=event-bus.d.ts.map