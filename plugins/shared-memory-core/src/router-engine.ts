/**
 * Router Engine — 自适应三策略路由引擎
 *
 * classify_query() → direct | parallel | iterative
 * 集成 IndexEngine 进行查询分类与路由决策
 */

import { EventEmitter } from 'eventemitter3';
import type { RouteDecision, RepoType, SearchResult } from './types.js';
import { IndexEngine } from './indexer.js';

interface RouterStats {
  totalQueries: number;
  directCount: number;
  parallelCount: number;
  iterativeCount: number;
  avgDecisionTimeMs: number;
  recentDecisions: RouteDecision[];
}

export class RouterEngine extends EventEmitter {
  private decisions: RouteDecision[] = [];
  private totalDecisionTime = 0;
  private queryCount = 0;
  private directCount = 0;
  private parallelCount = 0;
  private iterativeCount = 0;
  private maxRecentDecisions = 100;

  /**
   * 分类查询并做出路由决策
   */
  classifyQuery(
    query: string,
    context?: {
      availableAgents?: string[];
      targetRepo?: RepoType;
      preferSpeed?: boolean;
      preferAccuracy?: boolean;
    }
  ): RouteDecision {
    const startTime = Date.now();
    const queryLower = (query || '').toLowerCase();
    const agents = context?.availableAgents;

    // 空查询直接走 direct
    if (!queryLower) {
      const decisionMs = Date.now() - startTime;
      this.recordDecision('direct', decisionMs);
      return this.buildDecision('', 'direct', '空查询，默认直连', [agents?.[0] || 'default'], decisionMs, context);
    }

    // 偏好优先级最高（direct / parallel 短路线）
    if (context?.preferSpeed) {
      const decisionMs = Date.now() - startTime;
      this.recordDecision('direct', decisionMs);
      return this.buildDecision(query, 'direct', '速度优先，直连最快代理', [agents?.[0] || 'default'], decisionMs, context);
    }
    if (context?.preferAccuracy) {
      const decisionMs = Date.now() - startTime;
      this.recordDecision('parallel', decisionMs);
      return this.buildDecision(query, 'parallel', '精度优先，多代理并行校验', agents?.slice(0, 3) || ['sys1', 'sys2', 'full'], decisionMs, context);
    }

    let strategy: RouteDecision['strategy'];
    let reason: string;
    let targetAgents: string[] = [];

    if (this.isDirectQuery(queryLower)) {
      strategy = 'direct';
      reason = '精准单点查询，直连单个代理最高效';
      targetAgents = [agents?.[0] || 'default'];
    } else if (this.isParallelQuery(queryLower)) {
      strategy = 'parallel';
      reason = '宽泛多维度查询，并行多代理提高覆盖率';
      targetAgents = agents?.slice(0, 3) || ['sys1', 'sys2', 'full'];
    } else if (this.isIterativeQuery(queryLower)) {
      strategy = 'iterative';
      reason = '需要多步推理，迭代轮询逐步缩小范围';
      targetAgents = agents?.slice(0, 2) || ['sys1', 'full'];
    } else {
      strategy = 'direct';
      reason = '默认直连策略';
      targetAgents = [agents?.[0] || 'default'];
    }

    const decisionMs = Date.now() - startTime;
    this.recordDecision(strategy, decisionMs);
    return this.buildDecision(query, strategy, reason, targetAgents, decisionMs, context);
  }

  private buildDecision(
    query: string,
    strategy: RouteDecision['strategy'],
    reason: string,
    targetAgents: string[],
    decisionMs: number,
    context?: { availableAgents?: string[]; targetRepo?: RepoType; preferSpeed?: boolean; preferAccuracy?: boolean }
  ): RouteDecision {
    const decision: RouteDecision = {
      decisionId: `route-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      query,
      strategy,
      targetAgents,
      reason,
      timestamp: new Date().toISOString(),
      metadata: {
        decisionMs,
        context: context ? JSON.stringify(context) : undefined,
      },
    };

    this.decisions.push(decision);
    if (this.decisions.length > this.maxRecentDecisions) {
      this.decisions.shift();
    }

    this.emit('routeDecision', decision);
    return decision;
  }

  /**
   * 获取路由统计
   */
  getStats(): RouterStats {
    const total = this.directCount + this.parallelCount + this.iterativeCount;

    return {
      totalQueries: total,
      directCount: this.directCount,
      parallelCount: this.parallelCount,
      iterativeCount: this.iterativeCount,
      avgDecisionTimeMs: total > 0
        ? Math.round((this.totalDecisionTime / total) * 100) / 100
        : 0,
      recentDecisions: this.decisions.slice(-10),
    };
  }

  /**
   * 获取最近路由决策
   */
  getRecentDecisions(limit = 10): RouteDecision[] {
    return this.decisions.slice(-limit);
  }

  /**
   * 根据给定的策略执行查询（委托给 IndexEngine）
   */
  async executeQuery(
    decision: RouteDecision,
    indexEngine: IndexEngine,
    params: { text: string; repoTypes?: RepoType[]; tags?: string[]; limit?: number }
  ): Promise<SearchResult[]> {
    this.emit('executionStart', { decisionId: decision.decisionId, strategy: decision.strategy });

    const result = await indexEngine.searchMemory({
      text: params.text,
      repoTypes: params.repoTypes,
      tags: params.tags,
      limit: params.limit || (decision.strategy === 'parallel' ? 20 : 10),
    });

    this.emit('executionComplete', {
      decisionId: decision.decisionId,
      resultCount: result.length,
      strategy: decision.strategy,
    });

    return result;
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.decisions = [];
    this.totalDecisionTime = 0;
    this.queryCount = 0;
    this.directCount = 0;
    this.parallelCount = 0;
    this.iterativeCount = 0;
  }

  // ============================================================
  // 查询分类规则
  // ============================================================

  /**
   * direct 策略：精准单点查询
   */
  private isDirectQuery(query: string): boolean {
    const directPatterns = [
      /^(id:|find\s+\d+|查询\s*id|by\s+id|精确|exact)/,
      /^(什么是|what\s+is|define|定义)/i,
      /^(怎么|how\s+to|如何|教程)/i,
    ];

    if (directPatterns.some(p => p.test(query))) return true;

    // Very short query (<5 chars) → direct
    if (query.length < 5) return true;

    // 包含单一明确实体
    const entityMatches = query.match(/\b[a-z0-9_-]{3,}\b/gi);
    if (entityMatches && entityMatches.length <= 1) return true;

    return false;
  }

  /**
   * parallel 策略：宽泛多维度查询
   * 特征：需要同时搜索多个源、包含"所有"/"每个"/"全部"等
   */
  private isParallelQuery(query: string): boolean {
    const parallelPatterns = [
      /(\b所有|\ball|\b全部|\b每个\b|\bevery)/i,
      /(盘点|汇总|总结|overview|summary|report)/i,
      /(比较|对比|compare|versus|vs\.?)/i,
      /(分析|analyze|评估|evaluate|review)/i,
      /(哪些|关系|关联|related|connected)/,
    ];

    if (parallelPatterns.some(p => p.test(query))) return true;

    // 包含多个关键词（3+） → parallel
    const keywords = query.split(/\s+/).filter(w => w.length > 1);
    if (keywords.length >= 4) return true;

    return false;
  }

  /**
   * iterative 策略：需要多步推理
   * 特征：逐步缩小范围、依赖前一步结果
   */
  private isIterativeQuery(query: string): boolean {
    const iterativePatterns = [
      /(然后|接着|下一步|then|next|subsequent)/i,
      /(逐步|step|sequence|chain|pipeline)/i,
      /(依赖|depends|requires|prerequisite)/i,
      /(推理|推导|infer|deduce|reason)/i,
      /(如果.*那么|if.*then)/i,
      /^(为什么|why|原因|cause)/i,
    ];

    if (iterativePatterns.some(p => p.test(query))) return true;

    // 包含条件逻辑 → iterative
    if (/(如果|if|假设|assume|基于|based)/i.test(query) && query.length > 20) return true;

    return false;
  }

  // ============================================================
  // 内部统计
  // ============================================================

  private recordDecision(strategy: RouteDecision['strategy'], timeMs: number): void {
    this.queryCount++;
    this.totalDecisionTime += timeMs;

    switch (strategy) {
      case 'direct': this.directCount++; break;
      case 'parallel': this.parallelCount++; break;
      case 'iterative': this.iterativeCount++; break;
    }
  }
}

// 导出单例
export const routerEngine = new RouterEngine();
