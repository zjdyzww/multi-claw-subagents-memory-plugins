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

export class VectorEngine extends EventEmitter {
  private entries: Map<string, VectorEntry> = new Map();
  private backendType = 'in-memory';
  private dimension = 128;
  private searchTimings: number[] = [];
  private maxTimings = 100;

  constructor(dimension = 128, backendType = 'in-memory') {
    super();
    this.dimension = dimension;
    this.backendType = backendType;
  }

  /**
   * 索引文档（生成简单 embedding 并存储）
   */
  index(document: MemoryDocument): VectorEntry {
    const existing = this.entries.get(document.id);
    if (existing) {
      existing.document = document;
      existing.embedding = this.generateEmbedding(document.content);
      this.emit('vectorUpdated', { docId: document.id });
      return existing;
    }

    const entry: VectorEntry = {
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
  search(query: string, options: VectorSearchOptions = {}): Array<SearchResult & { similarity: number }> {
    const startTime = Date.now();
    const topK = options.topK || 10;
    const minScore = options.minScore || 0.1;
    const queryEmbedding = this.generateEmbedding(query);

    let candidates = Array.from(this.entries.values());

    // Repo filter
    if (options.repoTypes && options.repoTypes.length > 0) {
      candidates = candidates.filter(e => options.repoTypes!.includes(e.repoType));
    }

    // Tag filter
    if (options.filterTags && options.filterTags.length > 0) {
      candidates = candidates.filter(e =>
        options.filterTags!.some(t => e.document.tags?.includes(t))
      );
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
  delete(docId: string): boolean {
    const removed = this.entries.delete(docId);
    if (removed) {
      this.emit('vectorDeleted', { docId });
    }
    return removed;
  }

  /**
   * 批量索引
   */
  indexBatch(documents: MemoryDocument[]): number {
    documents.forEach(doc => this.index(doc));
    return documents.length;
  }

  /**
   * 获取统计
   */
  getStats(): VectorStats {
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
  clear(): void {
    this.entries.clear();
    this.searchTimings = [];
  }

  // ============================================================
  // 内部：简单 embedding 生成 (hash-based + TF-IDF-like)
  // 生产环境应替换为真正的 embedding 模型
  // ============================================================

  private hashFNV1a(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash);
  }

  private generateEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);

    if (!text || text.length === 0) return embedding;

    // 使用 FNV-1a hash 将 n-gram 分散到高维空间
    const cleaned = text.toLowerCase().replace(/\s+/g, ' ');
    const chars = cleaned.split('');

    for (let i = 0; i < chars.length; i++) {
      // 单字符 hash
      const unigramIdx = this.hashFNV1a(chars[i]) % this.dimension;
      embedding[unigramIdx] += 1;

      // Bigram
      if (i < chars.length - 1) {
        const bigramKey = chars[i] + chars[i + 1];
        const bigramIdx = this.hashFNV1a(bigramKey) % this.dimension;
        embedding[bigramIdx] += 0.5;
      }

      // Trigram (增加上下文敏感度)
      if (i < chars.length - 2) {
        const trigramKey = chars[i] + chars[i + 1] + chars[i + 2];
        const trigramIdx = this.hashFNV1a(trigramKey) % this.dimension;
        embedding[trigramIdx] += 0.25;
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

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < this.dimension; i++) {
      dotProduct += (a[i] || 0) * (b[i] || 0);
    }
    // Vectors are already L2 normalized
    return Math.max(0, dotProduct);
  }
}

export const vectorEngine = new VectorEngine();
