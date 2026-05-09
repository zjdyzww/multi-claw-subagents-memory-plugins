/**
 * Persona Engine — Persona 协调引擎
 *
 * 4 专家 Persona（Architect / Reviewer / Critic / Integrator）
 * 关键词 + Embedding 双层激活，多专家协作推理流水线
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryRepresentation, ConfidenceLevel } from './types.js';
interface PersonaDefinition {
    id: string;
    name: string;
    role: string;
    description: string;
    activationKeywords: string[];
    activationScore: number;
    minThreshold: number;
}
interface ExpertOpinion {
    personaId: string;
    personaName: string;
    score: number;
    confidence: ConfidenceLevel;
    reasoning: string;
    suggestions: string[];
    timestamp: string;
}
interface CollaborationResult {
    consensusConfidence: ConfidenceLevel;
    votes: Record<ConfidenceLevel, number>;
    opinions: ExpertOpinion[];
    summary: string;
    timestamp: string;
}
export declare class PersonaEngine extends EventEmitter {
    private personas;
    private collaborationHistory;
    private maxHistory;
    constructor();
    /**
     * 初始化 4 个默认专家 Persona
     */
    private initializeDefaultPersonas;
    /**
     * 注册自定义 Persona
     */
    registerPersona(definition: Omit<PersonaDefinition, 'activationScore'>): void;
    /**
     * 激活 Persona（基于关键词匹配）
     * 返回所有被激活的 Persona
     */
    activateByKeywords(text: string): PersonaDefinition[];
    /**
     * 运行协作推理流水线
     *
     * 流程：
     * 1. 关键词激活 → 2. 各专家分别评估 → 3. 综合投票 → 4. Integrator 决策
     */
    collaborate(input: MemoryRepresentation): Promise<CollaborationResult>;
    /**
     * 获取 Persona 列表
     */
    getPersonas(): PersonaDefinition[];
    /**
     * 获取协作历史
     */
    getHistory(limit?: number): CollaborationResult[];
    /**
     * 重置所有 Persona 激活度
     */
    resetActivation(): void;
    /**
     * 单个专家对输入进行评估
     */
    private getExpertOpinion;
    private architectEvaluate;
    private architectConfidence;
    private reviewerEvaluate;
    private reviewerConfidence;
    private criticEvaluate;
    private criticConfidence;
    private integratorEvaluate;
    private integratorConfidence;
}
export declare const personaEngine: PersonaEngine;
export {};
//# sourceMappingURL=persona-engine.d.ts.map