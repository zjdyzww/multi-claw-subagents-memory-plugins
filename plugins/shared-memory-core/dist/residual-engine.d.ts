/**
 * Residual Engine — 残差趋零三层清理引擎
 *
 * R = Σ(residual_size × age_weight)
 * Layer 1 (24h): 主动消解 ≥70% | Layer 2 (7d): 被动降级 ≥90% | Layer 3 (30d): 强制清理 100%
 */
import { EventEmitter } from 'eventemitter3';
import type { FactPoint, ResidualInfo, CleanupRecord } from './types.js';
interface ResidualEntry {
    fact: FactPoint;
    createdAt: string;
    lastCheckAt: string;
    resolutionAttempts: number;
    currentLayer: 1 | 2 | 3;
}
interface ResidualStats {
    totalResiduals: number;
    layer1Count: number;
    layer2Count: number;
    layer3Count: number;
    totalScore: number;
    cleanupRecords: CleanupRecord[];
    lastCleanupAt: string;
}
export declare class ResidualEngine extends EventEmitter {
    private queue;
    private cleanupHistory;
    private timer;
    private checkIntervalMs;
    private readonly LAYER1_MS;
    private readonly LAYER2_MS;
    private readonly LAYER3_MS;
    constructor(checkIntervalMs?: number);
    /**
     * 启动定时清理
     */
    start(): void;
    /**
     * 停止定时清理
     */
    stop(): void;
    /**
     * 计算残差总值 R = Σ(residual_size × age_weight)
     */
    calculateResidualScore(): number;
    /**
     * 获取残差信息快照
     */
    getResidualInfo(): ResidualInfo;
    /**
     * 获取统计信息
     */
    getStats(): ResidualStats;
    /**
     * 向残差队列添加一个事实点
     */
    enqueue(fact: FactPoint): void;
    /**
     * 将一个事实点从残差队列中移除（已消解）
     */
    resolve(factId: string, resolutionType: 'active' | 'passive' | 'forced'): CleanupRecord;
    /**
     * 获取队列内容（只读）
     */
    getQueue(): ResidualEntry[];
    /**
     * 周期检查——驱动三层清理
     */
    private periodicCheck;
    /**
     * Layer 1（24h）：主动消解
     * 策略：从残差队列取出24h内的条目，尝试通过增加 resolutionAttempts 标记
     * 对已标记3次以上仍未消解的条目，降级到 Layer 2
     */
    private cleanupLayer1;
    /**
     * Layer 2（7d）：被动降级
     * 对超过7天且标记3次以上的条目降级到 Layer 3
     */
    private demoteToLayer2;
    /**
     * Layer 3（30d）：强制清理
     * 对所有超过30天的条目强制执行清除
     */
    private cleanupLayer3;
    /**
     * 计算年龄权重
     * Layer 1: weight = 1.0 + (age/24h) * 0.5, max 3.0
     * Layer 2: weight = 0.5 + (age/7d) * 0.3, max 1.5
     * Layer 3: weight = max 1.0
     */
    private computeAgeWeight;
    /**
     * 持久化残差队列到 JSON（可由调用者存储到文件）
     */
    serialize(): string;
    /**
     * 从 JSON 恢复残差队列
     */
    deserialize(json: string): void;
}
export declare const residualEngine: ResidualEngine;
export {};
//# sourceMappingURL=residual-engine.d.ts.map