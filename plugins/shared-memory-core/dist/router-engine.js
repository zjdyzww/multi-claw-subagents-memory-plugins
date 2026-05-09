/**
 * Router Engine — 自适应三策略路由引擎
 *
 * classify_query() → direct | parallel | iterative
 * 集成 IndexEngine 进行查询分类与路由决策
 */
import { EventEmitter } from 'eventemitter3';
export class RouterEngine extends EventEmitter {
    decisions = [];
    totalDecisionTime = 0;
    queryCount = 0;
    directCount = 0;
    parallelCount = 0;
    iterativeCount = 0;
    maxRecentDecisions = 100;
    /**
     * 分类查询并做出路由决策
     */
    classifyQuery(query, context) {
        const startTime = Date.now();
        const queryLower = query.toLowerCase();
        // 偏好优先级最高
        if (context?.preferSpeed) {
            const decision = this.makeDecision(query, 'direct', '速度优先，直连最快代理', context?.availableAgents);
            const decisionMs = Date.now() - startTime;
            this.recordDecision('direct', decisionMs);
            return { ...decision, decisionId: `route-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, timestamp: new Date().toISOString(), metadata: { decisionMs } };
        }
        if (context?.preferAccuracy) {
            const decision = this.makeDecision(query, 'parallel', '精度优先，多代理并行校验', context?.availableAgents);
            const decisionMs = Date.now() - startTime;
            this.recordDecision('parallel', decisionMs);
            return { ...decision, decisionId: `route-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, timestamp: new Date().toISOString(), metadata: { decisionMs } };
        }
        let strategy;
        let reason;
        let targetAgents = [];
        // 精准查询 → direct
        if (this.isDirectQuery(queryLower)) {
            strategy = 'direct';
            reason = '精准单点查询，直连单个代理最高效';
            targetAgents = [context?.availableAgents?.[0] || 'default'];
        }
        // 宽泛查询 → parallel
        else if (this.isParallelQuery(queryLower)) {
            strategy = 'parallel';
            reason = '宽泛多维度查询，并行多代理提高覆盖率';
            targetAgents = context?.availableAgents?.slice(0, 3) || ['sys1', 'sys2', 'full'];
        }
        // 需要多步推理 → iterative
        else if (this.isIterativeQuery(queryLower)) {
            strategy = 'iterative';
            reason = '需要多步推理，迭代轮询逐步缩小范围';
            targetAgents = context?.availableAgents?.slice(0, 2) || ['sys1', 'full'];
        }
        // 默认
        else {
            strategy = 'direct';
            reason = '默认直连策略';
            targetAgents = [context?.availableAgents?.[0] || 'default'];
        }
        const decisionMs = Date.now() - startTime;
        this.recordDecision(strategy, decisionMs);
        const decision = {
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
    getStats() {
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
    getRecentDecisions(limit = 10) {
        return this.decisions.slice(-limit);
    }
    /**
     * 根据给定的策略执行查询（委托给 IndexEngine）
     */
    async executeQuery(decision, indexEngine, params) {
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
    resetStats() {
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
     * 快速构造决策对象
     */
    makeDecision(query, strategy, reason, availableAgents) {
        return {
            decisionId: '',
            query,
            strategy,
            targetAgents: strategy === 'direct'
                ? [availableAgents?.[0] || 'default']
                : availableAgents?.slice(0, 3) || ['sys1', 'sys2', 'full'],
            reason,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * direct 策略：精准单点查询
     */
    isDirectQuery(query) {
        const directPatterns = [
            /^(id:|find\s+\d+|查询\s*id|by\s+id|精确|exact)/,
            /^(什么是|what\s+is|define|定义)/i,
            /^(怎么|how\s+to|如何|教程)/i,
        ];
        if (directPatterns.some(p => p.test(query)))
            return true;
        // Very short query (<5 chars) → direct
        if (query.length < 5)
            return true;
        // 包含单一明确实体
        const entityMatches = query.match(/\b[a-z0-9_-]{3,}\b/gi);
        if (entityMatches && entityMatches.length <= 1)
            return true;
        return false;
    }
    /**
     * parallel 策略：宽泛多维度查询
     * 特征：需要同时搜索多个源、包含"所有"/"每个"/"全部"等
     */
    isParallelQuery(query) {
        const parallelPatterns = [
            /(\b所有|\ball|\b全部|\b每个\b|\bevery)/i,
            /(盘点|汇总|总结|overview|summary|report)/i,
            /(比较|对比|compare|versus|vs\.?)/i,
            /(分析|analyze|评估|evaluate|review)/i,
            /(哪些|关系|关联|related|connected)/,
        ];
        if (parallelPatterns.some(p => p.test(query)))
            return true;
        // 包含多个关键词（3+） → parallel
        const keywords = query.split(/\s+/).filter(w => w.length > 1);
        if (keywords.length >= 4)
            return true;
        return false;
    }
    /**
     * iterative 策略：需要多步推理
     * 特征：逐步缩小范围、依赖前一步结果
     */
    isIterativeQuery(query) {
        const iterativePatterns = [
            /(然后|接着|下一步|then|next|subsequent)/i,
            /(逐步|step|sequence|chain|pipeline)/i,
            /(依赖|depends|requires|prerequisite)/i,
            /(推理|推导|infer|deduce|reason)/i,
            /(如果.*那么|if.*then)/i,
            /^(为什么|why|原因|cause)/i,
        ];
        if (iterativePatterns.some(p => p.test(query)))
            return true;
        // 包含条件逻辑 → iterative
        if (/(如果|if|假设|assume|基于|based)/i.test(query) && query.length > 20)
            return true;
        return false;
    }
    // ============================================================
    // 内部统计
    // ============================================================
    recordDecision(strategy, timeMs) {
        this.queryCount++;
        this.totalDecisionTime += timeMs;
        switch (strategy) {
            case 'direct':
                this.directCount++;
                break;
            case 'parallel':
                this.parallelCount++;
                break;
            case 'iterative':
                this.iterativeCount++;
                break;
        }
    }
}
// 导出单例
export const routerEngine = new RouterEngine();
//# sourceMappingURL=router-engine.js.map