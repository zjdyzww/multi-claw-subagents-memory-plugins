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
export declare class RouterEngine extends EventEmitter {
    private decisions;
    private totalDecisionTime;
    private queryCount;
    private directCount;
    private parallelCount;
    private iterativeCount;
    private maxRecentDecisions;
    /**
     * 分类查询并做出路由决策
     */
    classifyQuery(query: string, context?: {
        availableAgents?: string[];
        targetRepo?: RepoType;
        preferSpeed?: boolean;
        preferAccuracy?: boolean;
    }): RouteDecision;
    private buildDecision;
    /**
     * 获取路由统计
     */
    getStats(): RouterStats;
    /**
     * 获取最近路由决策
     */
    getRecentDecisions(limit?: number): RouteDecision[];
    /**
     * 根据给定的策略执行查询（委托给 IndexEngine）
     */
    executeQuery(decision: RouteDecision, indexEngine: IndexEngine, params: {
        text: string;
        repoTypes?: RepoType[];
        tags?: string[];
        limit?: number;
    }): Promise<SearchResult[]>;
    /**
     * 重置统计
     */
    resetStats(): void;
    /**
     * direct 策略：精准单点查询
     */
    private isDirectQuery;
    /**
     * parallel 策略：宽泛多维度查询
     * 特征：需要同时搜索多个源、包含"所有"/"每个"/"全部"等
     */
    private isParallelQuery;
    /**
     * iterative 策略：需要多步推理
     * 特征：逐步缩小范围、依赖前一步结果
     */
    private isIterativeQuery;
    private recordDecision;
}
export declare const routerEngine: RouterEngine;
export {};
//# sourceMappingURL=router-engine.d.ts.map