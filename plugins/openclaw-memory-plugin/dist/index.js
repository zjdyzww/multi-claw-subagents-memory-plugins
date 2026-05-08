/**
 * OpenClaw Memory Plugin
 * OpenClaw 智能体记忆管理插件
 */
import { gitSyncManager, indexEngine, eventBus } from '@multi-claw/shared-memory-core';
// 工具函数：保存记忆
export async function saveMemory(params) {
    try {
        const { repo, path, content, title, tags, access = 'SHARED', author } = params;
        // 构建完整文件路径
        const repoPath = getRepoPath(repo);
        const fullPath = `${repoPath}/${path}`;
        // 构建 frontmatter
        const frontmatter = buildFrontmatter({
            title: title || path.split('/').pop() || 'Untitled',
            tags: tags || [],
            accessLevel: access,
            author: author || 'OpenClaw Agent',
            category: getCategoryFromPath(path)
        });
        const fileContent = `${frontmatter}\n${content}`;
        // 写入文件
        const fs = await import('fs');
        fs.mkdirSync(repoPath, { recursive: true });
        fs.writeFileSync(fullPath, fileContent, 'utf-8');
        // 索引文档
        await indexEngine.indexDocument(repo, fullPath);
        // 发布事件
        const docId = generateId(fullPath);
        eventBus.publishMemoryCreated('openclaw', repo, docId, fullPath);
        return { success: true, id: docId };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
// 工具函数：加载记忆
export async function loadMemory(params) {
    try {
        const { repo, path } = params;
        const repoPath = getRepoPath(repo);
        const fullPath = `${repoPath}/${path}`;
        const fs = await import('fs');
        if (!fs.existsSync(fullPath)) {
            return { success: false, error: 'File not found' };
        }
        const content = fs.readFileSync(fullPath, 'utf-8');
        const matter = await import('gray-matter');
        const parsed = matter.default(content);
        return {
            success: true,
            content: parsed.content,
            metadata: {
                title: parsed.data.title,
                tags: parsed.data.tags,
                author: parsed.data.author,
                createdAt: parsed.data.createdAt,
                updatedAt: parsed.data.updatedAt
            }
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
// 工具函数：搜索记忆
export async function searchMemory(params) {
    try {
        const { query, repos, tags, limit = 10 } = params;
        const searchQuery = {
            text: query,
            repoTypes: repos,
            tags,
            limit
        };
        const results = await indexEngine.searchMemory(searchQuery);
        return {
            success: true,
            results: results.map(r => ({
                path: r.document.id,
                repo: r.document.repoType,
                score: r.score,
                preview: r.highlights.join('; ')
            }))
        };
    }
    catch (error) {
        return { success: false, error: String(error) };
    }
}
// 工具函数：同步记忆
export async function syncMemory(params) {
    const repos = params?.repos || ['main', 'business', 'code', 'private'];
    const results = [];
    const errors = [];
    for (const repo of repos) {
        try {
            const result = await gitSyncManager.syncRepo(repo, {
                message: params?.message
            });
            results.push(result);
            if (result.success) {
                eventBus.publishMemorySynced('openclaw', repo, {
                    success: true,
                    pulled: result.pulled,
                    pushed: result.pushed
                });
            }
            else {
                errors.push(...result.errors);
            }
        }
        catch (error) {
            errors.push(`Sync failed for ${repo}: ${String(error)}`);
        }
    }
    return { success: errors.length === 0, results, errors };
}
// 工具函数：获取状态
export async function getMemoryStatus() {
    const repos = [];
    for (const repoType of ['main', 'business', 'code', 'private']) {
        try {
            const status = await gitSyncManager.getRepoStatus(repoType);
            repos.push({
                type: repoType,
                status: status.clean ? 'clean' : 'pending',
                pendingChanges: status.modified.length + status.staged.length,
                lastSync: new Date().toISOString()
            });
        }
        catch {
            repos.push({
                type: repoType,
                status: 'error',
                pendingChanges: 0,
                lastSync: 'never'
            });
        }
    }
    return { repos };
}
// 辅助函数
function getRepoPath(repo) {
    const basePath = process.env.MEMORY_LOCAL_PATH || '~/.openclaw/memory';
    const expandedPath = basePath.replace(/^~/, require('os').homedir());
    const paths = {
        main: `${expandedPath}/main-memory-shared`,
        business: `${expandedPath}/business-memory-shared`,
        code: `${expandedPath}/code-memory-shared`,
        private: `${expandedPath}/openclaw-memory-private`
    };
    return paths[repo];
}
function buildFrontmatter(data) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
            lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
        }
        else if (typeof value === 'string') {
            lines.push(`${key}: "${value}"`);
        }
        else {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('---');
    return lines.join('\n');
}
function getCategoryFromPath(path) {
    const parts = path.split('/');
    return parts.length > 1 ? parts[0] : 'general';
}
function generateId(path) {
    const hash = path.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash).toString(36);
}
// 插件注册函数
export function registerOpenClawMemoryPlugin(api) {
    // 注册工具
    api.registerTool('memory_save', saveMemory);
    api.registerTool('memory_load', loadMemory);
    api.registerTool('memory_search', searchMemory);
    api.registerTool('memory_sync', syncMemory);
    api.registerTool('memory_status', getMemoryStatus);
    // 注册技能
    api.registerSkill({
        name: 'openclaw-memory',
        description: 'OpenClaw 智能体记忆管理技能'
    });
}
export default {
    register: registerOpenClawMemoryPlugin
};
//# sourceMappingURL=index.js.map