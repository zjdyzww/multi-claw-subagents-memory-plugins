/**
 * Vector Engine — 向量语义检索抽象层
 *
 * 支持后端: InMemory (余弦相似度) | Milvus | Qdrant | Chroma
 * 延迟目标: ≤200ms (in-memory)
 */
import { EventEmitter } from 'eventemitter3';
export class VectorEngine extends EventEmitter {
    entries = new Map();
    backendType = 'in-memory';
    dimension = 128;
    searchTimings = [];
    maxTimings = 100;
    constructor(dimension = 128, backendType = 'in-memory') {
        super();
        this.dimension = dimension;
        this.backendType = backendType;
    }
    /**
     * 索引文档（生成简单 embedding 并存储）
     */
    index(document) {
        const existing = this.entries.get(document.id);
        if (existing) {
            existing.document = document;
            existing.embedding = this.generateEmbedding(document.content);
            this.emit('vectorUpdated', { docId: document.id });
            return existing;
        }
        const entry = {
            id: document.id,
            document,
            embedding: this.generateEmbedding(document.content),
            repoType: document.repoType,
            createdAt: new Date().toISOString(),
        };
        this.entries.set(document.id, entry);
        this.emit('vectorIndexed', { docId: document.id, repoType: document.repoType });
        return entry;
    }
    /**
     * 向量语义搜索（余弦相似度）
     */
    search(query, options = {}) {
        const startTime = Date.now();
        const topK = options.topK || 10;
        const minScore = options.minScore || 0.1;
        const queryEmbedding = this.generateEmbedding(query);
        let candidates = Array.from(this.entries.values());
        // Repo filter
        if (options.repoTypes && options.repoTypes.length > 0) {
            candidates = candidates.filter(e => options.repoTypes.includes(e.repoType));
        }
        // Tag filter
        if (options.filterTags && options.filterTags.length > 0) {
            candidates = candidates.filter(e => options.filterTags.some(t => e.document.tags?.includes(t)));
        }
        // 余弦相似度评分
        const scored = candidates.map(entry => ({
            document: entry.document,
            score: this.cosineSimilarity(queryEmbedding, entry.embedding),
            highlights: [entry.document.title || entry.document.id],
            similarity: 0,
        }));
        scored.forEach(s => { s.similarity = s.score; });
        // 排序 + topK + 阈值过滤
        scored.sort((a, b) => b.score - a.score);
        const results = scored
            .filter(s => s.score >= minScore)
            .slice(0, topK);
        const elapsed = Date.now() - startTime;
        this.searchTimings.push(elapsed);
        if (this.searchTimings.length > this.maxTimings) {
            this.searchTimings.shift();
        }
        this.emit('searchComplete', {
            query,
            resultCount: results.length,
            elapsedMs: elapsed,
            topScore: results[0]?.score || 0,
        });
        return results;
    }
    /**
     * 删除向量
     */
    delete(docId) {
        const removed = this.entries.delete(docId);
        if (removed) {
            this.emit('vectorDeleted', { docId });
        }
        return removed;
    }
    /**
     * 批量索引
     */
    indexBatch(documents) {
        documents.forEach(doc => this.index(doc));
        return documents.length;
    }
    /**
     * 获取统计
     */
    getStats() {
        const timings = this.searchTimings;
        const avgMs = timings.length > 0
            ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length * 100) / 100
            : 0;
        return {
            totalVectors: this.entries.size,
            dimension: this.dimension,
            backendType: this.backendType,
            avgSearchMs: avgMs,
        };
    }
    /**
     * 清空所有向量
     */
    clear() {
        this.entries.clear();
        this.searchTimings = [];
    }
    // ============================================================
    // 内部：简单 embedding 生成 (hash-based + TF-IDF-like)
    // 生产环境应替换为真正的 embedding 模型
    // ============================================================
    generateEmbedding(text) {
        const embedding = new Array(this.dimension).fill(0);
        if (!text || text.length === 0)
            return embedding;
        // 字符级别 n-gram hashing → 向量
        const chars = text.toLowerCase().split('');
        for (let i = 0; i < chars.length; i++) {
            const code = chars[i].charCodeAt(0);
            const idx = code % this.dimension;
            embedding[idx] += 1;
            // Bigram
            if (i < chars.length - 1) {
                const bigramCode = (chars[i] + chars[i + 1]).split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
                const bigramIdx = Math.abs(bigramCode % this.dimension);
                embedding[bigramIdx] += 0.5;
            }
        }
        // L2 归一化
        const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
        if (magnitude > 0) {
            for (let i = 0; i < this.dimension; i++) {
                embedding[i] /= magnitude;
            }
        }
        return embedding;
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        for (let i = 0; i < this.dimension; i++) {
            dotProduct += (a[i] || 0) * (b[i] || 0);
        }
        // Vectors are already L2 normalized
        return Math.max(0, dotProduct);
    }
}
export const vectorEngine = new VectorEngine();
//# sourceMappingURL=vector-engine.js.map