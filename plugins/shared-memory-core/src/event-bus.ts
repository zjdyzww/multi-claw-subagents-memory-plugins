/**
 * Event Bus - 事件总线，用于智能体间通信
 */

import { EventEmitter } from 'eventemitter3';
import { MemoryEvent, MemoryEventType, AgentInfo } from './types.js';

interface EventSubscription {
  id: string;
  agentId: string;
  eventTypes: MemoryEventType[];
  callback: (event: MemoryEvent) => void;
  filter?: (event: MemoryEvent) => boolean;
}

interface EventLog {
  event: MemoryEvent;
  deliveredTo: string[];
  timestamp: string;
}

export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventLog: EventLog[] = [];
  private maxLogSize = 1000;

  constructor() {
    super();
  }

  /**
   * 订阅事件
   */
  subscribe(
    agentId: string,
    eventTypes: MemoryEventType[],
    callback: (event: MemoryEvent) => void,
    filter?: (event: MemoryEvent) => boolean
  ): string {
    const id = `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: EventSubscription = {
      id,
      agentId,
      eventTypes,
      callback,
      filter
    };

    this.subscriptions.set(id, subscription);
    return id;
  }

  /**
   * 取消订阅
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * 取消智能体的所有订阅
   */
  unsubscribeAll(agentId: string): number {
    let count = 0;
    for (const [id, sub] of this.subscriptions) {
      if (sub.agentId === agentId) {
        this.subscriptions.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * 发布事件
   */
  publish(event: MemoryEvent): void {
    // 记录到日志
    const logEntry: EventLog = {
      event,
      deliveredTo: [],
      timestamp: new Date().toISOString()
    };

    // 查找匹配的订阅者
    for (const [id, sub] of this.subscriptions) {
      if (sub.eventTypes.includes(event.type)) {
        // 应用过滤器
        if (sub.filter && !sub.filter(event)) {
          continue;
        }

        // 异步调用回调，避免阻塞
        setImmediate(() => {
          try {
            sub.callback(event);
            logEntry.deliveredTo.push(sub.agentId);
          } catch (error) {
            console.error(`Error delivering event to ${sub.agentId}:`, error);
          }
        });
      }
    }

    // 记录日志
    this.eventLog.push(logEntry);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // 同时触发本地事件
    this.emit(event.type, event);
  }

  /**
   * 发布记忆创建事件
   */
  publishMemoryCreated(agentId: string, repoType: string, docId: string, path: string): void {
    this.publish({
      type: 'memory.created',
      agentId,
      repoType: repoType as any,
      payload: { docId, path },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布记忆更新事件
   */
  publishMemoryUpdated(agentId: string, repoType: string, docId: string, path: string, changes: Record<string, unknown>): void {
    this.publish({
      type: 'memory.updated',
      agentId,
      repoType: repoType as any,
      payload: { docId, path, changes },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布记忆删除事件
   */
  publishMemoryDeleted(agentId: string, repoType: string, docId: string, path: string): void {
    this.publish({
      type: 'memory.deleted',
      agentId,
      repoType: repoType as any,
      payload: { docId, path },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布同步完成事件
   */
  publishMemorySynced(agentId: string, repoType: string, result: { success: boolean; pulled: number; pushed: number }): void {
    this.publish({
      type: 'memory.synced',
      agentId,
      repoType: repoType as any,
      payload: result,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布冲突检测事件
   */
  publishConflictDetected(agentId: string, repoType: string, conflicts: Array<{ filePath: string; type: string }>): void {
    this.publish({
      type: 'conflict.detected',
      agentId,
      repoType: repoType as any,
      payload: { conflicts },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布智能体上线事件
   */
  publishAgentOnline(agent: AgentInfo): void {
    this.publish({
      type: 'agent.online',
      agentId: agent.agentId,
      repoType: 'main',
      payload: {
        agentId: agent.agentId,
        agentType: agent.agentType,
        displayName: agent.displayName
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发布智能体离线事件
   */
  publishAgentOffline(agentId: string): void {
    this.publish({
      type: 'agent.offline',
      agentId,
      repoType: 'main',
      payload: { agentId },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 获取事件日志
   */
  getEventLog(limit = 100, eventType?: MemoryEventType): EventLog[] {
    let logs = this.eventLog;
    
    if (eventType) {
      logs = logs.filter(log => log.event.type === eventType);
    }
    
    return logs.slice(-limit);
  }

  /**
   * 获取订阅统计
   */
  getSubscriptionStats(): { total: number; byAgent: Record<string, number>; byType: Record<string, number> } {
    const byAgent: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const sub of this.subscriptions.values()) {
      byAgent[sub.agentId] = (byAgent[sub.agentId] || 0) + 1;
      for (const type of sub.eventTypes) {
        byType[type] = (byType[type] || 0) + 1;
      }
    }

    return {
      total: this.subscriptions.size,
      byAgent,
      byType
    };
  }

  /**
   * 清除事件日志
   */
  clearLog(): void {
    this.eventLog = [];
  }
}

// 导出单例
export const eventBus = new EventBus();
