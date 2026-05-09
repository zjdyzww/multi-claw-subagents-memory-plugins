/**
 * Sleep Engine — 空闲时段自动后台整理引擎
 *
 * 在系统空闲时执行：记忆巩固、索引优化、残差处理
 * 由空闲计时器驱动
 */
import { EventEmitter } from 'eventemitter3';
import { IndexEngine } from './indexer.js';
import { ResidualEngine } from './residual-engine.js';
import { ForgettingEngine } from './forgetting-engine.js';
interface SleepTask {
    id: string;
    name: string;
    schedule: 'hourly' | 'daily' | 'weekly';
    enabled: boolean;
    lastRunAt?: string;
    runCount: number;
    avgDurationMs: number;
}
interface SleepStats {
    isSleeping: boolean;
    idleTimeMs: number;
    tasksCompleted: number;
    tasksFailed: number;
    lastWakeAt: string;
    tasks: SleepTask[];
}
export declare class SleepEngine extends EventEmitter {
    private tasks;
    private isSleeping;
    private idleTimer;
    private idleThreshold;
    private lastActivity;
    private tasksCompleted;
    private tasksFailed;
    private indexEngine?;
    private residualEngine?;
    private forgettingEngine?;
    constructor();
    /**
     * 绑定依赖引擎
     */
    bindEngines(indexEngine: IndexEngine, residualEngine?: ResidualEngine, forgettingEngine?: ForgettingEngine): void;
    /**
     * 标记活动（重置空闲计时器）
     */
    activity(): void;
    /**
     * 进入睡眠模式（执行后台任务）
     */
    sleep(): Promise<void>;
    /**
     * 唤醒（停止后台任务）
     */
    wake(): void;
    /**
     * 启动空闲监控
     */
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    getStats(): SleepStats;
    /**
     * 启用/禁用指定任务
     */
    setTaskEnabled(taskId: string, enabled: boolean): void;
    private registerDefaultTasks;
    private shouldRunTask;
    private executeTask;
}
export declare const sleepEngine: SleepEngine;
export {};
//# sourceMappingURL=sleep-engine.d.ts.map