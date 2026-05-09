/**
 * Forgetting Engine — 艾宾浩斯遗忘曲线自适应衰减引擎
 *
 * R = e^(-t/S)  其中 S = relative_strength
 * 不同记忆类型有不同衰减速率
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryType, MemoryDocument } from './types.js';
interface ForgettingState {
    docId: string;
    memoryType: MemoryType;
    initialStrength: number;
    currentRetention: number;
    lastAccessAt: string;
    accessCount: number;
    createdAt: string;
    decayRate: number;
}
interface ForgettingStats {
    totalTracked: number;
    averageRetention: number;
    byType: Record<string, {
        count: number;
        avgRetention: number;
    }>;
    forgottenCount: number;
    lastCheckAt: string;
}
export declare class ForgettingEngine extends EventEmitter {
    private states;
    private forgottenIds;
    private timer;
    private readonly STRENGTH;
    private readonly FORGOTTEN_THRESHOLD;
    constructor();
    /**
     * 注册一个文档（跟踪其记忆保持曲线）
     */
    register(doc: MemoryDocument, initialStrength?: number): void;
    /**
     * 获取文档当前的记忆保持率
     * 基于艾宾浩斯曲线: R = e^(-t/S)
     */
    getRetention(docId: string): number;
    /**
     * 获取所有记忆的状态
     */
    getAllStates(): ForgettingState[];
    /**
     * 获取统计
     */
    getStats(): ForgettingStats;
    /**
     * 启动周期检查（定时扫描遗忘的记忆）
     */
    start(intervalMs?: number): void;
    stop(): void;
    /**
     * 移除一个文档的追踪
     */
    remove(docId: string): void;
    /**
     * 访问时提升保持率（间隔效应 - spacing effect）
     */
    private boostRetention;
    /**
     * 获取衰减速率（天数）
     * S 越大 = 衰减越慢 = 记忆越持久
     */
    private getDecayRate;
    /**
     * 周期检查：标记已遗忘的记忆
     */
    private periodicCheck;
}
export declare const forgettingEngine: ForgettingEngine;
export {};
//# sourceMappingURL=forgetting-engine.d.ts.map