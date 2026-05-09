/**
 * Confidence Engine — 置信度传播引擎
 *
 * 🟢 CONFIRMED / 🟡 LIKELY / 🔴 UNCERTAIN 三级标注
 * 置信度链存储与更新、冲突检测与处理协议、traceabilityId 溯源关联
 * 基于 CONFIDENCE_PROPAGATION.md 中定义的规则
 */

import { EventEmitter } from 'eventemitter3';
import type {
  MemoryDocument,
  ConfidenceLevel,
  ConfidenceChainEntry,
  ConfidenceMetadata,
} from './types.js';

interface ConflictRecord {
  id: string;
  docId: string;
  newLevel: ConfidenceLevel;
  existingLevel: ConfidenceLevel;
  newSource: string;
  existingSource: string;
  resolutionStrategy: 'replace' | 'keep_both' | 'ignore';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

interface ConfidenceStats {
  totalAnnotated: number;
  confirmedCount: number;
  likelyCount: number;
  uncertainCount: number;
  conflictCount: number;
  resolvedConflictCount: number;
}

export class ConfidenceEngine extends EventEmitter {
  private annotations: Map<string, ConfidenceMetadata> = new Map();
  private conflicts: ConflictRecord[] = [];
  private maxConflicts = 200;

  /**
   * 标注文档置信度
   */
  annotate(
    doc: MemoryDocument,
    level: ConfidenceLevel,
    source: string,
    factSource: string,
    reason?: string
  ): MemoryDocument {
    const existing = this.annotations.get(doc.id);
    const now = new Date().toISOString();

    // 检测冲突：有已存在的标注且来源不同
    if (existing && existing.updatedBy !== source) {
      const resolution = this.resolveConflict(
        doc.id,
        level,
        existing.currentLevel,
        source,
        existing.updatedBy,
        factSource
      );

      if (resolution === 'ignore') {
        this.emit('annotationIgnored', { docId: doc.id, level, existingLevel: existing.currentLevel });
        return doc; // 保持原样
      }

      if (resolution === 'keep_both') {
        this.emit('conflictKeptBoth', { docId: doc.id, level, existingLevel: existing.currentLevel });
        // 不覆盖，但标记冲突
        existing.conflictDetected = true;
        existing.conflictReason = `New ${level} from ${source} conflicts with existing ${existing.currentLevel}`;
        existing.resolutionStrategy = 'keep_both';
        return doc;
      }
    }

    // 构建置信度链条目
    const chainEntry: ConfidenceChainEntry = {
      level,
      source,
      factSource,
      updatedAt: now,
      previousLevel: existing?.currentLevel,
      reason,
    };

    // 更新或创建元数据
    const chain = existing?.chain
      ? [...existing.chain, chainEntry]
      : [chainEntry];

    const metadata: ConfidenceMetadata = {
      currentLevel: level,
      updatedAt: now,
      updatedBy: source,
      chain,
      conflictDetected: false,
      resolutionStrategy: existing?.conflictDetected ? 'replace' : undefined,
    };

    this.annotations.set(doc.id, metadata);

    // 更新文档
    const annotated: MemoryDocument = {
      ...doc,
      confidence: level,
      confidenceUpdated: now,
      confidenceChain: chain,
      factSource,
    };

    this.emit('annotationUpdated', { docId: doc.id, level, source });
    return annotated;
  }

  /**
   * 获取文档的置信度元数据
   */
  getMetadata(docId: string): ConfidenceMetadata | undefined {
    return this.annotations.get(docId);
  }

  /**
   * 获取文档的当前置信度
   */
  getConfidence(docId: string): ConfidenceLevel {
    return this.annotations.get(docId)?.currentLevel || 'UNCERTAIN';
  }

  /**
   * 批量标注——给一组文档统一设置置信度
   */
  annotateBatch(
    docs: MemoryDocument[],
    level: ConfidenceLevel,
    source: string,
    reason?: string
  ): MemoryDocument[] {
    return docs.map(doc =>
      this.annotate(
        doc,
        level,
        source,
        reason || `batch annotation by ${source}`,
        reason
      )
    );
  }

  /**
   * 获取统计数据
   */
  getStats(): ConfidenceStats {
    let confirmed = 0;
    let likely = 0;
    let uncertain = 0;

    for (const meta of this.annotations.values()) {
      switch (meta.currentLevel) {
        case 'CONFIRMED': confirmed++; break;
        case 'LIKELY': likely++; break;
        case 'UNCERTAIN': uncertain++; break;
      }
    }

    return {
      totalAnnotated: this.annotations.size,
      confirmedCount: confirmed,
      likelyCount: likely,
      uncertainCount: uncertain,
      conflictCount: this.conflicts.length,
      resolvedConflictCount: this.conflicts.filter(c => c.resolved).length,
    };
  }

  /**
   * 获取冲突列表
   */
  getConflicts(): ConflictRecord[] {
    return [...this.conflicts];
  }

  /**
   * 手动解决冲突
   */
  resolveConflictManually(conflictId: string, strategy: 'replace' | 'keep_both' | 'ignore'): boolean {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    conflict.resolved = true;
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolutionStrategy = strategy;

    this.emit('conflictResolved', { conflictId, strategy });
    return true;
  }

  /**
   * 清除某个文档的标注
   */
  remove(docId: string): void {
    this.annotations.delete(docId);
    this.conflicts = this.conflicts.filter(c => c.docId !== docId);
    this.emit('annotationRemoved', { docId });
  }

  /**
   * 清除所有标注
   */
  clear(): void {
    this.annotations.clear();
    this.conflicts = [];
    this.emit('allCleared', {});
  }

  // ============================================================
  // 冲突处理协议（基于 CONFIDENCE_PROPAGATION.md）
  // ============================================================

  /**
   * 冲突检测与自动解决
   *
   * CASE 1: 新信息置信度 > 已有置信度 → 替换
   * CASE 2: 新信息置信度 == 已有置信度 → 冲突标记，需要用户确认
   * CASE 3: 新信息置信度 < 已有置信度 → 忽略新信息
   */
  private resolveConflict(
    docId: string,
    newLevel: ConfidenceLevel,
    existingLevel: ConfidenceLevel,
    newSource: string,
    existingSource: string,
    factSource: string
  ): 'replace' | 'keep_both' | 'ignore' {
    const levelRank: Record<ConfidenceLevel, number> = {
      CONFIRMED: 3,
      LIKELY: 2,
      UNCERTAIN: 1,
    };

    const newRank = levelRank[newLevel];
    const existingRank = levelRank[existingLevel];

    let strategy: 'replace' | 'keep_both' | 'ignore';
    let reason: string;

    if (newRank > existingRank) {
      strategy = 'replace';
      reason = `CASE 1: ${newLevel}(${newRank}) > ${existingLevel}(${existingRank})`;
    } else if (newRank === existingRank) {
      strategy = 'keep_both';
      reason = `CASE 2: ${newLevel} == ${existingLevel}, both kept with conflict flag`;
    } else {
      strategy = 'ignore';
      reason = `CASE 3: ${newLevel}(${newRank}) < ${existingLevel}(${existingRank}), ignoring new`;
    }

    // 记录冲突
    const conflict: ConflictRecord = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      docId,
      newLevel,
      existingLevel,
      newSource,
      existingSource,
      resolutionStrategy: strategy,
      resolved: strategy !== 'keep_both',
      createdAt: new Date().toISOString(),
      resolvedAt: strategy !== 'keep_both' ? new Date().toISOString() : undefined,
    };

    this.conflicts.push(conflict);
    if (this.conflicts.length > this.maxConflicts) {
      this.conflicts.shift();
    }

    this.emit('conflictDetected', { docId, newLevel, existingLevel, strategy, reason });
    return strategy;
  }
}

// 导出单例
export const confidenceEngine = new ConfidenceEngine();
