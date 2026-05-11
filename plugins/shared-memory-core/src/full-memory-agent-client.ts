/**
 * FullMemoryAgent Client — 本地文件写入 + 残差调度
 * 负责将 System1 精炼后的记忆写入本地 MEMORY.md 文件
 */

import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs';
import * as path from 'path';
import type {
  AgentInterface,
  AgentStatus,
  AgentRole,
  MemoryRepresentation,
  FactPoint,
  ResidualInfo,
  CleanupRecord,
} from './types.js';
import { residualEngine } from './residual-engine.js';

export class FullMemoryAgentClient extends EventEmitter implements AgentInterface {
  public readonly agentId: string;
  public readonly role: AgentRole = 'full_client';
  public readonly agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
  private _status: AgentStatus;

  get status(): 'idle' | 'processing' | 'error' {
    return this._status.status;
  }
  private currentInput: MemoryRepresentation | null = null;
  private currentResult: MemoryRepresentation | null = null;
  private localMemoryPath: string;

  constructor(agentId: string, agentType: string, localMemoryPath: string) {
    super();
    this.agentId = agentId;
    this.agentType = agentType as AgentInterface['agentType'];
    this.localMemoryPath = localMemoryPath;
    this._status = {
      agentId,
      role: 'full_client',
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
   * 获取残差队列（委托到中央 ResidualEngine）
   */
  getResidualQueue(): FactPoint[] {
    return residualEngine.getQueue().map(e => e.fact);
  }

  /**
   * 清除残差队列（委托到中央 ResidualEngine）
   */
  clearResidualQueue(): void {
    // 遍历并强制解析所有条目
    for (const entry of residualEngine.getQueue()) {
      residualEngine.resolve(entry.fact.id, 'forced');
    }
    this.emit('residualCleared', { agentId: this.agentId });
  }

  /**
   * 从残差队列移除已解决的事实（委托到中央 ResidualEngine）
   */
  resolveResidual(factId: string): void {
    residualEngine.resolve(factId, 'active');
    this.emit('residualResolved', { agentId: this.agentId, factId });
  }

  private buildMemoryMarkdown(input: MemoryRepresentation, timestamp: string): string {
    const date = timestamp.split('T')[0];
    const time = timestamp.split('T')[1]?.split('.')[0] || '';

    let md = `\n---\n## ${date} ${time}\n\n`;

    if (input.refinedContent) {
      md += input.refinedContent + '\n';
    } else {
      for (const fact of input.facts) {
        const marker = fact.confidence === 'CONFIRMED' ? '🟢'
          : fact.confidence === 'LIKELY' ? '🟡' : '🔴';
        md += `- ${marker} ${fact.content}\n`;
      }
    }

    return md;
  }

  private delegateResiduals(input: MemoryRepresentation): void {
    // 将 UNCERTAIN 的事实加入中央 ResidualEngine
    const uncertainFacts = input.facts.filter(f =>
      f.confidence === 'UNCERTAIN' && !f.verified
    );

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
export function createFullMemoryAgentClient(
  agentId: string,
  agentType: string,
  localMemoryPath: string
): FullMemoryAgentClient {
  return new FullMemoryAgentClient(agentId, agentType, localMemoryPath);
}
