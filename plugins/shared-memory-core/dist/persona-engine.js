/**
 * Persona Engine — Persona 协调引擎
 *
 * 4 专家 Persona（Architect / Reviewer / Critic / Integrator）
 * 关键词 + Embedding 双层激活，多专家协作推理流水线
 */
import { EventEmitter } from 'eventemitter3';
export class PersonaEngine extends EventEmitter {
    personas = new Map();
    collaborationHistory = [];
    maxHistory = 50;
    constructor() {
        super();
        this.initializeDefaultPersonas();
    }
    /**
     * 初始化 4 个默认专家 Persona
     */
    initializeDefaultPersonas() {
        this.registerPersona({
            id: 'architect',
            name: 'Architect',
            role: '架构师',
            description: '关注系统结构、存储布局、层次设计，从宏观角度评估记忆组织',
            activationKeywords: [
                '架构', '结构', '层次', '分层', '布局', '设计', '模式', '框架',
                'architecture', 'structure', 'layer', 'design', 'pattern', 'framework',
                'L1', 'L2', 'L3', 'L4', '金字塔', 'pyramid',
            ],
            minThreshold: 15,
        });
        this.registerPersona({
            id: 'reviewer',
            name: 'Reviewer',
            role: '审查者',
            description: '关注信息准确性、一致性、时效性，从质量角度评估记忆可信度',
            activationKeywords: [
                '准确', '一致', '时效', '验证', '核实', '确认', '检查', '审计',
                'accuracy', 'consistency', 'verify', 'validate', 'audit', 'check',
                '最新', '过期', '版本', 'version', 'update',
            ],
            minThreshold: 15,
        });
        this.registerPersona({
            id: 'critic',
            name: 'Critic',
            role: '批判者',
            description: '挑战假设、寻找矛盾、测试边界条件，从反面角度评估记忆鲁棒性',
            activationKeywords: [
                '矛盾', '冲突', '假设', '边界', '问题', '风险', '错误', '漏洞',
                'contradiction', 'conflict', 'assumption', 'edge', 'risk', 'error', 'bug',
                '如果', '假如', '但是', '然而', 'but', 'however', 'if',
            ],
            minThreshold: 15,
        });
        this.registerPersona({
            id: 'integrator',
            name: 'Integrator',
            role: '整合者',
            description: '综合多方意见、消除差异、形成统一视图，从协同角度做最终决策',
            activationKeywords: [
                '综合', '整合', '汇总', '协调', '统一', '合并', '融合', '共识',
                'integrate', 'combine', 'merge', 'unify', 'consensus', 'synthesize',
                '全部', '所有', '总体', '整体', 'overall', 'complete',
            ],
            minThreshold: 10,
        });
    }
    /**
     * 注册自定义 Persona
     */
    registerPersona(definition) {
        this.personas.set(definition.id, { ...definition, activationScore: 0 });
        this.emit('personaRegistered', { id: definition.id, name: definition.name });
    }
    /**
     * 激活 Persona（基于关键词匹配）
     * 返回所有被激活的 Persona
     */
    activateByKeywords(text) {
        const textLower = text.toLowerCase();
        const activated = [];
        for (const persona of this.personas.values()) {
            let score = 0;
            for (const keyword of persona.activationKeywords) {
                if (textLower.includes(keyword.toLowerCase())) {
                    score += 5; // 每个匹配关键词 +5 分
                }
            }
            persona.activationScore = score;
            if (score >= persona.minThreshold) {
                activated.push({ ...persona });
            }
        }
        // 按激活度降序排列
        activated.sort((a, b) => b.activationScore - a.activationScore);
        if (activated.length > 0) {
            this.emit('personasActivated', {
                count: activated.length,
                personas: activated.map(p => p.name),
                scores: Object.fromEntries(activated.map(p => [p.name, p.activationScore])),
            });
        }
        return activated;
    }
    /**
     * 运行协作推理流水线
     *
     * 流程：
     * 1. 关键词激活 → 2. 各专家分别评估 → 3. 综合投票 → 4. Integrator 决策
     */
    async collaborate(input) {
        const text = [input.rawContent, input.refinedContent].filter(Boolean).join(' ');
        const activatedPersonas = this.activateByKeywords(text);
        const opinions = [];
        // 如果关键词未能激活任何 Persona，使用全部 4 个（低分模式）
        const evaluators = activatedPersonas.length > 0
            ? activatedPersonas
            : Array.from(this.personas.values());
        for (const persona of evaluators) {
            const opinion = this.getExpertOpinion(persona, input);
            opinions.push(opinion);
            this.emit('expertEvaluated', { personaId: persona.id, opinion });
        }
        // 投票 → 最高票数的置信度当选
        const votes = {
            CONFIRMED: 0,
            LIKELY: 0,
            UNCERTAIN: 0,
        };
        for (const op of opinions) {
            votes[op.confidence]++;
        }
        // 确定最终置信度
        let consensusConfidence = 'UNCERTAIN';
        const voteEntries = Object.entries(votes);
        voteEntries.sort((a, b) => b[1] - a[1]);
        if (voteEntries[0][1] >= 3) {
            consensusConfidence = voteEntries[0][0]; // ≥3 票 → 确定
        }
        else if (voteEntries[0][1] === 2 && voteEntries[1][1] <= 1) {
            consensusConfidence = voteEntries[0][0]; // 2:1:1 → 多数
        }
        else {
            // 平票或不确定 → 默认 LIKELY
            consensusConfidence = 'LIKELY';
        }
        // 生成摘要
        const confirmOpinions = opinions.filter(o => o.confidence === 'CONFIRMED');
        const likelyOpinions = opinions.filter(o => o.confidence === 'LIKELY');
        const uncertainOpinions = opinions.filter(o => o.confidence === 'UNCERTAIN');
        const summary = [
            `4 专家协作完成：`,
            `🟢 CONFIRMED: ${confirmOpinions.length}票 (${confirmOpinions.map(o => o.personaName).join(', ') || '无'})`,
            `🟡 LIKELY: ${likelyOpinions.length}票 (${likelyOpinions.map(o => o.personaName).join(', ') || '无'})`,
            `🔴 UNCERTAIN: ${uncertainOpinions.length}票 (${uncertainOpinions.map(o => o.personaName).join(', ') || '无'})`,
            `→ 共识: ${consensusConfidence}`,
        ].join('\n');
        const result = {
            consensusConfidence,
            votes,
            opinions,
            summary,
            timestamp: new Date().toISOString(),
        };
        this.collaborationHistory.push(result);
        if (this.collaborationHistory.length > this.maxHistory) {
            this.collaborationHistory.shift();
        }
        this.emit('collaborationComplete', result);
        return result;
    }
    /**
     * 获取 Persona 列表
     */
    getPersonas() {
        return Array.from(this.personas.values()).map(p => ({ ...p }));
    }
    /**
     * 获取协作历史
     */
    getHistory(limit = 10) {
        return this.collaborationHistory.slice(-limit);
    }
    /**
     * 重置所有 Persona 激活度
     */
    resetActivation() {
        for (const persona of this.personas.values()) {
            persona.activationScore = 0;
        }
    }
    // ============================================================
    // 内部方法
    // ============================================================
    /**
     * 单个专家对输入进行评估
     */
    getExpertOpinion(persona, input) {
        const text = [input.rawContent, input.refinedContent]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        const suggestions = [];
        let confidence = 'UNCERTAIN';
        let reasoning = '';
        switch (persona.id) {
            case 'architect':
                reasoning = this.architectEvaluate(text, input, suggestions);
                confidence = this.architectConfidence(text);
                break;
            case 'reviewer':
                reasoning = this.reviewerEvaluate(text, input, suggestions);
                confidence = this.reviewerConfidence(input);
                break;
            case 'critic':
                reasoning = this.criticEvaluate(text, input, suggestions);
                confidence = this.criticConfidence(input);
                break;
            case 'integrator':
                reasoning = this.integratorEvaluate(text, input, suggestions);
                confidence = this.integratorConfidence(input);
                break;
            default:
                reasoning = `${persona.name} evaluated with activation score ${persona.activationScore}`;
                confidence = input.confidence || 'UNCERTAIN';
        }
        return {
            personaId: persona.id,
            personaName: persona.name,
            score: persona.activationScore,
            confidence,
            reasoning,
            suggestions,
            timestamp: new Date().toISOString(),
        };
    }
    // ---- 各专家评估逻辑 ----
    architectEvaluate(text, input, suggestions) {
        const parts = [];
        if (input.facts.length > 10) {
            parts.push('检测到大量事实点，建议按 L1-L4 分层存储');
            suggestions.push('将 >10 条事实按重要性分层为 L1-L4');
        }
        if (/架构|结构|模式/.test(text)) {
            parts.push('输入涉及架构讨论，需关注层次一致性');
        }
        if (input.facts.length === 0) {
            parts.push('无结构化事实点，建议补充结构化数据');
        }
        return parts.join('。') || '从架构角度评估：结构合理';
    }
    architectConfidence(text) {
        if (/L[1-4]|分层|金字塔|架构/.test(text))
            return 'CONFIRMED';
        if (text.length > 100)
            return 'LIKELY';
        return 'UNCERTAIN';
    }
    reviewerEvaluate(_text, input, suggestions) {
        const parts = [];
        const uncertainFacts = input.facts.filter(f => f.confidence === 'UNCERTAIN');
        if (uncertainFacts.length > 0) {
            parts.push(`发现 ${uncertainFacts.length} 条低置信度事实需验证`);
            suggestions.push('标记低置信度事实为待验证');
        }
        if (!input.timestamp || Date.now() - new Date(input.timestamp).getTime() > 7 * 24 * 3600 * 1000) {
            parts.push('信息可能过时，建议更新时效');
        }
        return parts.join('。') || '从审查角度：信息质量良好';
    }
    reviewerConfidence(input) {
        const uncertain = input.facts.filter(f => f.confidence === 'UNCERTAIN').length;
        const total = input.facts.length || 1;
        if (uncertain / total > 0.5)
            return 'UNCERTAIN';
        if (uncertain / total > 0.2)
            return 'LIKELY';
        return 'CONFIRMED';
    }
    criticEvaluate(text, input, suggestions) {
        const parts = [];
        if (input.facts.some(f => f.contradictions && f.contradictions.length > 0)) {
            parts.push('发现事实点存在内部矛盾');
            suggestions.push('标记矛盾事实为冲突待解决');
        }
        if (/可能|大概|也许|似乎/.test(text)) {
            parts.push('表述中存在模糊措辞，可靠性降低');
            suggestions.push('确认模糊表述的真实意图');
        }
        if (input.facts.filter(f => f.verified).length === 0) {
            parts.push('所有事实点均未验证，假设性较高');
        }
        return parts.join('。') || '从批判角度：未发现明显问题';
    }
    criticConfidence(input) {
        const hasContradictions = input.facts.some(f => f.contradictions && f.contradictions.length > 0);
        const verified = input.facts.filter(f => f.verified).length;
        const total = input.facts.length || 1;
        if (hasContradictions)
            return 'UNCERTAIN';
        if (verified / total < 0.3)
            return 'LIKELY';
        return 'CONFIRMED';
    }
    integratorEvaluate(_text, input, suggestions) {
        const parts = [];
        const levels = [...new Set(input.facts.map(f => f.confidence))];
        if (levels.length > 1) {
            parts.push(`存在 ${levels.length} 种不同置信度级别的事实，需统一`);
            suggestions.push('统一置信度标注标准');
        }
        if (input.facts.length > 20) {
            parts.push('事实点过多，建议聚合为摘要');
        }
        return parts.join('。') || '从整合角度：数据一致性良好';
    }
    integratorConfidence(input) {
        const levels = [...new Set(input.facts.map(f => f.confidence))];
        const confirmed = input.facts.filter(f => f.confidence === 'CONFIRMED').length;
        const total = input.facts.length || 1;
        if (levels.length === 1 && levels[0] === 'CONFIRMED')
            return 'CONFIRMED';
        if (confirmed / total >= 0.5)
            return 'LIKELY';
        return 'UNCERTAIN';
    }
}
// 导出单例
export const personaEngine = new PersonaEngine();
//# sourceMappingURL=persona-engine.js.map