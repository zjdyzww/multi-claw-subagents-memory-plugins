/**
 * System2 Agent — 海绵式全量捕获
 * 负责将对话全量捕获为 MemoryRepresentation，不进行筛选
 */

import { EventEmitter } from 'eventemitter3';
import type {
  AgentInterface,
  AgentStatus,
  AgentRole,
  MemoryRepresentation,
  FactPoint,
  ConfidenceLevel,
} from './types.js';

export class System2Agent extends EventEmitter implements AgentInterface {
  public readonly agentId: string;
  public readonly role: AgentRole = 'system2';
  public readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
  private _status: AgentStatus;

  get status(): 'idle' | 'processing' | 'error' {
    return this._status.status;
  }
  private currentInput: MemoryRepresentation | null = null;
  private currentResult: MemoryRepresentation | null = null;

  constructor(agentId: string, agentType: string) {
    super();
    this.agentId = agentId;
    this.agentType = agentType as AgentInterface['agentType'];
    this._status = {
      agentId,
      role: 'system2',
      status: 'idle',
      processedCount: 0,
      errorCount: 0,
    };
  }

  getStatus(): AgentStatus {
    return { ...this._status };
  }

  async startProcessing(input: MemoryRepresentation): Promise<void> {
    this._status.status = 'processing';
    this.currentInput = input;
    this.emit('processingStarted', { agentId: this.agentId, input });

    try {
      // System2 职责：全量捕获，不做过滤
      // 将原始对话内容转换为结构化的 MemoryRepresentation
      const facts = this.extractAllFacts(input);

      this.currentResult = {
        id: input.id || `sys2-${Date.now()}`,
        rawContent: input.rawContent,
        facts,
        confidence: 'UNCERTAIN',
        source: input.source || 'conversation',
        timestamp: new Date().toISOString(),
        metadata: input.metadata || {},
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
    this.emit('shutdown', { agentId: this.agentId });
  }

  /**
   * 从原始输入中提取所有事实点（全量捕获，不做筛选）
   */
  private extractAllFacts(input: MemoryRepresentation): FactPoint[] {
    const facts: FactPoint[] = [];
    const rawText = input.rawContent || '';

    if (!rawText.trim()) {
      return facts;
    }

    // 按段落/句子分割
    const segments = rawText
      .split(/\n{2,}/)
      .filter(s => s.trim().length > 0);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i].trim();
      facts.push({
        id: `${input.id || 'sys2'}-f${i}`,
        content: segment,
        confidence: 'UNCERTAIN',
        source: input.source || 'conversation',
        category: 'raw_capture',
        verified: false,
      });
    }

    return facts;
  }
}

// 导出工厂函数
export function createSystem2Agent(agentId: string, agentType: string): System2Agent {
  return new System2Agent(agentId, agentType);
}
