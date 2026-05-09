/**
 * Multi-Claw Memory Plugins - Core Types
 * 跨智能体记忆管理系统的核心类型定义
 */
export type RepoType = 'main' | 'business' | 'code' | 'private';
export type AccessLevel = 'PRIVATE' | 'AGENT_LOCAL' | 'SHARED' | 'SHARED_WRITE';
export type ConfidenceLevel = 'CONFIRMED' | 'LIKELY' | 'UNCERTAIN';
export type MemoryType = 'fact' | 'context' | 'decision' | 'assumption' | 'preference';
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
    confidence?: ConfidenceLevel;
    confidenceUpdated?: string;
    confidenceChain?: ConfidenceChainEntry[];
    factSource?: string;
    traceabilityId?: string;
    residualQueue?: boolean;
    residualSize?: number;
    ageWeight?: number;
    memoryType?: MemoryType;
    accessCount?: number;
    lastAccessTime?: string;
}
export interface ConfidenceChainEntry {
    level: ConfidenceLevel;
    source: string;
    factSource: string;
    updatedAt: string;
    previousLevel?: ConfidenceLevel;
    reason?: string;
}
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
export type ConflictType = 'modify-modify' | 'delete-modify' | 'add-add';
export type Resolution = 'local' | 'remote' | 'merged' | 'pending';
export interface Conflict {
    filePath: string;
    localSHA: string;
    remoteSHA: string;
    conflictType: ConflictType;
    resolution?: Resolution;
    resolvedAt?: string;
    resolvedBy?: string;
}
export interface SyncResult {
    success: boolean;
    repoType: string;
    pulled: number;
    pushed: number;
    conflicts: Conflict[];
    errors: string[];
}
export interface RepoConfig {
    url: string;
    localPath: string;
    type: RepoType;
    defaultBranch: string;
}
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
export type MemoryEventType = 'memory.created' | 'memory.updated' | 'memory.deleted' | 'memory.synced' | 'conflict.detected' | 'conflict.resolved' | 'agent.online' | 'agent.offline';
export interface MemoryEvent {
    type: MemoryEventType;
    agentId: string;
    repoType: RepoType;
    payload: Record<string, unknown>;
    timestamp: string;
}
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
export interface SearchResult {
    document: MemoryDocument;
    score: number;
    highlights: string[];
}
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
export interface GitOptions {
    author?: string;
    email?: string;
    message?: string;
    force?: boolean;
}
export type AgentRole = 'system2' | 'system1' | 'full_client' | 'full_server';
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
export interface AgentStatus {
    agentId: string;
    role: AgentRole;
    status: 'idle' | 'processing' | 'error';
    processedCount: number;
    errorCount: number;
    lastProcessedAt?: string;
    errorMessage?: string;
}
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
export interface ResidualInfo {
    size: number;
    ageWeight: number;
    residualScore: number;
    lastCheckAt: string;
    cleanupLayer: 1 | 2 | 3;
    resolutionAttempts: number;
}
export interface ConfidenceMetadata {
    currentLevel: ConfidenceLevel;
    updatedAt: string;
    updatedBy: string;
    chain: ConfidenceChainEntry[];
    conflictDetected: boolean;
    conflictReason?: string;
    resolutionStrategy?: 'replace' | 'keep_both' | 'ignore';
}
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
export interface RouteDecision {
    decisionId: string;
    query: string;
    strategy: 'direct' | 'parallel' | 'iterative';
    targetAgents: string[];
    reason: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export interface CleanupRecord {
    factId: string;
    resolvedAt: string;
    resolutionType: 'active' | 'passive' | 'forced';
    fromLayer: 1 | 2 | 3;
    success: boolean;
    note?: string;
}
//# sourceMappingURL=types.d.ts.map