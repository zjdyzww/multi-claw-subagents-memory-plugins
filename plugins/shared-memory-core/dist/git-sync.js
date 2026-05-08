/**
 * Git Sync Manager - 多仓库 Git 同步管理
 */
import simpleGit from 'simple-git';
import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs';
import * as path from 'path';
export class GitSyncManager extends EventEmitter {
    repos = new Map();
    gits = new Map();
    constructor() {
        super();
    }
    /**
     * 注册仓库
     */
    registerRepo(config) {
        this.repos.set(config.type, config);
        const git = simpleGit(config.localPath);
        this.gits.set(config.type, git);
        // 配置 git 用户信息
        if (fs.existsSync(config.localPath)) {
            git.addConfig('user.email', 'multi-claw@memory.system', false, 'local');
            git.addConfig('user.name', 'Multi-Claw Memory System', false, 'local');
        }
    }
    /**
     * 初始化仓库（克隆或打开已存在的仓库）
     */
    async initRepo(config) {
        const localPath = config.localPath;
        // 确保父目录存在
        const parentDir = path.dirname(localPath);
        if (!fs.existsSync(parentDir)) {
            fs.mkdirSync(parentDir, { recursive: true });
        }
        if (fs.existsSync(path.join(localPath, '.git'))) {
            // 仓库已存在，打开它
            const git = simpleGit(localPath);
            this.gits.set(config.type, git);
            this.repos.set(config.type, config);
            await git.fetch('origin');
        }
        else {
            // 克隆新仓库
            const git = simpleGit(parentDir);
            await git.clone(config.url, path.basename(localPath));
            const clonedGit = simpleGit(localPath);
            this.gits.set(config.type, clonedGit);
            this.repos.set(config.type, config);
            // 配置用户信息
            clonedGit.addConfig('user.email', 'multi-claw@memory.system', false, 'local');
            clonedGit.addConfig('user.name', 'Multi-Claw Memory System', false, 'local');
        }
    }
    /**
     * 同步仓库（pull + push）
     */
    async syncRepo(repoType, options = {}) {
        const git = this.gits.get(repoType);
        const config = this.repos.get(repoType);
        if (!git || !config) {
            return {
                success: false,
                repoType,
                pulled: 0,
                pushed: 0,
                conflicts: [],
                errors: [`Repository ${repoType} not found`]
            };
        }
        const result = {
            success: true,
            repoType,
            pulled: 0,
            pushed: 0,
            conflicts: [],
            errors: []
        };
        try {
            // 获取远程更新
            await git.fetch('origin');
            // 检查本地是否有变更
            const status = await git.status();
            if (status.detached) {
                result.errors.push('Detached HEAD state, cannot sync');
                result.success = false;
                return result;
            }
            // 检查是否有冲突需要解决
            if (status.conflicted.length > 0) {
                const conflicts = status.conflicted.map(file => ({
                    filePath: file,
                    localSHA: '',
                    remoteSHA: '',
                    conflictType: 'modify-modify',
                    resolution: 'pending'
                }));
                result.conflicts = conflicts;
                this.emit('conflicts', conflicts);
            }
            // Pull 并处理冲突
            if (status.tracking) {
                try {
                    const pullResult = await git.pull('origin', config.defaultBranch, {
                        '--rebase': options.force ? 'false' : 'true'
                    });
                    result.pulled = pullResult.files.length;
                }
                catch (pullError) {
                    const errorMsg = pullError instanceof Error ? pullError.message : String(pullError);
                    if (errorMsg.includes('CONFLICT')) {
                        // 冲突已被检测
                        result.conflicts = status.conflicted.map(file => ({
                            filePath: file,
                            localSHA: '',
                            remoteSHA: '',
                            conflictType: 'modify-modify',
                            resolution: 'pending'
                        }));
                    }
                    else {
                        result.errors.push(`Pull failed: ${errorMsg}`);
                    }
                }
            }
            // 添加所有变更
            await git.add('.');
            // 检查是否有需要提交的内容
            const updatedStatus = await git.status();
            if (updatedStatus.files.length > 0) {
                const message = options.message || `Sync memory: ${new Date().toISOString()}`;
                await git.commit(message, undefined, {
                    '--author': options.author ? `${options.author} <${options.email || 'multi-claw@memory.system'}>` : undefined
                });
                result.pushed = 1;
            }
            // 推送到远程
            try {
                await git.push('origin', config.defaultBranch);
            }
            catch (pushError) {
                const errorMsg = pushError instanceof Error ? pushError.message : String(pushError);
                result.errors.push(`Push failed: ${errorMsg}`);
                result.success = false;
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            result.errors.push(errorMsg);
            result.success = false;
        }
        this.emit('syncComplete', result);
        return result;
    }
    /**
     * 提交记忆变更
     */
    async commitMemory(repoType, message, files, options = {}) {
        const git = this.gits.get(repoType);
        if (!git) {
            throw new Error(`Repository ${repoType} not found`);
        }
        // 添加指定文件
        for (const file of files) {
            await git.add(file);
        }
        // 提交
        await git.commit(message, undefined, {
            '--author': options.author ? `${options.author} <${options.email || 'multi-claw@memory.system'}>` : undefined
        });
    }
    /**
     * 获取仓库状态
     */
    async getRepoStatus(repoType) {
        const git = this.gits.get(repoType);
        if (!git) {
            throw new Error(`Repository ${repoType} not found`);
        }
        const status = await git.status();
        return {
            ahead: status.ahead,
            behind: status.behind,
            conflicted: status.conflicted,
            modified: status.modified,
            staged: status.staged,
            clean: status.isClean()
        };
    }
    /**
     * 获取最近的提交记录
     */
    async getRecentCommits(repoType, limit = 10) {
        const git = this.gits.get(repoType);
        if (!git) {
            throw new Error(`Repository ${repoType} not found`);
        }
        const config = this.repos.get(repoType);
        const logs = await git.log({ maxCount: limit });
        return logs.all;
    }
    /**
     * 解决冲突
     */
    async resolveConflicts(repoType, conflicts) {
        const git = this.gits.get(repoType);
        if (!git) {
            throw new Error(`Repository ${repoType} not found`);
        }
        for (const conflict of conflicts) {
            if (conflict.resolution === 'local') {
                await git.checkout(['--ours', conflict.file]);
            }
            else if (conflict.resolution === 'remote') {
                await git.checkout(['--theirs', conflict.file]);
            }
            // 对于 merged，用户需要手动编辑
            await git.add(conflict.file);
        }
    }
    /**
     * 获取仓库列表
     */
    getRegisteredRepos() {
        return Array.from(this.repos.values());
    }
}
// 导出单例
export const gitSyncManager = new GitSyncManager();
//# sourceMappingURL=git-sync.js.map