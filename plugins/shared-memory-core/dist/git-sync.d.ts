/**
 * Git Sync Manager - 多仓库 Git 同步管理
 */
import { DefaultLogFields } from 'simple-git';
import { EventEmitter } from 'eventemitter3';
import { SyncResult, RepoConfig, GitOptions, MemoryType, ConfidenceLevel } from './types.js';
export interface CommitContext {
    confidence?: ConfidenceLevel;
    source?: string;
    memoryType?: MemoryType;
    traceabilityId?: string;
    agentId?: string;
    agentType?: string;
    factCount?: number;
}
export declare class GitSyncManager extends EventEmitter {
    private repos;
    private gits;
    private syncTimeouts;
    private syncIntervals;
    private scheduledSyncTimes;
    constructor();
    /**
     * 启动定时同步（C4 原则: 10:00 + 22:00 + 重大变更立即）
     */
    startScheduledSync(customTimes?: string[]): void;
    stopScheduledSync(): void;
    private syncAllRepos;
    /**
     * 注册仓库
     */
    registerRepo(config: RepoConfig): void;
    /**
     * 初始化仓库（克隆或打开已存在的仓库）
     */
    initRepo(config: RepoConfig): Promise<void>;
    /**
     * 同步仓库（pull + push）
     */
    syncRepo(repoType: string, options?: GitOptions): Promise<SyncResult>;
    /**
     * 提交记忆变更（v11：带结构化上下文）
     */
    commitMemory(repoType: string, message: string, files: string[], options?: GitOptions, context?: CommitContext): Promise<string>;
    /**
     * 获取仓库状态
     */
    getRepoStatus(repoType: string): Promise<{
        ahead: number;
        behind: number;
        conflicted: string[];
        modified: string[];
        staged: string[];
        clean: boolean;
    }>;
    /**
     * 获取最近的提交记录
     */
    getRecentCommits(repoType: string, limit?: number): Promise<(DefaultLogFields & {
        diff?: unknown;
    })[]>;
    /**
     * 解决冲突
     */
    resolveConflicts(repoType: string, conflicts: Array<{
        file: string;
        resolution: 'local' | 'remote' | 'merged';
    }>): Promise<void>;
    /**
     * 获取仓库列表
     */
    getRegisteredRepos(): RepoConfig[];
}
/**
 * 构建结构化 commit 消息
 * 格式：`[confidence][source][memoryType] summary`
 */
export declare function buildStructuredMessage(summary: string, options?: {
    author?: string;
    email?: string;
}): string;
/**
 * 构建完整结构化 commit 消息（含上下文元数据）
 * 格式：
 *   [CONFIRMED][openclaw][fact] summary
 *
 *   traceabilityId: xxx-xxx
 *   Agent: openclaw-agent
 *   Facts: 5
 *   Author: OpenClaw Agent <openclaw@memory.system>
 */
export declare function buildStructuredMessageWithContext(message: string, context?: CommitContext, options?: {
    author?: string;
    email?: string;
}): string;
/**
 * 根据代理类型获取对应的 commit 签名字符串
 */
export declare function getAgentAuthor(agentType?: string): string;
export declare const gitSyncManager: GitSyncManager;
//# sourceMappingURL=git-sync.d.ts.map