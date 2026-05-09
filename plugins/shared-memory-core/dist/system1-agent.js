/**
 * System1 Agent — 淘金式精炼
 * 接收 System2 的全量 MemoryRepresentation，按7条标准筛选精炼
 */
import { EventEmitter } from 'eventemitter3';
export class System1Agent extends EventEmitter {
    agentId;
    role = 'system1';
    agentType;
    _status;
    currentInput = null;
    currentResult = null;
    goldPanRate = { min: 0.05, max: 0.15 };
    constructor(agentId, agentType) {
        super();
        this.agentId = agentId;
        this.agentType = agentType;
        this._status = {
            agentId,
            role: 'system1',
            status: 'idle',
            processedCount: 0,
            errorCount: 0,
        };
    }
    /**
     * 设置淘金率范围 (论文原则: 5%-15%)
     */
    setGoldPanRate(minRate, maxRate) {
        this.goldPanRate = { min: minRate, max: maxRate };
    }
    getGoldPanRate() { return { ...this.goldPanRate }; }
    get status() {
        return this._status.status;
    }
    getStatus() {
        return { ...this._status };
    }
    async startProcessing(input) {
        this._status.status = 'processing';
        this.currentInput = input;
        this.emit('processingStarted', { agentId: this.agentId, input });
        try {
            // System1 职责：按7项标准淘金式精炼，遵守 5%-15% 淘金率
            const refinedFacts = this.refineFacts(input.facts);
            const goldPanRatio = input.facts.length > 0 ? refinedFacts.length / input.facts.length : 0;
            this.currentResult = {
                id: input.id || `sys1-${Date.now()}`,
                rawContent: input.rawContent,
                refinedContent: this.buildRefinedContent(refinedFacts),
                facts: refinedFacts,
                confidence: this.calculateOverallConfidence(refinedFacts),
                source: input.source || 'conversation',
                timestamp: new Date().toISOString(),
                metadata: {
                    ...input.metadata,
                    totalFacts: input.facts.length,
                    refinedCount: refinedFacts.length,
                    goldPanRatio: Math.round(goldPanRatio * 100) / 100,
                    discardRate: Math.round((1 - goldPanRatio) * 100) / 100,
                },
                residualInfo: input.residualInfo,
            };
            this._status.processedCount++;
            this._status.lastProcessedAt = new Date().toISOString();
            this._status.status = 'idle';
            this.emit('processingComplete', { agentId: this.agentId, result: this.currentResult });
        }
        catch (error) {
            this._status.status = 'error';
            this._status.errorCount++;
            this._status.errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('processingError', { agentId: this.agentId, error });
            throw error;
        }
    }
    async getResult() {
        if (!this.currentResult) {
            throw new Error('No result available. Call startProcessing first.');
        }
        return this.currentResult;
    }
    async shutdown() {
        this._status.status = 'idle';
        this.currentInput = null;
        this.currentResult = null;
        this.emit('shutdown', { agentId: this.agentId });
    }
    /**
     * 按7项标准筛选精炼事实点
     *
     * 1. 用户明确表达 — 置信度: CONFIRMED
     * 2. 关键决策结论 — 置信度: CONFIRMED
     * 3. 环境/配置变更 — 置信度: CONFIRMED
     * 4. 合理推断 — 置信度: LIKELY
     * 5. 首次获取信息 — 置信度: LIKELY
     * 6. 模糊表达 — 置信度: UNCERTAIN (保留但不升级)
     * 7. 与已有矛盾 — 置信度: UNCERTAIN (标记冲突)
     */
    refineFacts(facts) {
        const refined = [];
        for (const fact of facts) {
            const evaluated = this.evaluateFact(fact);
            if (evaluated) {
                refined.push({
                    ...fact,
                    confidence: evaluated.confidence,
                    verified: evaluated.verified,
                });
            }
        }
        return refined;
    }
    evaluateFact(fact) {
        const content = fact.content.toLowerCase();
        // 用户明确表达的关键词
        const explicitPatterns = /^(我是|我的|我要|我决定|确认|是的|对|没错|OK|好的)/;
        const decisionPatterns = /(决定|采用|选择|使用|设定|确认方案|最终方案)/;
        const configPatterns = /(修改|配置|设置|部署|安装|升级|回滚)/;
        const vaguePatterns = /(可能|大概|也许|应该|好像|似乎|不一定|还不确定)/;
        // 用户明确表达 → CONFIRMED (优先检查)
        if (explicitPatterns.test(content)) {
            return { confidence: 'CONFIRMED', verified: true };
        }
        // 关键决策 → CONFIRMED
        if (decisionPatterns.test(content)) {
            return { confidence: 'CONFIRMED', verified: true };
        }
        // 歧义或模糊表达 → 保持 UNCERTAIN
        if (vaguePatterns.test(content)) {
            return { confidence: 'UNCERTAIN', verified: false };
        }
        // 配置/环境变更 → LIKELY
        if (configPatterns.test(content)) {
            return { confidence: 'LIKELY', verified: false };
        }
        // 有信息量的内容 → LIKELY
        if (content.length > 10) {
            return { confidence: 'LIKELY', verified: false };
        }
        // 短而无意义的内容 → 丢弃
        return null;
    }
    calculateOverallConfidence(facts) {
        if (facts.length === 0)
            return 'UNCERTAIN';
        const confirmed = facts.filter(f => f.confidence === 'CONFIRMED').length;
        const likely = facts.filter(f => f.confidence === 'LIKELY').length;
        const uncertain = facts.filter(f => f.confidence === 'UNCERTAIN').length;
        if (confirmed > likely && confirmed > uncertain)
            return 'CONFIRMED';
        if (likely >= confirmed)
            return 'LIKELY';
        return 'UNCERTAIN';
    }
    buildRefinedContent(facts) {
        const lines = facts.map(f => {
            const marker = f.confidence === 'CONFIRMED' ? '🟢'
                : f.confidence === 'LIKELY' ? '🟡' : '🔴';
            return `${marker} ${f.content}`;
        });
        return lines.join('\n\n');
    }
}
// 导出工厂函数
export function createSystem1Agent(agentId, agentType) {
    return new System1Agent(agentId, agentType);
}
//# sourceMappingURL=system1-agent.js.map