/**
 * Residual Engine — 残差趋零三层清理引擎
 *
 * R = Σ(residual_size × age_weight)
 * Layer 1 (24h): 主动消解 ≥70% | Layer 2 (7d): 被动降级 ≥90% | Layer 3 (30d): 强制清理 100%
 */
import { EventEmitter } from 'eventemitter3';
export class ResidualEngine extends EventEmitter {
    queue = [];
    cleanupHistory = [];
    timer = null;
    checkIntervalMs;
    // 三层时间阈值
    LAYER1_MS = 24 * 60 * 60 * 1000; // 24h
    LAYER2_MS = 7 * 24 * 60 * 60 * 1000; // 7d
    LAYER3_MS = 30 * 24 * 60 * 60 * 1000; // 30d
    constructor(checkIntervalMs = 60 * 60 * 1000) {
        super();
        this.checkIntervalMs = checkIntervalMs;
    }
    /**
     * 启动定时清理
     */
    start() {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.periodicCheck(), this.checkIntervalMs);
        this.emit('engineStarted', { queueSize: this.queue.length });
    }
    /**
     * 停止定时清理
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.emit('engineStopped', { queueSize: this.queue.length });
    }
    /**
     * 计算残差总值 R = Σ(residual_size × age_weight)
     */
    calculateResidualScore() {
        const now = Date.now();
        let totalScore = 0;
        for (const entry of this.queue) {
            const ageMs = now - new Date(entry.createdAt).getTime();
            const ageWeight = this.computeAgeWeight(ageMs, entry.currentLayer);
            const residualSize = entry.fact.content.length;
            totalScore += residualSize * ageWeight;
        }
        return Math.round(totalScore * 100) / 100;
    }
    /**
     * 获取残差信息快照
     */
    getResidualInfo() {
        const score = this.calculateResidualScore();
        const now = new Date().toISOString();
        const avgAgeWeight = this.queue.length > 0
            ? this.queue.reduce((sum, e) => {
                const ageMs = Date.now() - new Date(e.createdAt).getTime();
                return sum + this.computeAgeWeight(ageMs, e.currentLayer);
            }, 0) / this.queue.length
            : 0;
        return {
            size: this.queue.length,
            ageWeight: Math.round(avgAgeWeight * 100) / 100,
            residualScore: score,
            lastCheckAt: now,
            cleanupLayer: score > 1000 ? 1 : score > 500 ? 2 : 3,
            resolutionAttempts: this.queue.reduce((sum, e) => sum + e.resolutionAttempts, 0),
        };
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const layer1 = this.queue.filter(e => e.currentLayer === 1);
        const layer2 = this.queue.filter(e => e.currentLayer === 2);
        const layer3 = this.queue.filter(e => e.currentLayer === 3);
        return {
            totalResiduals: this.queue.length,
            layer1Count: layer1.length,
            layer2Count: layer2.length,
            layer3Count: layer3.length,
            totalScore: this.calculateResidualScore(),
            cleanupRecords: [...this.cleanupHistory],
            lastCleanupAt: this.cleanupHistory.length > 0
                ? this.cleanupHistory[this.cleanupHistory.length - 1].resolvedAt
                : 'never',
        };
    }
    /**
     * 向残差队列添加一个事实点
     */
    enqueue(fact) {
        if (this.queue.find(e => e.fact.id === fact.id))
            return;
        const entry = {
            fact,
            createdAt: new Date().toISOString(),
            lastCheckAt: new Date().toISOString(),
            resolutionAttempts: 0,
            currentLayer: 1,
        };
        this.queue.push(entry);
        this.emit('residualEnqueued', { factId: fact.id, queueSize: this.queue.length });
    }
    /**
     * 将一个事实点从残差队列中移除（已消解）
     */
    resolve(factId, resolutionType) {
        const index = this.queue.findIndex(e => e.fact.id === factId);
        if (index < 0) {
            throw new Error(`Fact ${factId} not found in residual queue`);
        }
        const entry = this.queue[index];
        this.queue.splice(index, 1);
        const record = {
            factId,
            resolvedAt: new Date().toISOString(),
            resolutionType,
            fromLayer: entry.currentLayer,
            success: true,
            note: `${resolutionType} resolution after ${entry.resolutionAttempts} attempts`,
        };
        this.cleanupHistory.push(record);
        this.emit('residualResolved', record);
        return record;
    }
    /**
     * 获取队列内容（只读）
     */
    getQueue() {
        return [...this.queue];
    }
    /**
     * 周期检查——驱动三层清理
     */
    periodicCheck() {
        const beforeSize = this.queue.length;
        const beforeScore = this.calculateResidualScore();
        // Layer 1: 24h 主动消解
        this.cleanupLayer1();
        // Layer 2: 7d 被动降级
        this.demoteToLayer2();
        // Layer 3: 30d 强制清理
        this.cleanupLayer3();
        const afterSize = this.queue.length;
        const afterScore = this.calculateResidualScore();
        if (beforeSize !== afterSize || beforeScore !== afterScore) {
            this.emit('cleanupCycleComplete', {
                before: { size: beforeSize, score: beforeScore },
                after: { size: afterSize, score: afterScore },
                removed: beforeSize - afterSize,
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Layer 1（24h）：主动消解
     * 策略：从残差队列取出24h内的条目，尝试通过增加 resolutionAttempts 标记
     * 对已标记3次以上仍未消解的条目，降级到 Layer 2
     */
    cleanupLayer1() {
        const now = Date.now();
        const entries = this.queue.filter(e => e.currentLayer === 1);
        for (const entry of entries) {
            const ageMs = now - new Date(entry.createdAt).getTime();
            if (ageMs >= this.LAYER1_MS && ageMs < this.LAYER2_MS) {
                entry.resolutionAttempts++;
                entry.lastCheckAt = new Date().toISOString();
                // 超过3次尝试仍未消解 → 降级到 Layer 2
                if (entry.resolutionAttempts >= 3) {
                    entry.currentLayer = 2;
                    this.emit('residualDemoted', {
                        factId: entry.fact.id,
                        fromLayer: 1,
                        toLayer: 2,
                        attempts: entry.resolutionAttempts,
                    });
                }
            }
        }
        // 统计 Layer 1 消解率
        const layer1Total = this.queue.filter(e => e.currentLayer === 1).length;
        if (layer1Total > 0) {
            const resolvedInL1 = this.cleanupHistory.filter(r => r.fromLayer === 1).length;
            const rate = resolvedInL1 / (resolvedInL1 + layer1Total);
            if (rate < 0.7) {
                this.emit('layer1Warning', { currentRate: rate, target: 0.7 });
            }
        }
    }
    /**
     * Layer 2（7d）：被动降级
     * 对超过7天且标记3次以上的条目降级到 Layer 3
     */
    demoteToLayer2() {
        const now = Date.now();
        for (const entry of this.queue) {
            const ageMs = now - new Date(entry.createdAt).getTime();
            if (ageMs >= this.LAYER2_MS && ageMs < this.LAYER3_MS) {
                if (entry.currentLayer < 3) {
                    const fromLayer = entry.currentLayer;
                    entry.currentLayer = 3;
                    entry.resolutionAttempts++;
                    entry.lastCheckAt = new Date().toISOString();
                    this.emit('residualDemoted', {
                        factId: entry.fact.id,
                        fromLayer,
                        toLayer: 3,
                        attempts: entry.resolutionAttempts,
                    });
                }
            }
        }
    }
    /**
     * Layer 3（30d）：强制清理
     * 对所有超过30天的条目强制执行清除
     */
    cleanupLayer3() {
        const now = Date.now();
        const toRemove = [];
        for (const entry of this.queue) {
            const ageMs = now - new Date(entry.createdAt).getTime();
            if (ageMs >= this.LAYER3_MS) {
                toRemove.push(entry.fact.id);
            }
        }
        for (const factId of toRemove) {
            try {
                this.resolve(factId, 'forced');
            }
            catch {
                // 已在迭代中处理
            }
        }
        if (toRemove.length > 0) {
            this.emit('layer3Cleanup', { removedCount: toRemove.length, factIds: toRemove });
        }
    }
    /**
     * 计算年龄权重
     * Layer 1: weight = 1.0 + (age/24h) * 0.5, max 3.0
     * Layer 2: weight = 0.5 + (age/7d) * 0.3, max 1.5
     * Layer 3: weight = max 1.0
     */
    computeAgeWeight(ageMs, layer) {
        switch (layer) {
            case 1: {
                const days = ageMs / this.LAYER1_MS;
                return Math.min(1.0 + days * 0.5, 3.0);
            }
            case 2: {
                const days = ageMs / this.LAYER2_MS;
                return Math.min(0.5 + days * 0.3, 1.5);
            }
            case 3: {
                return Math.max(0.1, 1.0 - (ageMs / this.LAYER3_MS));
            }
            default:
                return 1.0;
        }
    }
    /**
     * 持久化残差队列到 JSON（可由调用者存储到文件）
     */
    serialize() {
        return JSON.stringify({
            queue: this.queue,
            cleanupHistory: this.cleanupHistory,
            exportedAt: new Date().toISOString(),
        }, null, 2);
    }
    /**
     * 从 JSON 恢复残差队列
     */
    deserialize(json) {
        try {
            const data = JSON.parse(json);
            this.queue = data.queue || [];
            this.cleanupHistory = data.cleanupHistory || [];
            this.emit('queueRestored', { queueSize: this.queue.length });
        }
        catch {
            this.emit('queueRestoreError', { message: 'Failed to parse residual queue JSON' });
        }
    }
}
// 导出单例
export const residualEngine = new ResidualEngine();
//# sourceMappingURL=residual-engine.js.map