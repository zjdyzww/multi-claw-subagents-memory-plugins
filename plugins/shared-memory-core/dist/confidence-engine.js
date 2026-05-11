/**
 * Confidence Engine — 置信度传播引擎
 *
 * 🟢 CONFIRMED / 🟡 LIKELY / 🔴 UNCERTAIN 三级标注
 * 置信度链存储与更新、冲突检测与处理协议、traceabilityId 溯源关联
 * 基于论文第3.4节 置信度传播机制
 */
import { EventEmitter } from 'eventemitter3';
export class ConfidenceEngine extends EventEmitter {
    annotations = new Map();
    conflicts = [];
    maxConflicts = 200;
    maxChainLength = 50;
    /**
     * 标注文档置信度
     */
    annotate(doc, level, source, factSource, reason) {
        const existing = this.annotations.get(doc.id);
        const now = new Date().toISOString();
        // 检测冲突：有已存在的标注且来源不同
        if (existing && existing.updatedBy !== source) {
            const resolution = this.resolveConflict(doc.id, level, existing.currentLevel, source, existing.updatedBy, factSource);
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
        const chainEntry = {
            level,
            source,
            factSource,
            updatedAt: now,
            previousLevel: existing?.currentLevel,
            reason,
        };
        // 更新或创建元数据（限制链长度，防止无限增长）
        const existingChain = existing?.chain || [];
        const trimmedChain = existingChain.length >= this.maxChainLength
            ? existingChain.slice(existingChain.length - this.maxChainLength + 1)
            : existingChain;
        const chain = [...trimmedChain, chainEntry];
        const metadata = {
            currentLevel: level,
            updatedAt: now,
            updatedBy: source,
            chain,
            conflictDetected: false,
            resolutionStrategy: existing?.conflictDetected ? 'replace' : undefined,
        };
        this.annotations.set(doc.id, metadata);
        // 更新文档
        const annotated = {
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
    getMetadata(docId) {
        return this.annotations.get(docId);
    }
    /**
     * 获取文档的当前置信度
     */
    getConfidence(docId) {
        return this.annotations.get(docId)?.currentLevel || 'UNCERTAIN';
    }
    /**
     * 批量标注——给一组文档统一设置置信度
     */
    annotateBatch(docs, level, source, reason) {
        return docs.map(doc => this.annotate(doc, level, source, reason || `batch annotation by ${source}`, reason));
    }
    /**
     * 获取统计数据
     */
    getStats() {
        let confirmed = 0;
        let likely = 0;
        let uncertain = 0;
        for (const meta of this.annotations.values()) {
            switch (meta.currentLevel) {
                case 'CONFIRMED':
                    confirmed++;
                    break;
                case 'LIKELY':
                    likely++;
                    break;
                case 'UNCERTAIN':
                    uncertain++;
                    break;
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
    getConflicts() {
        return [...this.conflicts];
    }
    /**
     * 手动解决冲突
     */
    resolveConflictManually(conflictId, strategy) {
        const conflict = this.conflicts.find(c => c.id === conflictId);
        if (!conflict)
            return false;
        conflict.resolved = true;
        conflict.resolvedAt = new Date().toISOString();
        conflict.resolutionStrategy = strategy;
        this.emit('conflictResolved', { conflictId, strategy });
        return true;
    }
    /**
     * 清除某个文档的标注
     */
    remove(docId) {
        this.annotations.delete(docId);
        this.conflicts = this.conflicts.filter(c => c.docId !== docId);
        this.emit('annotationRemoved', { docId });
    }
    /**
     * 清除所有标注
     */
    clear() {
        this.annotations.clear();
        this.conflicts = [];
        this.emit('allCleared', {});
    }
    // ============================================================
    // 冲突处理协议（CASE 1/2/3 三态自动决策）
    // ============================================================
    /**
     * 冲突检测与自动解决
     *
     * CASE 1: 新信息置信度 > 已有置信度 → 替换
     * CASE 2: 新信息置信度 == 已有置信度 → 冲突标记，需要用户确认
     * CASE 3: 新信息置信度 < 已有置信度 → 忽略新信息
     */
    resolveConflict(docId, newLevel, existingLevel, newSource, existingSource, factSource) {
        const levelRank = {
            CONFIRMED: 3,
            LIKELY: 2,
            UNCERTAIN: 1,
        };
        const newRank = levelRank[newLevel];
        const existingRank = levelRank[existingLevel];
        let strategy;
        let reason;
        if (newRank > existingRank) {
            strategy = 'replace';
            reason = `CASE 1: ${newLevel}(${newRank}) > ${existingLevel}(${existingRank})`;
        }
        else if (newRank === existingRank) {
            strategy = 'keep_both';
            reason = `CASE 2: ${newLevel} == ${existingLevel}, both kept with conflict flag`;
        }
        else {
            strategy = 'ignore';
            reason = `CASE 3: ${newLevel}(${newRank}) < ${existingLevel}(${existingRank}), ignoring new`;
        }
        // 记录冲突
        const conflict = {
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
//# sourceMappingURL=confidence-engine.js.map