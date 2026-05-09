/**
 * Git Sync Manager - 多仓库 Git 同步管理
 */
import simpleGit from 'simple-git';
import { EventEmitter } from 'eventemitter3';
import * as fs from 'fs';
import * as path from 'path';
// Agent author mapping
const AGENT_AUTHORS = {
    'openclaw': 'OpenClaw Agent <openclaw@memory.system>',
    'hermes': 'Hermes Agent <hermes@memory.system>',
    'claude-code': 'Claude Code Agent <claude-code@memory.system>',
    'opencode': 'OpenCode Agent <opencode@memory.system>',
    'default': 'Multi-Claw Memory System <multi-claw@memory.system>',
};
export class GitSyncManager extends EventEmitter {
    repos = new Map();
    gits = new Map();
    syncTimers = [];
    scheduledSyncTimes = ['10:00', '22:00'];
    constructor() {
        super();
    }
    /**
     * 启动定时同步（C4 原则: 10:00 + 22:00 + 重大变更立即）
     */
    startScheduledSync(customTimes) {
        const times = customTimes || this.scheduledSyncTimes;
        for (const time of times) {
            const [hour, minute] = time.split(':').map(Number);
            const now = new Date();
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
            // 如果今天的目标时间已过，设为明天
            if (target <= now) {
                target.setDate(target.getDate() + 1);
            }
            const initialDelay = target.getTime() - now.getTime();
            const intervalMs = 24 * 60 * 60 * 1000; // 每天
            // 首次延迟后，每天执行
            const timer = setTimeout(() => {
                this.syncAllRepos();
                const dailyTimer = setInterval(() => this.syncAllRepos(), intervalMs);
                this.syncTimers.push(dailyTimer);
            }, initialDelay);
            this.syncTimers.push(timer);
        }
        this.emit('scheduledSyncStart', { times, nextSyncIn: 'see console for details' });
    }
    stopScheduledSync() {
        for (const timer of this.syncTimers) {
            clearTimeout(timer);
            clearInterval(timer);
        }
        this.syncTimers = [];
        this.emit('scheduledSyncStop', {});
    }
    async syncAllRepos() {
        for (const [repoType] of this.repos) {
            try {
                await this.syncRepo(repoType);
            }
            catch {
                // 单个仓库失败不影响其他
            }
        }
        this.emit('scheduledSyncComplete', { time: new Date().toISOString() });
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
                    const pullOptions = {
                        '--rebase': options.force ? 'false' : 'true'
                    };
                    const pullResult = await git.pull('origin', config.defaultBranch, pullOptions);
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
                const message = buildStructuredMessage(options.message || `Sync memory: ${new Date().toISOString()}`, {
                    author: options.author,
                    email: options.email,
                });
                await git.commit(message);
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
     * 提交记忆变更（v11：带结构化上下文）
     */
    async commitMemory(repoType, message, files, options = {}, context) {
        const git = this.gits.get(repoType);
        if (!git) {
            throw new Error(`Repository ${repoType} not found`);
        }
        // 添加指定文件
        for (const file of files) {
            await git.add(file);
        }
        // 构建结构化提交消息
        const structuredMessage = buildStructuredMessageWithContext(message, context, {
            author: options.author,
            email: options.email,
        });
        const result = await git.commit(structuredMessage);
        const commitSha = result.commit || '';
        this.emit('traceabilityCommit', { repoType, message, context, commitSha });
        return commitSha;
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
                await git.raw(['checkout', '--ours', conflict.file]);
            }
            else if (conflict.resolution === 'remote') {
                await git.raw(['checkout', '--theirs', conflict.file]);
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
// ============================================================
// v11：结构化 Commit 消息构建
// ============================================================
/**
 * 构建结构化 commit 消息
 * 格式：`[confidence][source][memoryType] summary`
 */
export function buildStructuredMessage(summary, options) {
    const authorLine = options?.author
        ? `Author: ${options.author} <${options.email || 'noreply@memory.system'}>`
        : 'Author: Multi-Claw Memory System <multi-claw@memory.system>';
    return `${summary}\n\n${authorLine}`;
}
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
export function buildStructuredMessageWithContext(message, context, options) {
    const parts = [];
    // Prefix: [confidence][source][memoryType]
    const prefixParts = [];
    if (context?.confidence) {
        prefixParts.push(`[${context.confidence}]`);
    }
    if (context?.source) {
        prefixParts.push(`[${context.source}]`);
    }
    if (context?.memoryType) {
        prefixParts.push(`[${context.memoryType}]`);
    }
    const prefix = prefixParts.length > 0 ? prefixParts.join('') + ' ' : '';
    parts.push(`${prefix}${message}`);
    // Body metadata
    const metaLines = [];
    if (context?.traceabilityId) {
        metaLines.push(`traceabilityId: ${context.traceabilityId}`);
    }
    if (context?.agentId) {
        metaLines.push(`Agent: ${context.agentId}`);
    }
    if (context?.factCount && context.factCount > 0) {
        metaLines.push(`Facts: ${context.factCount}`);
    }
    if (metaLines.length > 0) {
        parts.push('');
        parts.push(...metaLines);
    }
    // Author signature
    const agentType = context?.agentType || 'default';
    const author = AGENT_AUTHORS[agentType] || AGENT_AUTHORS['default'];
    const fallbackAuthor = options?.author
        ? `Author: ${options.author} <${options.email || 'noreply@memory.system'}>`
        : undefined;
    parts.push('');
    parts.push(fallbackAuthor || `Author: ${author}`);
    return parts.join('\n');
}
/**
 * 根据代理类型获取对应的 commit 签名字符串
 */
export function getAgentAuthor(agentType) {
    return AGENT_AUTHORS[agentType || 'default'] || AGENT_AUTHORS['default'];
}
// 导出单例
export const gitSyncManager = new GitSyncManager();
//# sourceMappingURL=git-sync.js.map