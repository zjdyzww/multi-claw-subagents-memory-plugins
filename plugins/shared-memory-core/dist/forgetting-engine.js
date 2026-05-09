/**
 * Forgetting Engine — 艾宾浩斯遗忘曲线自适应衰减引擎
 *
 * R = e^(-t/S)  其中 S = relative_strength
 * 不同记忆类型有不同衰减速率
 */
import { EventEmitter } from 'eventemitter3';
export class ForgettingEngine extends EventEmitter {
    states = new Map();
    forgottenIds = new Set();
    timer = null;
    // 艾宾浩斯曲线 — 不同记忆类型的相对强度 S
    STRENGTH = {
        'fact': 7, // 事实：7 天衰减到 ~37%
        'decision': 14, // 决策：14 天衰减到 ~37%
        'context': 3, // 上下文：3 天快速衰减
        'assumption': 5, // 假设：5 天
        'preference': 30, // 偏好：30 天缓慢衰减
    };
    // 遗忘阈值（低于此值视为遗忘）
    FORGOTTEN_THRESHOLD = 0.1;
    constructor() {
        super();
    }
    /**
     * 注册一个文档（跟踪其记忆保持曲线）
     */
    register(doc, initialStrength = 1.0) {
        if (this.forgottenIds.has(doc.id)) {
            this.forgottenIds.delete(doc.id);
        }
        const existing = this.states.get(doc.id);
        if (existing) {
            existing.accessCount++;
            existing.lastAccessAt = new Date().toISOString();
            this.boostRetention(existing);
            return;
        }
        const memoryType = doc.memoryType || 'fact';
        const state = {
            docId: doc.id,
            memoryType,
            initialStrength,
            currentRetention: initialStrength,
            lastAccessAt: new Date().toISOString(),
            accessCount: 1,
            createdAt: doc.createdAt || new Date().toISOString(),
            decayRate: this.getDecayRate(memoryType),
        };
        this.states.set(doc.id, state);
        this.emit('memoryRegistered', { docId: doc.id, memoryType });
    }
    /**
     * 获取文档当前的记忆保持率
     * 基于艾宾浩斯曲线: R = e^(-t/S)
     */
    getRetention(docId) {
        const state = this.states.get(docId);
        if (!state)
            return 0;
        const now = Date.now();
        const lastAccess = new Date(state.lastAccessAt).getTime();
        const daysSinceAccess = (now - lastAccess) / (1000 * 60 * 60 * 24);
        // 艾宾浩斯遗忘曲线
        const retention = state.initialStrength * Math.exp(-daysSinceAccess / state.decayRate);
        // 绑定到 [0, 1]
        return Math.max(0, Math.min(1, retention));
    }
    /**
     * 获取所有记忆的状态
     */
    getAllStates() {
        return Array.from(this.states.values()).map(s => ({
            ...s,
            currentRetention: this.getRetention(s.docId),
        }));
    }
    /**
     * 获取统计
     */
    getStats() {
        const states = this.getAllStates();
        const avgRetention = states.length > 0
            ? states.reduce((sum, s) => sum + s.currentRetention, 0) / states.length
            : 0;
        const byType = {};
        for (const s of states) {
            if (!byType[s.memoryType]) {
                byType[s.memoryType] = { count: 0, avgRetention: 0 };
            }
            byType[s.memoryType].count++;
            byType[s.memoryType].avgRetention += s.currentRetention;
        }
        for (const type of Object.keys(byType)) {
            byType[type].avgRetention = Math.round(byType[type].avgRetention / byType[type].count * 100) / 100;
        }
        return {
            totalTracked: states.length,
            averageRetention: Math.round(avgRetention * 100) / 100,
            byType,
            forgottenCount: this.forgottenIds.size,
            lastCheckAt: new Date().toISOString(),
        };
    }
    /**
     * 启动周期检查（定时扫描遗忘的记忆）
     */
    start(intervalMs = 60 * 60 * 1000) {
        if (this.timer)
            return;
        this.timer = setInterval(() => this.periodicCheck(), intervalMs);
        this.emit('engineStarted', {});
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.emit('engineStopped', {});
    }
    /**
     * 移除一个文档的追踪
     */
    remove(docId) {
        this.states.delete(docId);
        this.forgottenIds.delete(docId);
    }
    // ============================================================
    // 内部
    // ============================================================
    /**
     * 访问时提升保持率（间隔效应 - spacing effect）
     */
    boostRetention(state) {
        // 每次访问提升 10%，最多恢复到 initialStrength
        state.currentRetention = Math.min(state.initialStrength, this.getRetention(state.docId) + 0.1 * state.accessCount);
        this.emit('retentionBoosted', {
            docId: state.docId,
            retention: state.currentRetention,
            accessCount: state.accessCount,
        });
    }
    /**
     * 获取衰减速率（天数）
     * S 越大 = 衰减越慢 = 记忆越持久
     */
    getDecayRate(type) {
        return this.STRENGTH[type] || 7;
    }
    /**
     * 周期检查：标记已遗忘的记忆
     */
    periodicCheck() {
        let newlyForgotten = 0;
        for (const [id] of this.states) {
            const retention = this.getRetention(id);
            if (retention < this.FORGOTTEN_THRESHOLD) {
                if (!this.forgottenIds.has(id)) {
                    this.forgottenIds.add(id);
                    newlyForgotten++;
                }
            }
        }
        if (newlyForgotten > 0) {
            this.emit('memoryForgotten', { count: newlyForgotten });
        }
    }
}
export const forgettingEngine = new ForgettingEngine();
//# sourceMappingURL=forgetting-engine.js.map