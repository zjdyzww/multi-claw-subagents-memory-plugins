/**
 * OpenClaw Memory Plugin
 * OpenClaw 智能体记忆管理插件
 */
import type { RepoType, MemoryDocument, SyncResult } from '@multi-claw/shared-memory-core';
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