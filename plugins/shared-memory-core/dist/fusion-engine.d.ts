/**
 * Fusion Engine — 多源记忆融合去重引擎
 *
 * 接受多个 MemoryDocument / MemoryRepresentation，
 * 基于 Jaccard 相似度合并去重，输出统一结果。
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument, MemoryRepresentation, FactPoint, ConfidenceLevel } from './types.js';
interface FusionCandidate {
    source: MemoryDocument | MemoryRepresentation;
    sourceId: string;
    facts: FactPoint[];
    confidence: ConfidenceLevel;
}
interface FusionResult {
    mergedDocument: Partial<MemoryDocument>;
    facts: FactPoint[];
    confidence: ConfidenceLevel;
    duplicateCount: number;
    mergedFrom: string[];
    mergeDecisions: MergeDecision[];
}
interface MergeDecision {
    factId: string;
    sourceA: string;
    sourceB: string;
    decision: 'keep_a' | 'keep_b' | 'merge' | 'discard';
    reason: string;
    similarity: number;
}
export declare class FusionEngine extends EventEmitter {
    private SIMILARITY_THRESHOLD;
    private MERGE_THRESHOLD;
    /**
     * 融合多个记忆文档（核心入口）
     */
    fuse(candidates: FusionCandidate[], options?: {
        similarityThreshold?: number;
        mergeThreshold?: number;
    }): FusionResult;
    /**
     * 快速融合两个文档
     */
    fusionPair(a: MemoryDocument, b: MemoryDocument): FusionResult;
    /**
     * 获取相似度阈值配置
     */
    getThreshold(): number;
    setThreshold(v: number): void;
    /**
     * Jaccard 相似度去重
     * similarity > mergeThreshold → 合并
     * similarity > threshold → 保留最高置信度
     * similarity ≤ threshold → 两个都保留
     */
    private deduplicate;
    /**
     * Jaccard 相似度（基于字符双字母组）
     */
    private jaccardSimilarity;
    private higherConfidence;
    private resolveConsensusConfidence;
}
export declare const fusionEngine: FusionEngine;
export {};
//# sourceMappingURL=fusion-engine.d.ts.map