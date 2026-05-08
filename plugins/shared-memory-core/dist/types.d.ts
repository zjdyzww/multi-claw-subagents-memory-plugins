/**
 * Multi-Claw Memory Plugins - Core Types
 * 跨智能体记忆管理系统的核心类型定义
 */
export type RepoType = 'main' | 'business' | 'code' | 'private';
export type AccessLevel = 'PRIVATE' | 'AGENT_LOCAL' | 'SHARED' | 'SHARED_WRITE';
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
//# sourceMappingURL=types.d.ts.map