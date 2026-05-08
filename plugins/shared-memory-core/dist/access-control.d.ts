/**
 * Access Control - 记忆访问权限管理
 */
import { EventEmitter } from 'eventemitter3';
import { AccessLevel, AgentInfo, RepoType } from './types.js';
interface AccessRule {
    repoType: RepoType | 'all';
    accessLevel: AccessLevel;
    allowedAgents: string[];
    deniedAgents: string[];
    conditions?: AccessCondition[];
}
interface AccessCondition {
    type: 'time_range' | 'ip_whitelist' | 'mfa_required';
    params: Record<string, unknown>;
}
interface AccessDecision {
    allowed: boolean;
    reason: string;
    requiredLevel: AccessLevel;
    actualLevel: AccessLevel;
}
export declare class AccessControl extends EventEmitter {
    private rules;
    private agents;
    private agentPriority;
    constructor();
    /**
     * 初始化默认规则
     */
    private initializeDefaultRules;
    /**
     * 注册智能体
     */
    registerAgent(agent: AgentInfo): void;
    /**
     * 注销智能体
     */
    unregisterAgent(agentId: string): void;
    /**
     * 获取智能体信息
     */
    getAgent(agentId: string): AgentInfo | undefined;
    /**
     * 设置自定义规则
     */
    setRule(key: string, rule: AccessRule): void;
    /**
     * 检查访问权限
     */
    checkAccess(agentId: string, repoType: RepoType, requiredLevel?: AccessLevel): AccessDecision;
    /**
     * 获取智能体对特定仓库的访问级别
     */
    private getAgentAccessLevel;
    /**
     * 获取智能体优先级
     */
    getAgentPriority(agentId: string): number;
    /**
     * 添加访问规则
     */
    addAccessRule(key: string, rule: AccessRule): void;
    /**
     * 移除访问规则
     */
    removeAccessRule(key: string): void;
    /**
     * 获取所有规则
     */
    getAllRules(): Map<string, AccessRule>;
    /**
     * 获取所有已注册智能体
     */
    getAllAgents(): AgentInfo[];
    /**
     * 审计日志 - 记录访问尝试
     */
    auditAccess(decision: AccessDecision, agentId: string, repoType: RepoType): void;
}
export declare const accessControl: AccessControl;
export {};
//# sourceMappingURL=access-control.d.ts.map