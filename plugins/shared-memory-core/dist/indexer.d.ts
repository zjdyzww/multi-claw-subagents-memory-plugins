/**
 * Index Engine - 记忆文档索引和搜索
 */
import { EventEmitter } from 'eventemitter3';
import { MemoryDocument, SearchQuery, SearchResult, RepoType } from './types.js';
export declare class IndexEngine extends EventEmitter {
    private indexes;
    private searchIndex;
    constructor();
    /**
     * 从文件路径解析记忆文档
     */
    private parseMemoryFile;
    /**
     * 生成唯一 ID
     */
    private generateId;
    /**
     * 索引单个文档
     */
    indexDocument(repoType: RepoType, filePath: string): Promise<void>;
    /**
     * 索引整个仓库目录
     */
    indexRepo(repoPath: string, repoType: RepoType): Promise<number>;
    /**
     * 搜索记忆
     */
    searchMemory(query: SearchQuery): Promise<SearchResult[]>;
    /**
     * 获取相关记忆
     */
    getRelatedMemories(topic: string, limit?: number): Promise<MemoryDocument[]>;
    /**
     * 获取索引统计
     */
    getIndexStats(): Record<RepoType, number>;
    /**
     * 清除索引
     */
    clearIndex(repoType?: RepoType): void;
}
export declare const indexEngine: IndexEngine;
//# sourceMappingURL=indexer.d.ts.map