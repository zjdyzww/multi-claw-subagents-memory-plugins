/**
 * Vector Engine — 向量语义检索抽象层
 *
 * 支持后端: InMemory (余弦相似度) | Milvus | Qdrant | Chroma
 * 延迟目标: ≤200ms (in-memory)
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument, SearchResult, RepoType } from './types.js';
interface VectorEntry {
    id: string;
    document: MemoryDocument;
    embedding: number[];
    repoType: RepoType;
    createdAt: string;
}
interface VectorSearchOptions {
    topK?: number;
    minScore?: number;
    repoTypes?: RepoType[];
    filterTags?: string[];
}
interface VectorStats {
    totalVectors: number;
    dimension: number;
    backendType: string;
    avgSearchMs: number;
}
export declare class VectorEngine extends EventEmitter {
    private entries;
    private backendType;
    private dimension;
    private searchTimings;
    private maxTimings;
    constructor(dimension?: number, backendType?: string);
    /**
     * 索引文档（生成简单 embedding 并存储）
     */
    index(document: MemoryDocument): VectorEntry;
    /**
     * 向量语义搜索（余弦相似度）
     */
    search(query: string, options?: VectorSearchOptions): Array<SearchResult & {
        similarity: number;
    }>;
    /**
     * 删除向量
     */
    delete(docId: string): boolean;
    /**
     * 批量索引
     */
    indexBatch(documents: MemoryDocument[]): number;
    /**
     * 获取统计
     */
    getStats(): VectorStats;
    /**
     * 清空所有向量
     */
    clear(): void;
    private hashFNV1a;
    private generateEmbedding;
    private cosineSimilarity;
}
export declare const vectorEngine: VectorEngine;
export {};
//# sourceMappingURL=vector-engine.d.ts.map