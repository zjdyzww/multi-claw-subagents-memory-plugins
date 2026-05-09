/**
 * OpenClaw Memory Plugin
 * OpenClaw 智能体记忆管理插件
 */
import type { RepoType, MemoryDocument, SyncResult, ConfidenceLevel } from '@multi-claw/shared-memory-core';
export declare function saveMemory(params: {
    repo: RepoType;
    path: string;
    content: string;
    title?: string;
    tags?: string[];
    access?: 'SHARED' | 'PRIVATE';
    author?: string;
}): Promise<{
    success: boolean;
    id?: string;
    error?: string;
}>;
export declare function loadMemory(params: {
    repo: RepoType;
    path: string;
}): Promise<{
    success: boolean;
    content?: string;
    metadata?: Partial<MemoryDocument>;
    error?: string;
}>;
export declare function searchMemory(params: {
    query: string;
    repos?: RepoType[];
    tags?: string[];
    limit?: number;
}): Promise<{
    success: boolean;
    results?: Array<{
        path: string;
        repo: string;
        score: number;
        preview: string;
    }>;
    error?: string;
}>;
export declare function syncMemory(params?: {
    repos?: RepoType[];
    direction?: 'pull' | 'push' | 'both';
    message?: string;
}): Promise<{
    success: boolean;
    results?: SyncResult[];
    errors?: string[];
}>;
export declare function getMemoryStatus(): Promise<{
    repos: Array<{
        type: RepoType;
        status: string;
        pendingChanges: number;
        lastSync: string;
    }>;
}>;
export declare function annotateMemory(params: {
    docId: string;
    level: ConfidenceLevel;
    source: string;
    reason?: string;
}): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function routeQuery(params: {
    query: string;
    preferSpeed?: boolean;
    preferAccuracy?: boolean;
}): Promise<{
    success: boolean;
    decision?: {
        strategy: string;
        targetAgents: string[];
        reason: string;
    };
    results?: Array<{
        path: string;
        repo: string;
        score: number;
        preview: string;
    }>;
    error?: string;
}>;
export declare function collaborateMemory(params: {
    content: string;
    facts?: Array<{
        content: string;
        confidence?: ConfidenceLevel;
    }>;
}): Promise<{
    success: boolean;
    consensus?: string;
    votes?: Record<string, number>;
    summary?: string;
    opinions?: Array<{
        persona: string;
        confidence: string;
        reasoning: string;
    }>;
    error?: string;
}>;
export declare function getResidualStatus(): Promise<{
    success: boolean;
    stats?: {
        total: number;
        layer1: number;
        layer2: number;
        layer3: number;
        totalScore: number;
    };
    error?: string;
}>;
export declare function vectorSearch(params: {
    query: string;
    topK?: number;
    repoTypes?: RepoType[];
    filterTags?: string[];
}): Promise<{
    success: boolean;
    results?: Array<{
        id: string;
        score: number;
        title: string;
        preview: string;
    }>;
    stats?: unknown;
    error?: string;
}>;
export declare function fuseMemory(params: {
    docIds: string[];
}): Promise<{
    success: boolean;
    merged?: {
        title: string;
        content: string;
        factCount: number;
        mergedFrom: string[];
    };
    error?: string;
}>;
export declare function assessMemoryQuality(params: {
    docId?: string;
}): Promise<{
    success: boolean;
    report?: {
        title: string;
        score: number;
        completeness: number;
        freshness: number;
        consistency: number;
        confidenceBalance: number;
        issues: Array<{
            type: string;
            severity: string;
            description: string;
        }>;
        recommendations: string[];
    };
    error?: string;
}>;
export declare function registerOpenClawMemoryPlugin(api: {
    registerTool: (name: string, fn: (...args: unknown[]) => unknown) => void;
    registerSkill: (skill: {
        name: string;
        description: string;
    }) => void;
}): void;
declare const _default: {
    register: typeof registerOpenClawMemoryPlugin;
};
export default _default;
//# sourceMappingURL=index.d.ts.map