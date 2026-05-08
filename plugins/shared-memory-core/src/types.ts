/**
 * Multi-Claw Memory Plugins - Core Types
 * 跨智能体记忆管理系统的核心类型定义
 */

// 仓库类型
export type RepoType = 'main' | 'business' | 'code' | 'private';

// 访问级别
export type AccessLevel = 'PRIVATE' | 'AGENT_LOCAL' | 'SHARED' | 'SHARED_WRITE';

// 置信度等级
export type ConfidenceLevel = 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN';

// 记忆类型分类
export type MemoryType = 'fact' | 'context' | 'decision' | 'assumption' | 'preference';

// 记忆文档
export interface MemoryDocument {
  id: string;
  title: string;
  content: string;
  repoType: RepoType;
  category: string;
  tags: string[];
  accessLevel: AccessLevel;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  parentId?: string;
  relatedDocs?: string[];
  projectId?: string;
  signature?: string;

  // v9 新增：置信度传播
  confidence?: ConfidenceLevel;
  confidenceUpdated?: string;
  confidenceChain?: ConfidenceChainEntry[];

  // v9 新增：溯源
  factSource?: string;
  traceabilityId?: string;

  // v9 新增：残差管理
  residualQueue?: boolean;
  residualSize?: number;
  ageWeight?: number;

  // v9 新增：记忆元数据
  memoryType?: MemoryType;
  accessCount?: number;
  lastAccessTime?: string;
}

// 置信度链条目
export interface ConfidenceChainEntry {
  level: ConfidenceLevel;
  source: string;
  factSource: string;
  updatedAt: string;
  previousLevel?: ConfidenceLevel;
  reason?: string;
}

// 同步状态
export interface SyncState {
  repoType: string;
  branch: string;
  lastSyncAt: string;
  lastSyncCommit: string;
  pendingChanges: number;
  conflicts: Conflict[];
  status: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

// 冲突类型
export type ConflictType = 'modify-modify' | 'delete-modify' | 'add-add';
export type Resolution = 'local' | 'remote' | 'merged' | 'pending';

// 冲突
export interface Conflict {
  filePath: string;
  localSHA: string;
  remoteSHA: string;
  conflictType: ConflictType;
  resolution?: Resolution;
  resolvedAt?: string;
  resolvedBy?: string;
}

// 同步结果
export interface SyncResult {
  success: boolean;
  repoType: string;
  pulled: number;
  pushed: number;
  conflicts: Conflict[];
  errors: string[];
}

// 仓库配置
export interface RepoConfig {
  url: string;
  localPath: string;
  type: RepoType;
  defaultBranch: string;
}

// 智能体信息
export interface AgentInfo {
  agentId: string;
  agentType: 'openclaw' | 'hermes' | 'claude-code' | 'opencode' | 'other';
  displayName: string;
  priority: number;
  capabilities: string[];
  memoryRepoUrl: string;
  lastActiveAt: string;
  status: 'online' | 'offline' | 'syncing';
}

// 事件类型
export type MemoryEventType =
  | 'memory.created'
  | 'memory.updated'
  | 'memory.deleted'
  | 'memory.synced'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'agent.online'
  | 'agent.offline';

// 记忆事件
export interface MemoryEvent {
  type: MemoryEventType;
  agentId: string;
  repoType: RepoType;
  payload: Record<string, unknown>;
  timestamp: string;
}

// 搜索查询
export interface SearchQuery {
  text: string;
  repoTypes?: RepoType[];
  tags?: string[];
  author?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  limit?: number;
  offset?: number;
}

// 搜索结果
export interface SearchResult {
  document: MemoryDocument;
  score: number;
  highlights: string[];
}

// 记忆插件配置
export interface MemoryPluginConfig {
  mainRepoUrl: string;
  businessRepoUrl: string;
  codeRepoUrl: string;
  privateRepoUrl?: string;
  syncInterval: number;
  syncStrategy: 'rebase' | 'merge';
  conflictResolution: 'timestamp' | 'priority' | 'manual';
  agentId: string;
  agentType: AgentInfo['agentType'];
}

// Git 操作选项
export interface GitOptions {
  author?: string;
  email?: string;
  message?: string;
  force?: boolean;
}

// ============================================================
// v9 新增类型：三代理架构
// ============================================================

// 代理角色
export type AgentRole = 'system2' | 'system1' | 'full_client' | 'full_server';

// 代理接口
export interface AgentInterface {
  agentId: string;
  role: AgentRole;
  agentType: AgentInfo['agentType'];
  status: 'idle' | 'processing' | 'error';
  startProcessing(input: MemoryRepresentation): Promise<void>;
  getResult(): Promise<MemoryRepresentation>;
  getStatus(): AgentStatus;
  shutdown(): Promise<void>;
}

// 代理状态
export interface AgentStatus {
  agentId: string;
  role: AgentRole;
  status: 'idle' | 'processing' | 'error';
  processedCount: number;
  errorCount: number;
  lastProcessedAt?: string;
  errorMessage?: string;
}

// 记忆表示（代理间传递的中间数据结构）
export interface MemoryRepresentation {
  id: string;
  rawContent?: string;
  refinedContent?: string;
  facts: FactPoint[];
  confidence: ConfidenceLevel;
  source: 'conversation' | 'document' | 'inference' | 'agent';
  timestamp: string;
  metadata?: Record<string, unknown>;
  residualInfo?: ResidualInfo;
}

// 事实点
export interface FactPoint {
  id: string;
  content: string;
  confidence: ConfidenceLevel;
  source: string;
  category: string;
  verified: boolean;
  verifiedAt?: string;
  contradictions?: string[];
  traceabilityId?: string;
}

// 残差信息
export interface ResidualInfo {
  size: number;
  ageWeight: number;
  residualScore: number;
  lastCheckAt: string;
  cleanupLayer: 1 | 2 | 3;
  resolutionAttempts: number;
}

// 置信度元数据
export interface ConfidenceMetadata {
  currentLevel: ConfidenceLevel;
  updatedAt: string;
  updatedBy: string;
  chain: ConfidenceChainEntry[];
  conflictDetected: boolean;
  conflictReason?: string;
  resolutionStrategy?: 'replace' | 'keep_both' | 'ignore';
}

// 代理间通信消息
export interface AgentMessage {
  messageId: string;
  from: string;
  to: string;
  type: 'handoff' | 'query' | 'response' | 'broadcast' | 'heartbeat';
  priority: 'high' | 'normal' | 'low';
  payload: Record<string, unknown>;
  timestamp: string;
  requiresAck: boolean;
  ackReceived?: boolean;
  ttl?: number;
}

// 查询消息
export interface QueryMessage extends AgentMessage {
  type: 'query';
  payload: {
    query: string;
    targetRepo?: RepoType;
    maxResults?: number;
    strategy?: 'direct' | 'parallel' | 'iterative';
    context?: Record<string, unknown>;
  };
}

// 路由决策
export interface RouteDecision {
  decisionId: string;
  query: string;
  strategy: 'direct' | 'parallel' | 'iterative';
  targetAgents: string[];
  reason: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// 残留清理记录
export interface CleanupRecord {
  factId: string;
  resolvedAt: string;
  resolutionType: 'active' | 'passive' | 'forced';
  fromLayer: 1 | 2 | 3;
  success: boolean;
  note?: string;
}
