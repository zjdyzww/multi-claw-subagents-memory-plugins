/**
 * Index Engine - 记忆文档索引和搜索
 */

import { EventEmitter } from 'eventemitter3';
import matter from 'gray-matter';
import * as fs from 'fs';
import * as path from 'path';
import { MemoryDocument, SearchQuery, SearchResult, RepoType } from './types.js';

interface IndexEntry {
  path: string;
  repoType: RepoType;
  title: string;
  tags: string[];
  contentPreview: string;
  updatedAt: string;
}

export class IndexEngine extends EventEmitter {
  private indexes: Map<RepoType, Map<string, IndexEntry>> = new Map();
  private searchIndex: IndexEntry[] = [];

  constructor() {
    super();
    // 初始化各仓库的索引
    for (const repoType of ['main', 'business', 'code', 'private'] as RepoType[]) {
      this.indexes.set(repoType, new Map());
    }
  }

  /**
   * 从文件路径解析记忆文档
   */
  private parseMemoryFile(filePath: string, repoType: RepoType): MemoryDocument | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(content);
      
      return {
        id: this.generateId(filePath),
        title: parsed.data.title || path.basename(filePath, '.md'),
        content: parsed.content,
        repoType,
        category: parsed.data.category || 'general',
        tags: parsed.data.tags || [],
        accessLevel: parsed.data.accessLevel || 'SHARED',
        author: parsed.data.author || 'unknown',
        createdAt: parsed.data.createdAt || new Date().toISOString(),
        updatedAt: parsed.data.updatedAt || new Date().toISOString(),
        version: parsed.data.version || 1,
        parentId: parsed.data.parentId,
        relatedDocs: parsed.data.relatedDocs,
        projectId: parsed.data.projectId,
        signature: parsed.data.signature
      };
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(filePath: string): string {
    const hash = filePath.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash).toString(36);
  }

  /**
   * 索引单个文档
   */
  async indexDocument(repoType: RepoType, filePath: string): Promise<void> {
    const repoIndex = this.indexes.get(repoType);
    if (!repoIndex) return;

    const doc = this.parseMemoryFile(filePath, repoType);
    if (!doc) return;

    // 从文件路径获取相对路径作为索引键
    const relativePath = path.relative(filePath, filePath).replace(/^(\.\/|\\)/, '');
    
    repoIndex.set(relativePath, {
      path: filePath,
      repoType,
      title: doc.title,
      tags: doc.tags,
      contentPreview: doc.content.substring(0, 200),
      updatedAt: doc.updatedAt
    });

    // 更新全局搜索索引
    const existingIndex = this.searchIndex.findIndex(e => e.path === filePath);
    if (existingIndex >= 0) {
      this.searchIndex[existingIndex] = {
        path: filePath,
        repoType,
        title: doc.title,
        tags: doc.tags,
        contentPreview: doc.content.substring(0, 200),
        updatedAt: doc.updatedAt
      };
    } else {
      this.searchIndex.push({
        path: filePath,
        repoType,
        title: doc.title,
        tags: doc.tags,
        contentPreview: doc.content.substring(0, 200),
        updatedAt: doc.updatedAt
      });
    }

    this.emit('documentIndexed', { repoType, path: filePath, doc });
  }

  /**
   * 索引整个仓库目录
   */
  async indexRepo(repoPath: string, repoType: RepoType): Promise<number> {
    let count = 0;
    
    const indexDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // 跳过隐藏目录和特殊目录
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        
        if (entry.isDirectory()) {
          indexDir(fullPath);
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.yaml') || entry.name.endsWith('.json')) {
          this.indexDocument(repoType, fullPath);
          count++;
        }
      }
    };

    indexDir(repoPath);
    this.emit('repoIndexed', { repoType, path: repoPath, count });
    return count;
  }

  /**
   * 搜索记忆
   */
  async searchMemory(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryLower = query.text.toLowerCase();

    // 确定搜索范围
    let searchScope: IndexEntry[];
    if (query.repoTypes && query.repoTypes.length > 0) {
      searchScope = this.searchIndex.filter(e => query.repoTypes!.includes(e.repoType));
    } else {
      searchScope = this.searchIndex;
    }

    for (const entry of searchScope) {
      let score = 0;
      const highlights: string[] = [];

      // 标题匹配
      if (entry.title.toLowerCase().includes(queryLower)) {
        score += 10;
        highlights.push(`标题: ${entry.title}`);
      }

      // 标签匹配
      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 5;
          highlights.push(`标签: ${tag}`);
        }
      }

      // 内容预览匹配
      if (entry.contentPreview.toLowerCase().includes(queryLower)) {
        score += 3;
        highlights.push(`内容: ${entry.contentPreview.substring(0, 100)}...`);
      }

      // 过滤条件
      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some(t => entry.tags.includes(t));
        if (!hasMatchingTag) continue;
      }

      if (query.author && entry.path.includes(query.author)) {
        score += 2;
      }

      if (query.dateRange) {
        const entryDate = new Date(entry.updatedAt);
        const from = new Date(query.dateRange.from);
        const to = new Date(query.dateRange.to);
        if (entryDate < from || entryDate > to) continue;
      }

      if (score > 0) {
        const doc = this.parseMemoryFile(entry.path, entry.repoType);
        if (doc) {
          results.push({
            document: doc,
            score,
            highlights
          });
        }
      }
    }

    // 排序并分页
    results.sort((a, b) => b.score - a.score);
    
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    return results.slice(offset, offset + limit);
  }

  /**
   * 获取相关记忆
   */
  async getRelatedMemories(topic: string, limit = 5): Promise<MemoryDocument[]> {
    const results = await this.searchMemory({
      text: topic,
      limit
    });
    return results.map(r => r.document);
  }

  /**
   * 获取索引统计
   */
  getIndexStats(): Record<RepoType, number> {
    const stats: Record<RepoType, number> = {
      main: 0,
      business: 0,
      code: 0,
      private: 0
    };

    for (const [repoType, index] of this.indexes) {
      stats[repoType] = index.size;
    }

    return stats;
  }

  /**
   * 清除索引
   */
  clearIndex(repoType?: RepoType): void {
    if (repoType) {
      this.indexes.get(repoType)?.clear();
      this.searchIndex = this.searchIndex.filter(e => e.repoType !== repoType);
    } else {
      for (const index of this.indexes.values()) {
        index.clear();
      }
      this.searchIndex = [];
    }
  }
}

// 导出单例
export const indexEngine = new IndexEngine();
