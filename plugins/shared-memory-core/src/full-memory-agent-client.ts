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
} from './types.js';

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
  private residualQueue: FactPoint[] = [];

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

      // 管理残差队列
      this.manageResidualQueue(input);

      this.currentResult = {
        ...input,
        id: input.id || `full-client-${Date.now()}`,
        timestamp,
        residualInfo: this.calculateResidualInfo(),
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
   * 获取残差队列
   */
  getResidualQueue(): FactPoint[] {
    return [...this.residualQueue];
  }

  /**
   * 清除残差队列
   */
  clearResidualQueue(): void {
    this.residualQueue = [];
    this.emit('residualCleared', { agentId: this.agentId });
  }

  /**
   * 从残差队列移除已解决的事实
   */
  resolveResidual(factId: string): void {
    const index = this.residualQueue.findIndex(f => f.id === factId);
    if (index >= 0) {
      this.residualQueue.splice(index, 1);
      this.emit('residualResolved', { agentId: this.agentId, factId });
    }
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

  private manageResidualQueue(input: MemoryRepresentation): void {
    // 将 UNCERTAIN 的事实加入残差队列
    const uncertainFacts = input.facts.filter(f =>
      f.confidence === 'UNCERTAIN' && !f.verified
    );

    for (const fact of uncertainFacts) {
      // 检查是否已在队列中
      if (!this.residualQueue.find(f => f.id === fact.id)) {
        this.residualQueue.push({
          ...fact,
          traceabilityId: `residual-${Date.now()}`,
        });
      }
    }
  }

  private calculateResidualInfo(): ResidualInfo {
    const now = Date.now();
    let totalScore = 0;

    for (const fact of this.residualQueue) {
      // age_weight 基于置信度：UNCERTAIN = 1.0, LIKELY重入 = 0.5
      const ageWeight = fact.confidence === 'LIKELY' ? 0.5 : 1.0;
      const residualSize = fact.content.length;
      totalScore += residualSize * ageWeight;
    }

    return {
      size: this.residualQueue.length,
      ageWeight: this.residualQueue.length > 0 ? 1.0 : 0,
      residualScore: totalScore,
      lastCheckAt: new Date().toISOString(),
      cleanupLayer: totalScore > 1000 ? 1 : totalScore > 500 ? 2 : 3,
      resolutionAttempts: 0,
    };
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
