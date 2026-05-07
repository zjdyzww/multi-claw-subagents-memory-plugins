/**
 * Access Control - 记忆访问权限管理
 */

import { EventEmitter } from 'eventemitter3';
import { AccessLevel, AgentInfo, RepoType } from './types.js';

// 权限配置
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

// 访问决策
interface AccessDecision {
  allowed: boolean;
  reason: string;
  requiredLevel: AccessLevel;
  actualLevel: AccessLevel;
}

export class AccessControl extends EventEmitter {
  private rules: Map<string, AccessRule> = new Map();
  private agents: Map<string, AgentInfo> = new Map();
  
  // 默认优先级（数字越大优先级越高）
  private agentPriority: Record<string, number> = {
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
  private initializeDefaultRules(): void {
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

    // 私有仓规则 - 仅创建者可访问
    this.rules.set('private', {
      repoType: 'private',
      accessLevel: 'PRIVATE',
      allowedAgents: ['*'],
      deniedAgents: []
    });
  }

  /**
   * 注册智能体
   */
  registerAgent(agent: AgentInfo): void {
    this.agents.set(agent.agentId, agent);
    this.emit('agentRegistered', agent);
  }

  /**
   * 注销智能体
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.emit('agentUnregistered', { agentId });
  }

  /**
   * 获取智能体信息
   */
  getAgent(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 设置自定义规则
   */
  setRule(key: string, rule: AccessRule): void {
    this.rules.set(key, rule);
    this.emit('ruleChanged', { key, rule });
  }

  /**
   * 检查访问权限
   */
  checkAccess(agentId: string, repoType: RepoType, requiredLevel: AccessLevel = 'SHARED'): AccessDecision {
    const agent = this.agents.get(agentId);
    const rule = this.rules.get(repoType);

    // 获取智能体的实际访问级别
    const actualLevel = this.getAgentAccessLevel(agentId, repoType);

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
    const levelHierarchy: AccessLevel[] = ['PRIVATE', 'AGENT_LOCAL', 'SHARED', 'SHARED_WRITE'];
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
  private getAgentAccessLevel(agentId: string, repoType: RepoType): AccessLevel {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return 'PRIVATE'; // 默认最低级别
    }

    // 私有仓库只有创建者或同类型智能体可访问
    if (repoType === 'private') {
      // 检查是否是该智能体的私有仓库
      if (agentId.includes(agent.agentType)) {
        return 'PRIVATE'; // 所有者
      }
      return 'PRIVATE';
    }

    // 公共仓库根据智能体类型决定
    if (agent.agentType === 'openclaw' || agent.agentType === 'hermes' || 
        agent.agentType === 'claude-code' || agent.agentType === 'opencode') {
      return 'SHARED_WRITE';
    }

    return 'SHARED';
  }

  /**
   * 获取智能体优先级
   */
  getAgentPriority(agentId: string): number {
    const agent = this.agents.get(agentId);
    if (agent) {
      return this.agentPriority[agent.agentType] || this.agentPriority['default'];
    }
    return this.agentPriority['default'];
  }

  /**
   * 添加访问规则
   */
  addAccessRule(key: string, rule: AccessRule): void {
    this.rules.set(key, rule);
    this.emit('accessRuleAdded', { key, rule });
  }

  /**
   * 移除访问规则
   */
  removeAccessRule(key: string): void {
    this.rules.delete(key);
    this.emit('accessRuleRemoved', { key });
  }

  /**
   * 获取所有规则
   */
  getAllRules(): Map<string, AccessRule> {
    return new Map(this.rules);
  }

  /**
   * 获取所有已注册智能体
   */
  getAllAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }

  /**
   * 审计日志 - 记录访问尝试
   */
  auditAccess(decision: AccessDecision, agentId: string, repoType: RepoType): void {
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
