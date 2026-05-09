/**
 * Access Control - 记忆访问权限管理
 */
import { EventEmitter } from 'eventemitter3';
export class AccessControl extends EventEmitter {
    rules = new Map();
    agents = new Map();
    // 默认优先级（数字越大优先级越高）
    agentPriority = {
        'openclaw': 100,
        'hermes': 80,
        'claude-code': 60,
        'opencode': 60,
        'default': 50
    };
    constructor() {
        super();
        this.initializeDefaultRules();
    }
    /**
     * 初始化默认规则
     */
    initializeDefaultRules() {
        // 公共主仓规则 - 所有智能体可读写
        this.rules.set('main', {
            repoType: 'main',
            accessLevel: 'SHARED_WRITE',
            allowedAgents: ['*'],
            deniedAgents: []
        });
        // 业务子仓规则 - 所有智能体可读写
        this.rules.set('business', {
            repoType: 'business',
            accessLevel: 'SHARED_WRITE',
            allowedAgents: ['*'],
            deniedAgents: []
        });
        // 代码子仓规则 - 所有智能体可读写
        this.rules.set('code', {
            repoType: 'code',
            accessLevel: 'SHARED_WRITE',
            allowedAgents: ['*'],
            deniedAgents: []
        });
        // 私有仓规则 - 仅注册的智能体所有者可访问，拒绝跨网关访问
        this.rules.set('private', {
            repoType: 'private',
            accessLevel: 'PRIVATE',
            allowedAgents: [],
            deniedAgents: ['*']
        });
    }
    /**
     * 注册智能体
     */
    registerAgent(agent) {
        this.agents.set(agent.agentId, agent);
        this.emit('agentRegistered', agent);
    }
    /**
     * 注销智能体
     */
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.emit('agentUnregistered', { agentId });
    }
    /**
     * 获取智能体信息
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * 设置自定义规则
     */
    setRule(key, rule) {
        this.rules.set(key, rule);
        this.emit('ruleChanged', { key, rule });
    }
    /**
     * 检查访问权限
     */
    checkAccess(agentId, repoType, requiredLevel = 'SHARED') {
        const agent = this.agents.get(agentId);
        const rule = this.rules.get(repoType);
        // 获取智能体的实际访问级别
        const actualLevel = this.getAgentAccessLevel(agentId, repoType);
        // 私有仓强校验：agentId 必须包含 agentType
        if (repoType === 'private') {
            if (!agent || !agentId.includes(agent.agentType)) {
                return {
                    allowed: false,
                    reason: `Agent ${agentId} is not the owner of this private repository`,
                    requiredLevel,
                    actualLevel: 'PRIVATE'
                };
            }
            return {
                allowed: true,
                reason: `Access granted as private repo owner with level ${actualLevel}`,
                requiredLevel,
                actualLevel
            };
        }
        // 检查规则
        if (!rule) {
            return {
                allowed: false,
                reason: `No rule defined for repository type: ${repoType}`,
                requiredLevel,
                actualLevel
            };
        }
        // 检查是否在拒绝列表中
        if (rule.deniedAgents.includes(agentId) || rule.deniedAgents.includes('*')) {
            return {
                allowed: false,
                reason: `Agent ${agentId} is explicitly denied access`,
                requiredLevel,
                actualLevel
            };
        }
        // 检查是否在允许列表中
        if (!rule.allowedAgents.includes(agentId) && !rule.allowedAgents.includes('*')) {
            return {
                allowed: false,
                reason: `Agent ${agentId} is not in the allowed list`,
                requiredLevel,
                actualLevel
            };
        }
        // 检查访问级别是否满足要求
        const levelHierarchy = ['PRIVATE', 'AGENT_LOCAL', 'SHARED', 'SHARED_WRITE'];
        const actualIndex = levelHierarchy.indexOf(actualLevel);
        const requiredIndex = levelHierarchy.indexOf(requiredLevel);
        if (actualIndex >= requiredIndex) {
            return {
                allowed: true,
                reason: `Access granted with level ${actualLevel}`,
                requiredLevel,
                actualLevel
            };
        }
        return {
            allowed: false,
            reason: `Insufficient access level: ${actualLevel} < ${requiredLevel}`,
            requiredLevel,
            actualLevel
        };
    }
    /**
     * 获取智能体对特定仓库的访问级别
     */
    getAgentAccessLevel(agentId, repoType) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return 'PRIVATE'; // 默认最低级别
        }
        // 私有仓库：仅所有者可访问（agentId 必须匹配 agentType）
        if (repoType === 'private') {
            if (agentId.includes(agent.agentType)) {
                return 'PRIVATE';
            }
            // 非所有者尝试访问私有仓 → 拒绝
            return 'PRIVATE';
        }
        // 公共仓库：根据智能体类型决定
        if (agent.agentType === 'openclaw' || agent.agentType === 'hermes' ||
            agent.agentType === 'claude-code' || agent.agentType === 'opencode') {
            return 'SHARED_WRITE';
        }
        return 'SHARED';
    }
    /**
     * 获取智能体优先级
     */
    getAgentPriority(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            return this.agentPriority[agent.agentType] || this.agentPriority['default'];
        }
        return this.agentPriority['default'];
    }
    /**
     * 添加访问规则
     */
    addAccessRule(key, rule) {
        this.rules.set(key, rule);
        this.emit('accessRuleAdded', { key, rule });
    }
    /**
     * 移除访问规则
     */
    removeAccessRule(key) {
        this.rules.delete(key);
        this.emit('accessRuleRemoved', { key });
    }
    /**
     * 获取所有规则
     */
    getAllRules() {
        return new Map(this.rules);
    }
    /**
     * 获取所有已注册智能体
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * 审计日志 - 记录访问尝试
     */
    auditAccess(decision, agentId, repoType) {
        this.emit('accessAudit', {
            decision,
            agentId,
            repoType,
            timestamp: new Date().toISOString()
        });
    }
}
// 导出单例
export const accessControl = new AccessControl();
//# sourceMappingURL=access-control.js.map