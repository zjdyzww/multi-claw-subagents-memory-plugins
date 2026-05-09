/**
 * Fusion Engine — 多源记忆融合去重引擎
 *
 * 接受多个 MemoryDocument / MemoryRepresentation，
 * 基于 Jaccard 相似度合并去重，输出统一结果。
 */
import { EventEmitter } from 'eventemitter3';
export class FusionEngine extends EventEmitter {
    SIMILARITY_THRESHOLD = 0.5;
    MERGE_THRESHOLD = 0.8;
    /**
     * 融合多个记忆文档（核心入口）
     */
    fuse(candidates, options) {
        const threshold = options?.similarityThreshold || this.SIMILARITY_THRESHOLD;
        const mergeThreshold = options?.mergeThreshold || this.MERGE_THRESHOLD;
        const allFacts = [];
        const duplicateCount = 0;
        const mergedFrom = [];
        const mergeDecisions = [];
        // 收集所有事实点
        for (const c of candidates) {
            mergedFrom.push(c.sourceId);
            for (const fact of c.facts) {
                allFacts.push({ ...fact });
            }
            // 也尝试从 rawContent 提取（对 MemoryRepresentation）
            if ('rawContent' in c.source && c.source.rawContent) {
                allFacts.push({
                    id: `${c.sourceId}-raw`,
                    content: c.source.rawContent,
                    confidence: c.confidence,
                    source: c.sourceId,
                    category: 'extracted',
                    verified: false,
                });
            }
        }
        // 去重：基于 Jaccard 相似度
        const dedupedFacts = this.deduplicate(allFacts, threshold, mergeThreshold, mergeDecisions);
        // 确定融合后的置信度
        const confidence = this.resolveConsensusConfidence(candidates);
        // 构建融合后的文档摘要
        const mergedDocument = {
            id: `fusion-${Date.now()}`,
            title: `Fusion of ${candidates.length} sources`,
            content: dedupedFacts.map(f => `${f.confidence === 'CONFIRMED' ? '🟢' : f.confidence === 'LIKELY' ? '🟡' : '🔴'} ${f.content}`).join('\n'),
            tags: Array.from(new Set(candidates.flatMap(c => ('tags' in c.source && c.source.tags) ? c.source.tags : []))),
            confidence,
            accessCount: 0,
        };
        const result = {
            mergedDocument,
            facts: dedupedFacts,
            confidence,
            duplicateCount,
            mergedFrom,
            mergeDecisions,
        };
        this.emit('fusionComplete', {
            sourceCount: candidates.length,
            inputFactCount: allFacts.length,
            outputFactCount: dedupedFacts.length,
            duplicateCount,
        });
        return result;
    }
    /**
     * 快速融合两个文档
     */
    fusionPair(a, b) {
        return this.fuse([
            {
                source: a,
                sourceId: a.id,
                facts: [{
                        id: a.id,
                        content: a.content,
                        confidence: a.confidence || 'UNCERTAIN',
                        source: a.author,
                        category: a.category,
                        verified: false,
                    }],
                confidence: a.confidence || 'UNCERTAIN',
            },
            {
                source: b,
                sourceId: b.id,
                facts: [{
                        id: b.id,
                        content: b.content,
                        confidence: b.confidence || 'UNCERTAIN',
                        source: b.author,
                        category: b.category,
                        verified: false,
                    }],
                confidence: b.confidence || 'UNCERTAIN',
            },
        ]);
    }
    /**
     * 获取相似度阈值配置
     */
    getThreshold() { return this.SIMILARITY_THRESHOLD; }
    setThreshold(v) { this.SIMILARITY_THRESHOLD = v; }
    // ============================================================
    // 内部
    // ============================================================
    /**
     * Jaccard 相似度去重
     * similarity > mergeThreshold → 合并
     * similarity > threshold → 保留最高置信度
     * similarity ≤ threshold → 两个都保留
     */
    deduplicate(facts, threshold, mergeThreshold, decisions) {
        if (facts.length <= 1)
            return facts;
        const result = [];
        const used = new Set();
        for (let i = 0; i < facts.length; i++) {
            if (used.has(i))
                continue;
            let bestFact = facts[i];
            used.add(i);
            for (let j = i + 1; j < facts.length; j++) {
                if (used.has(j))
                    continue;
                const similarity = this.jaccardSimilarity(facts[i].content, facts[j].content);
                if (similarity > mergeThreshold) {
                    // 高度相似 → 合并（取交集 + 更高置信度）
                    const mergedContent = facts[i].content.length > facts[j].content.length
                        ? facts[i].content
                        : facts[j].content;
                    bestFact = {
                        ...bestFact,
                        content: mergedContent,
                        confidence: this.higherConfidence(bestFact.confidence, facts[j].confidence),
                    };
                    used.add(j);
                    decisions.push({
                        factId: facts[j].id,
                        sourceA: facts[i].id,
                        sourceB: facts[j].id,
                        decision: 'merge',
                        reason: `Similarity ${similarity.toFixed(2)} > ${mergeThreshold}`,
                        similarity: Math.round(similarity * 100) / 100,
                    });
                }
                else if (similarity > threshold) {
                    // 中度相似 → 保留置信度更高的
                    const higher = this.higherConfidence(facts[i].confidence, facts[j].confidence) === facts[i].confidence
                        ? 'keep_a' : 'keep_b';
                    const kept = higher === 'keep_a' ? facts[i] : facts[j];
                    bestFact = kept;
                    used.add(j);
                    decisions.push({
                        factId: facts[j].id,
                        sourceA: facts[i].id,
                        sourceB: facts[j].id,
                        decision: higher,
                        reason: `Similarity ${similarity.toFixed(2)} > ${threshold}`,
                        similarity: Math.round(similarity * 100) / 100,
                    });
                }
                // else: 不相似 → 两个都保留
            }
            result.push(bestFact);
        }
        return result;
    }
    /**
     * Jaccard 相似度（基于字符双字母组）
     */
    jaccardSimilarity(a, b) {
        if (!a || !b)
            return 0;
        if (a === b)
            return 1.0;
        const getBigrams = (s) => {
            const chars = s.toLowerCase().replace(/\s+/g, '').split('');
            const bigrams = new Set();
            for (let i = 0; i < chars.length - 1; i++) {
                bigrams.add(chars[i] + chars[i + 1]);
            }
            return bigrams;
        };
        const bgA = getBigrams(a);
        const bgB = getBigrams(b);
        if (bgA.size === 0 && bgB.size === 0)
            return 1.0;
        const intersection = new Set([...bgA].filter(x => bgB.has(x)));
        const union = new Set([...bgA, ...bgB]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    higherConfidence(a, b) {
        const rank = { CONFIRMED: 3, LIKELY: 2, UNCERTAIN: 1 };
        return (rank[a] >= rank[b]) ? a : b;
    }
    resolveConsensusConfidence(candidates) {
        const confirmed = candidates.filter(c => c.confidence === 'CONFIRMED').length;
        const likely = candidates.filter(c => c.confidence === 'LIKELY').length;
        if (confirmed > candidates.length / 2)
            return 'CONFIRMED';
        if (likely > candidates.length / 2)
            return 'LIKELY';
        return 'UNCERTAIN';
    }
}
export const fusionEngine = new FusionEngine();
//# sourceMappingURL=fusion-engine.js.map