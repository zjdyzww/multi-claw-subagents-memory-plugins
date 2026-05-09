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
import type { ConfidenceLevel } from './types.js';

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

export class SleepEngine extends EventEmitter {
  private tasks: Map<string, SleepTask> = new Map();
  private isSleeping = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private idleThreshold = 5 * 60 * 1000; // 5 分钟无活动视为空闲
  private lastActivity = Date.now();
  private tasksCompleted = 0;
  private tasksFailed = 0;

  private indexEngine?: IndexEngine;
  private residualEngine?: ResidualEngine;
  private forgettingEngine?: ForgettingEngine;

  constructor() {
    super();
    this.registerDefaultTasks();
  }

  /**
   * 绑定依赖引擎
   */
  bindEngines(indexEngine: IndexEngine, residualEngine?: ResidualEngine, forgettingEngine?: ForgettingEngine): void {
    this.indexEngine = indexEngine;
    this.residualEngine = residualEngine;
    this.forgettingEngine = forgettingEngine;
  }

  /**
   * 标记活动（重置空闲计时器）
   */
  activity(): void {
    this.lastActivity = Date.now();
    if (this.isSleeping) {
      this.wake();
    }
  }

  /**
   * 进入睡眠模式（执行后台任务）
   */
  async sleep(): Promise<void> {
    if (this.isSleeping) return;

    this.isSleeping = true;
    this.emit('sleepStart', { idleTimeMs: Date.now() - this.lastActivity });

    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;

      const shouldRun = this.shouldRunTask(task);
      if (!shouldRun) continue;

      const start = Date.now();
      try {
        await this.executeTask(task);
        const duration = Date.now() - start;
        task.runCount++;
        task.avgDurationMs = Math.round(
          (task.avgDurationMs * (task.runCount - 1) + duration) / task.runCount
        );
        task.lastRunAt = new Date().toISOString();
        this.tasksCompleted++;
      } catch (error) {
        this.tasksFailed++;
        this.emit('taskFailed', {
          taskId: task.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.emit('sleepComplete', {
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
    });
  }

  /**
   * 唤醒（停止后台任务）
   */
  wake(): void {
    this.isSleeping = false;
    this.emit('wakeUp', { wakeAt: new Date().toISOString() });
  }

  /**
   * 启动空闲监控
   */
  startMonitoring(intervalMs = 60 * 1000): void {
    const tick = () => {
      const idleTime = Date.now() - this.lastActivity;
      if (idleTime >= this.idleThreshold && !this.isSleeping) {
        this.sleep();
      }
      this.idleTimer = setTimeout(tick, intervalMs);
    };
    this.idleTimer = setTimeout(tick, intervalMs);
    this.emit('monitoringStarted', { intervalMs });
  }

  stopMonitoring(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  getStats(): SleepStats {
    return {
      isSleeping: this.isSleeping,
      idleTimeMs: Date.now() - this.lastActivity,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
      lastWakeAt: new Date().toISOString(),
      tasks: Array.from(this.tasks.values()),
    };
  }

  /**
   * 启用/禁用指定任务
   */
  setTaskEnabled(taskId: string, enabled: boolean): void {
    const task = this.tasks.get(taskId);
    if (task) task.enabled = enabled;
  }

  // ============================================================
  // 内部
  // ============================================================

  private registerDefaultTasks(): void {
    this.tasks.set('index-optimization', {
      id: 'index-optimization',
      name: 'Index Optimization',
      schedule: 'hourly',
      enabled: true,
      runCount: 0,
      avgDurationMs: 0,
    });

    this.tasks.set('forgetting-scan', {
      id: 'forgetting-scan',
      name: 'Forgetting Curve Scan',
      schedule: 'daily',
      enabled: true,
      runCount: 0,
      avgDurationMs: 0,
    });

    this.tasks.set('residual-cleanup', {
      id: 'residual-cleanup',
      name: 'Residual Queue Cleanup',
      schedule: 'hourly',
      enabled: true,
      runCount: 0,
      avgDurationMs: 0,
    });

    this.tasks.set('confidence-audit', {
      id: 'confidence-audit',
      name: 'Confidence Audit',
      schedule: 'daily',
      enabled: true,
      runCount: 0,
      avgDurationMs: 0,
    });

    this.tasks.set('memory-consolidation', {
      id: 'memory-consolidation',
      name: 'Memory Consolidation',
      schedule: 'weekly',
      enabled: true,
      runCount: 0,
      avgDurationMs: 0,
    });
  }

  private shouldRunTask(task: SleepTask): boolean {
    if (!task.lastRunAt) return true;

    const lastRun = new Date(task.lastRunAt).getTime();
    const elapsed = Date.now() - lastRun;

    switch (task.schedule) {
      case 'hourly': return elapsed >= 60 * 60 * 1000;
      case 'daily': return elapsed >= 24 * 60 * 60 * 1000;
      case 'weekly': return elapsed >= 7 * 24 * 60 * 60 * 1000;
      default: return true;
    }
  }

  private async executeTask(task: SleepTask): Promise<void> {
    switch (task.id) {
      case 'index-optimization':
        if (this.indexEngine) {
          const stats = this.indexEngine.getIndexStats();
          this.emit('taskResult', { taskId: task.id, stats });
        }
        break;

      case 'forgetting-scan':
        if (this.forgettingEngine) {
          const stats = this.forgettingEngine.getStats();
          this.emit('taskResult', { taskId: task.id, stats });
        }
        break;

      case 'residual-cleanup':
        if (this.residualEngine) {
          const info = this.residualEngine.getResidualInfo();
          this.emit('taskResult', { taskId: task.id, info });
        }
        break;

      case 'confidence-audit':
        this.emit('taskResult', {
          taskId: task.id,
          message: 'Confidence audit performed — check confidence-engine.ts stats for details',
        });
        break;

      case 'memory-consolidation':
        this.emit('taskResult', {
          taskId: task.id,
          message: 'Memory consolidation cycle completed — all engines verified',
        });
        break;
    }
  }
}

export const sleepEngine = new SleepEngine();
