/**
 * Agent Communication — 代理间通信协议接口定义
 * 提供标准化的三代理消息传递、握手、心跳和错误处理
 */
/**
 * AgentCommunicationManager — 管理三代理间通信
 *
 * 通信拓扑:
 *   System2 ──handoff──> System1 ──handoff──> FullClient ──sync──> FullServer
 *                        ^<──query────                         <──broadcast──
 */
export class AgentCommunicationManager {
    handlers = new Map();
    states = new Map();
    messageQueue = [];
    config;
    heartbeatTimers = new Map();
    constructor(config) {
        this.config = {
            maxRetries: 3,
            retryDelayMs: 1000,
            heartbeatIntervalMs: 30000,
            messageTimeoutMs: 10000,
            maxQueueSize: 1000,
            ...config,
        };
    }
    /**
     * 建立两个代理间的连接
     */
    connect(fromAgentId, fromRole, toAgentId, toRole, handler) {
        const connectionId = `${fromAgentId}->${toAgentId}`;
        this.handlers.set(connectionId, handler);
        const state = {
            connectionId,
            fromAgent: fromAgentId,
            fromRole,
            toAgent: toAgentId,
            toRole,
            status: 'connected',
            lastHeartbeat: new Date().toISOString(),
            messagesSent: 0,
            messagesReceived: 0,
            errors: 0,
        };
        this.states.set(connectionId, state);
        // 启动心跳
        const timer = setInterval(() => {
            this.sendHeartbeat(connectionId);
        }, this.config.heartbeatIntervalMs);
        this.heartbeatTimers.set(connectionId, timer);
        return state;
    }
    /**
     * 断开连接
     */
    disconnect(fromAgentId, toAgentId) {
        const connectionId = `${fromAgentId}->${toAgentId}`;
        const timer = this.heartbeatTimers.get(connectionId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(connectionId);
        }
        this.handlers.delete(connectionId);
        const state = this.states.get(connectionId);
        if (state) {
            state.status = 'disconnected';
        }
    }
    /**
     * 发送 AgentMessage（System2 → System1 handoff）
     */
    async sendMessage(message) {
        const connectionId = `${message.from}->${message.to}`;
        const state = this.states.get(connectionId);
        if (!state || state.status !== 'connected') {
            return false;
        }
        // 队列溢出保护
        if (this.messageQueue.length >= this.config.maxQueueSize) {
            return false;
        }
        this.messageQueue.push(message);
        state.messagesSent++;
        const handler = this.handlers.get(connectionId);
        if (!handler) {
            state.errors++;
            return false;
        }
        try {
            const response = await this.deliverWithRetry(message, handler);
            state.lastHeartbeat = new Date().toISOString();
            return response !== null;
        }
        catch {
            state.errors++;
            return false;
        }
    }
    /**
     * 发送查询消息
     */
    async sendQuery(fromAgentId, toAgentId, query, options) {
        const queryMessage = {
            messageId: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: fromAgentId,
            to: toAgentId,
            type: 'query',
            priority: 'normal',
            timestamp: new Date().toISOString(),
            requiresAck: true,
            payload: {
                query,
                targetRepo: options?.targetRepo,
                maxResults: options?.maxResults || 10,
                strategy: options?.strategy || 'direct',
            },
        };
        const success = await this.sendMessage(queryMessage);
        return success ? queryMessage : null;
    }
    /**
     * 广播消息到所有连接的代理
     */
    async broadcastMessage(fromAgentId, payload) {
        const deliveredTo = [];
        for (const [connectionId, state] of this.states) {
            if (state.fromAgent === fromAgentId && state.status === 'connected') {
                const message = {
                    messageId: `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    from: fromAgentId,
                    to: state.toAgent,
                    type: 'broadcast',
                    priority: 'low',
                    payload,
                    timestamp: new Date().toISOString(),
                    requiresAck: false,
                    ttl: this.config.heartbeatIntervalMs * 2,
                };
                const sent = await this.sendMessage(message);
                if (sent) {
                    deliveredTo.push(state.toAgent);
                }
            }
        }
        return deliveredTo;
    }
    /**
     * 获取通信状态
     */
    getState(fromAgentId, toAgentId) {
        return this.states.get(`${fromAgentId}->${toAgentId}`);
    }
    /**
     * 获取所有通信状态
     */
    getAllStates() {
        return Array.from(this.states.values());
    }
    /**
     * 关闭所有连接
     */
    shutdown() {
        for (const [connectionId, timer] of this.heartbeatTimers) {
            clearInterval(timer);
        }
        this.heartbeatTimers.clear();
        this.handlers.clear();
        for (const state of this.states.values()) {
            state.status = 'disconnected';
        }
    }
    /**
     * 带重试的消息投递
     */
    async deliverWithRetry(message, handler, attempt = 0) {
        try {
            return await handler(message);
        }
        catch {
            if (attempt < this.config.maxRetries) {
                await this.delay(this.config.retryDelayMs * (attempt + 1));
                return this.deliverWithRetry(message, handler, attempt + 1);
            }
            throw new Error(`Failed to deliver message after ${this.config.maxRetries} retries`);
        }
    }
    /**
     * 心跳保活
     */
    sendHeartbeat(connectionId) {
        const state = this.states.get(connectionId);
        if (!state || state.status !== 'connected')
            return;
        const heartbeat = {
            messageId: `heartbeat-${Date.now()}`,
            from: state.fromAgent,
            to: state.toAgent,
            type: 'heartbeat',
            priority: 'low',
            payload: { heartbeat: true },
            timestamp: new Date().toISOString(),
            requiresAck: false,
        };
        const handler = this.handlers.get(connectionId);
        if (handler) {
            handler(heartbeat).catch(() => {
                state.errors++;
            });
            state.lastHeartbeat = new Date().toISOString();
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// 导出工厂函数
export function createAgentCommunicationManager(config) {
    return new AgentCommunicationManager(config);
}
//# sourceMappingURL=agent-communication.js.map