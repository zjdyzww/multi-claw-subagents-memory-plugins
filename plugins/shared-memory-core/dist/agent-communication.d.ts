/**
 * Agent Communication — 代理间通信协议接口定义
 * 提供标准化的三代理消息传递、握手、心跳和错误处理
 */
import type { AgentMessage, AgentRole, RepoType } from './types.js';
export interface CommunicationState {
    connectionId: string;
    fromAgent: string;
    fromRole: AgentRole;
    toAgent: string;
    toRole: AgentRole;
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    lastHeartbeat: string;
    messagesSent: number;
    messagesReceived: number;
    errors: number;
}
export type MessageHandler = (message: AgentMessage) => Promise<AgentMessage | null>;
export interface PipelineConfig {
    maxRetries: number;
    retryDelayMs: number;
    heartbeatIntervalMs: number;
    messageTimeoutMs: number;
    maxQueueSize: number;
}
/**
 * AgentCommunicationManager — 管理三代理间通信
 *
 * 通信拓扑:
 *   System2 ──handoff──> System1 ──handoff──> FullClient ──sync──> FullServer
 *                        ^<──query────                         <──broadcast──
 */
export declare class AgentCommunicationManager {
    private handlers;
    private states;
    private messageQueue;
    private config;
    private heartbeatTimers;
    constructor(config?: Partial<PipelineConfig>);
    /**
     * 建立两个代理间的连接
     */
    connect(fromAgentId: string, fromRole: AgentRole, toAgentId: string, toRole: AgentRole, handler: MessageHandler): CommunicationState;
    /**
     * 断开连接
     */
    disconnect(fromAgentId: string, toAgentId: string): void;
    /**
     * 发送 AgentMessage（System2 → System1 handoff）
     */
    sendMessage(message: AgentMessage): Promise<boolean>;
    /**
     * 发送查询消息
     */
    sendQuery(fromAgentId: string, toAgentId: string, query: string, options?: {
        targetRepo?: RepoType;
        maxResults?: number;
        strategy?: 'direct' | 'parallel' | 'iterative';
    }): Promise<AgentMessage | null>;
    /**
     * 广播消息到所有连接的代理
     */
    broadcastMessage(fromAgentId: string, payload: Record<string, unknown>): Promise<string[]>;
    /**
     * 获取通信状态
     */
    getState(fromAgentId: string, toAgentId: string): CommunicationState | undefined;
    /**
     * 获取所有通信状态
     */
    getAllStates(): CommunicationState[];
    /**
     * 关闭所有连接
     */
    shutdown(): void;
    /**
     * 带重试的消息投递（迭代实现，避免递归栈溢出）
     */
    private deliverWithRetry;
    /**
     * 心跳保活
     */
    private sendHeartbeat;
    private delay;
}
export declare function createAgentCommunicationManager(config?: Partial<PipelineConfig>): AgentCommunicationManager;
//# sourceMappingURL=agent-communication.d.ts.map