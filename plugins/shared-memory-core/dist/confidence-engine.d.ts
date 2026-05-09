/**
 * Confidence Engine — 置信度传播引擎
 *
 * 🟢 CONFIRMED / 🟡 LIKELY / 🔴 UNCERTAIN 三级标注
 * 置信度链存储与更新、冲突检测与处理协议、traceabilityId 溯源关联
 * 基于 CONFIDENCE_PROPAGATION.md 中定义的规则
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument, ConfidenceLevel, ConfidenceMetadata } from './types.js';
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
export declare class ConfidenceEngine extends EventEmitter {
    private annotations;
    private conflicts;
    private maxConflicts;
    /**
     * 标注文档置信度
     */
    annotate(doc: MemoryDocument, level: ConfidenceLevel, source: string, factSource: string, reason?: string): MemoryDocument;
    /**
     * 获取文档的置信度元数据
     */
    getMetadata(docId: string): ConfidenceMetadata | undefined;
    /**
     * 获取文档的当前置信度
     */
    getConfidence(docId: string): ConfidenceLevel;
    /**
     * 批量标注——给一组文档统一设置置信度
     */
    annotateBatch(docs: MemoryDocument[], level: ConfidenceLevel, source: string, reason?: string): MemoryDocument[];
    /**
     * 获取统计数据
     */
    getStats(): ConfidenceStats;
    /**
     * 获取冲突列表
     */
    getConflicts(): ConflictRecord[];
    /**
     * 手动解决冲突
     */
    resolveConflictManually(conflictId: string, strategy: 'replace' | 'keep_both' | 'ignore'): boolean;
    /**
     * 清除某个文档的标注
     */
    remove(docId: string): void;
    /**
     * 清除所有标注
     */
    clear(): void;
    /**
     * 冲突检测与自动解决
     *
     * CASE 1: 新信息置信度 > 已有置信度 → 替换
     * CASE 2: 新信息置信度 == 已有置信度 → 冲突标记，需要用户确认
     * CASE 3: 新信息置信度 < 已有置信度 → 忽略新信息
     */
    private resolveConflict;
}
export declare const confidenceEngine: ConfidenceEngine;
export {};
//# sourceMappingURL=confidence-engine.d.ts.map