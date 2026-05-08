/**
 * Git Sync Manager - 多仓库 Git 同步管理
 */
import { DefaultLogFields } from 'simple-git';
import { EventEmitter } from 'eventemitter3';
import { SyncResult, RepoConfig, GitOptions } from './types.js';
export declare class GitSyncManager extends EventEmitter {
    private repos;
    private gits;
    constructor();
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
     * 提交记忆变更
     */
    commitMemory(repoType: string, message: string, files: string[], options?: GitOptions): Promise<void>;
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
export declare const gitSyncManager: GitSyncManager;
//# sourceMappingURL=git-sync.d.ts.map