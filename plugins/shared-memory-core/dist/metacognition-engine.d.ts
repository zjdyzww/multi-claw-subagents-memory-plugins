/**
 * Metacognition Engine — 记忆质量自我评估与修正引擎
 *
 * 评估维度：完整性 / 时效性 / 一致性 / 置信度分布
 * 输出质量评分 + 改进建议
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument } from './types.js';
interface QualityScore {
    overall: number;
    completeness: number;
    freshness: number;
    consistency: number;
    confidenceBalance: number;
}
interface QualityReport {
    documentId: string;
    title: string;
    scores: QualityScore;
    issues: QualityIssue[];
    recommendations: string[];
    assessedAt: string;
}
interface QualityIssue {
    type: 'missing_content' | 'stale' | 'inconsistent' | 'low_confidence' | 'no_tags';
    severity: 'high' | 'medium' | 'low';
    description: string;
}
interface MetacognitionStats {
    totalAssessed: number;
    averageScore: number;
    highQualityCount: number;
    needsAttentionCount: number;
    topIssues: Array<{
        type: string;
        count: number;
    }>;
}
export declare class MetacognitionEngine extends EventEmitter {
    private reports;
    private readonly STALE_THRESHOLD_DAYS;
    private readonly MIN_CONTENT_LENGTH;
    private readonly MIN_TAGS;
    /**
     * 评估单个文档的记忆质量
     */
    assess(document: MemoryDocument): QualityReport;
    /**
     * 批量评估
     */
    assessBatch(documents: MemoryDocument[]): QualityReport[];
    /**
     * 获取评估报告
     */
    getReport(docId: string): QualityReport | undefined;
    /**
     * 获取统计
     */
    getStats(): MetacognitionStats;
    private scoreCompleteness;
    private scoreFreshness;
    private scoreConsistency;
    private scoreConfidenceBalance;
}
export declare const metacognitionEngine: MetacognitionEngine;
export {};
//# sourceMappingURL=metacognition-engine.d.ts.map