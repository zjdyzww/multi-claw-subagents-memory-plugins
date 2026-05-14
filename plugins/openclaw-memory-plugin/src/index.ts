/**
 * OpenClaw Memory Plugin
 * OpenClaw 智能体记忆管理插件
 */

import { gitSyncManager, indexEngine, accessControl, eventBus, routerEngine, confidenceEngine, personaEngine, residualEngine, vectorEngine, fusionEngine, metacognitionEngine, initializeCore } from '@multi-claw/shared-memory-core';
import type { RepoType, MemoryDocument, SearchQuery, SyncResult, ConfidenceLevel, MemoryRepresentation, FactPoint } from '@multi-claw/shared-memory-core';
import { homedir } from 'os';

// 插件配置（匹配 openclaw.plugin.json configSchema）
interface OpenClawMemoryConfig {
  mainRepoUrl: string;
  businessRepoUrl: string;
  codeRepoUrl: string;
  privateRepoUrl: string;
  localPath: string;
  syncInterval: number;
  agentId?: string;
  agentType?: string;
}

let pluginConfig: OpenClawMemoryConfig | null = null;

// 工具函数：保存记忆
export async function saveMemory(params: {
  repo: RepoType;
  path: string;
  content: string;
  title?: string;
  tags?: string[];
  access?: 'SHARED' | 'PRIVATE';
  author?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
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

    // v13.1: 自动 git commit + push (记忆即时同步)
    try {
      await gitSyncManager.commitMemory(repo, `[LIKELY][opencode][auto] save: ${title || path}`, [fullPath], {}, {
        confidence: 'LIKELY',
        source: 'opencode',
        memoryType: 'fact',
        agentId: 'opencode',
        agentType: 'opencode',
      });
      await gitSyncManager.syncRepo(repo);
    } catch { /* sync is best-effort */ }
    
    return { success: true, id: docId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：加载记忆
export async function loadMemory(params: {
  repo: RepoType;
  path: string;
}): Promise<{ success: boolean; content?: string; metadata?: Partial<MemoryDocument>; error?: string }> {
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
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：搜索记忆
export async function searchMemory(params: {
  query: string;
  repos?: RepoType[];
  tags?: string[];
  limit?: number;
}): Promise<{ success: boolean; results?: Array<{ path: string; repo: string; score: number; preview: string }>; error?: string }> {
  try {
    const { query, repos, tags, limit = 10 } = params;
    
    const searchQuery: SearchQuery = {
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
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：同步记忆
export async function syncMemory(params?: {
  repos?: RepoType[];
  direction?: 'pull' | 'push' | 'both';
  message?: string;
}): Promise<{ success: boolean; results?: SyncResult[]; errors?: string[] }> {
  const repos = params?.repos || ['main', 'business', 'code', 'private'];
  const results: SyncResult[] = [];
  const errors: string[] = [];
  
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
      } else {
        errors.push(...result.errors);
      }
    } catch (error) {
      errors.push(`Sync failed for ${repo}: ${String(error)}`);
    }
  }
  
  return { success: errors.length === 0, results, errors };
}

// 工具函数：获取状态
export async function getMemoryStatus(): Promise<{
  repos: Array<{
    type: RepoType;
    status: string;
    pendingChanges: number;
    lastSync: string;
  }>;
}> {
  const repos: Array<{ type: RepoType; status: string; pendingChanges: number; lastSync: string }> = [];
  
  for (const repoType of ['main', 'business', 'code', 'private'] as RepoType[]) {
    try {
      const status = await gitSyncManager.getRepoStatus(repoType);
      repos.push({
        type: repoType,
        status: status.clean ? 'clean' : 'pending',
        pendingChanges: status.modified.length + status.staged.length,
        lastSync: new Date().toISOString()
      });
    } catch {
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

// -------- v10 新增工具 --------

// 工具函数：置信度标注
export async function annotateMemory(params: {
  docId: string;
  level: ConfidenceLevel;
  source: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const indexed = await indexEngine.searchMemory({ text: params.docId, limit: 1 });
    if (indexed.length === 0) {
      return { success: false, error: `Document ${params.docId} not found in index` };
    }

    const doc = indexed[0].document;
    confidenceEngine.annotate(doc, params.level, params.source, 'manual annotation', params.reason);

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：路由查询
export async function routeQuery(params: {
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
  results?: Array<{ path: string; repo: string; score: number; preview: string }>;
  error?: string;
}> {
  try {
    const decision = routerEngine.classifyQuery(params.query, {
      preferSpeed: params.preferSpeed,
      preferAccuracy: params.preferAccuracy,
      availableAgents: ['sys2', 'sys1', 'full_client', 'full_server'],
    });

    const results = await routerEngine.executeQuery(decision, indexEngine, {
      text: params.query,
      limit: decision.strategy === 'parallel' ? 20 : 10,
    });

    return {
      success: true,
      decision: {
        strategy: decision.strategy,
        targetAgents: decision.targetAgents,
        reason: decision.reason,
      },
      results: results.map(r => ({
        path: r.document.id,
        repo: r.document.repoType,
        score: r.score,
        preview: r.highlights.join('; '),
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：专家协作评估
export async function collaborateMemory(params: {
  content: string;
  facts?: Array<{ content: string; confidence?: ConfidenceLevel }>;
}): Promise<{
  success: boolean;
  consensus?: string;
  votes?: Record<string, number>;
  summary?: string;
  opinions?: Array<{ persona: string; confidence: string; reasoning: string }>;
  error?: string;
}> {
  try {
    const facts: FactPoint[] = (params.facts || []).map((f, i) => ({
      id: `collab-f${i}`,
      content: f.content,
      confidence: f.confidence || 'UNCERTAIN',
      source: 'user',
      category: 'collaboration',
      verified: false,
    }));

    const input: MemoryRepresentation = {
      id: `collab-${Date.now()}`,
      rawContent: params.content,
      facts,
      confidence: 'UNCERTAIN',
      source: 'conversation',
      timestamp: new Date().toISOString(),
    };

    const result = await personaEngine.collaborate(input);

    return {
      success: true,
      consensus: result.consensusConfidence,
      votes: result.votes,
      summary: result.summary,
      opinions: result.opinions.map(o => ({
        persona: o.personaName,
        confidence: o.confidence,
        reasoning: o.reasoning,
      })),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：残差队列管理
export async function getResidualStatus(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    layer1: number;
    layer2: number;
    layer3: number;
    totalScore: number;
  };
  error?: string;
}> {
  try {
    const stats = residualEngine.getStats();
    return {
      success: true,
      stats: {
        total: stats.totalResiduals,
        layer1: stats.layer1Count,
        layer2: stats.layer2Count,
        layer3: stats.layer3Count,
        totalScore: stats.totalScore,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 辅助函数

// -------- v13 新增工具 --------

// 工具函数：向量语义检索
export async function vectorSearch(params: {
  query: string;
  topK?: number;
  repoTypes?: RepoType[];
  filterTags?: string[];
}): Promise<{ success: boolean; results?: Array<{ id: string; score: number; title: string; preview: string }>; stats?: unknown; error?: string }> {
  try {
    const results = vectorEngine.search(params.query, {
      topK: params.topK || 10,
      repoTypes: params.repoTypes,
      filterTags: params.filterTags,
    });

    return {
      success: true,
      results: results.map(r => ({
        id: r.document.id,
        score: Math.round(r.score * 100) / 100,
        title: r.document.title,
        preview: r.document.content?.substring(0, 200) || '',
      })),
      stats: vectorEngine.getStats(),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：记忆融合去重
export async function fuseMemory(params: {
  docIds: string[];
}): Promise<{ success: boolean; merged?: { title: string; content: string; factCount: number; mergedFrom: string[] }; error?: string }> {
  try {
    const docs: MemoryDocument[] = [];
    for (const docId of params.docIds) {
      const results = await indexEngine.searchMemory({ text: docId, limit: 1 });
      if (results.length > 0) docs.push(results[0].document);
    }

    if (docs.length < 2) return { success: false, error: 'Need at least 2 documents to fuse' };

    const result = fusionEngine.fusionPair(docs[0], docs[1]);

    return {
      success: true,
      merged: {
        title: result.mergedDocument.title || 'Fused',
        content: result.mergedDocument.content || '',
        factCount: result.facts.length,
        mergedFrom: result.mergedFrom,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 工具函数：记忆质量评估
export async function assessMemoryQuality(params: {
  docId?: string;
}): Promise<{ success: boolean; report?: { title: string; score: number; completeness: number; freshness: number; consistency: number; confidenceBalance: number; issues: Array<{ type: string; severity: string; description: string }>; recommendations: string[] }; error?: string }> {
  try {
    // Batch assess all indexed docs
    if (!params.docId) {
      const results = await indexEngine.searchMemory({ text: '', limit: 100 });
      metacognitionEngine.assessBatch(results.map(r => r.document));
      const stats = metacognitionEngine.getStats();
      return {
        success: true,
        report: {
          title: 'Global Memory Quality Assessment',
          score: stats.averageScore,
          completeness: 0,
          freshness: 0,
          consistency: 0,
          confidenceBalance: 0,
          issues: stats.topIssues.map(i => ({ type: i.type, severity: 'medium' as const, description: `${i.count} documents affected` })),
          recommendations: ['Review top issues above'],
        },
      };
    }

    // Single doc assessment
    const results = await indexEngine.searchMemory({ text: params.docId, limit: 1 });
    if (results.length === 0) return { success: false, error: 'Document not found' };

    const report = metacognitionEngine.assess(results[0].document);

    return {
      success: true,
      report: {
        title: report.title,
        score: report.scores.overall,
        completeness: report.scores.completeness,
        freshness: report.scores.freshness,
        consistency: report.scores.consistency,
        confidenceBalance: report.scores.confidenceBalance,
        issues: report.issues.map(i => ({ type: i.type, severity: i.severity, description: i.description })),
        recommendations: report.recommendations,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 辅助函数
function getRepoPath(repo: RepoType): string {
  const basePath = pluginConfig?.localPath || process.env.MEMORY_LOCAL_PATH || '~/.openclaw/memory';
  const expandedPath = basePath.replace(/^~/, homedir());
  const agentName = pluginConfig?.agentId || process.env.MEMORY_AGENT_NAME || 'openclaw';
  
  const paths: Record<RepoType, string> = {
    main: `${expandedPath}/main-memory-shared`,
    business: `${expandedPath}/business-memory-shared`,
    code: `${expandedPath}/code-memory-shared`,
    private: `${expandedPath}/${agentName}-1-memory-private`
  };
  
  return paths[repo];
}

function buildFrontmatter(data: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function getCategoryFromPath(path: string): string {
  const parts = path.split('/');
  return parts.length > 1 ? parts[0] : 'general';
}

function generateId(path: string): string {
  const hash = path.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return Math.abs(hash).toString(36);
}

// 插件注册函数
export function registerOpenClawMemoryPlugin(api: {
  registerTool: (name: string, fn: (...args: unknown[]) => unknown) => void;
  registerSkill: (skill: { name: string; description: string }) => void;
}): void {
  // 初始化配置：优先 env var，其次默认值
  const agentId = process.env.MEMORY_AGENT_NAME || 'openclaw';
  const localBasePath = (process.env.MEMORY_LOCAL_PATH || '~/.openclaw/memory').replace(/^~/, homedir());
  pluginConfig = {
    mainRepoUrl: process.env.MEMORY_MAIN_REPO_URL || '',
    businessRepoUrl: process.env.MEMORY_BUSINESS_REPO_URL || '',
    codeRepoUrl: process.env.MEMORY_CODE_REPO_URL || '',
    privateRepoUrl: process.env.MEMORY_PRIVATE_REPO_URL || '',
    localPath: localBasePath,
    syncInterval: parseInt(process.env.MEMORY_SYNC_INTERVAL || '300000', 10),
    agentId,
    agentType: process.env.MEMORY_AGENT_TYPE || 'openclaw',
  };

  // 如果配置了仓库 URL，自动调用 initializeCore
  if (pluginConfig.mainRepoUrl) {
    initializeCore({
      mainRepoUrl: pluginConfig.mainRepoUrl,
      businessRepoUrl: pluginConfig.businessRepoUrl,
      codeRepoUrl: pluginConfig.codeRepoUrl,
      privateRepoUrl: pluginConfig.privateRepoUrl,
      localBasePath: pluginConfig.localPath,
      agentId: pluginConfig.agentId!,
      agentType: pluginConfig.agentType!,
    }).catch((err: unknown) => {
      console.error('[MemoryPlugin] initializeCore failed:', err);
    });
  }

  // 注册工具
  api.registerTool('memory_save', saveMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_load', loadMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_search', searchMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_sync', syncMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_status', getMemoryStatus as (...args: unknown[]) => unknown);
  api.registerTool('memory_annotate', annotateMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_route', routeQuery as (...args: unknown[]) => unknown);
  api.registerTool('memory_collaborate', collaborateMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_residuals', getResidualStatus as (...args: unknown[]) => unknown);
  api.registerTool('memory_vector_search', vectorSearch as (...args: unknown[]) => unknown);
  api.registerTool('memory_fuse', fuseMemory as (...args: unknown[]) => unknown);
  api.registerTool('memory_assess', assessMemoryQuality as (...args: unknown[]) => unknown);
  
  // v13.1: 自动启动定时同步 (10:00/22:00 C4原则)
  try {
    gitSyncManager.startScheduledSync();
  } catch { /* best-effort */ }

  // 注册技能
  api.registerSkill({
    name: 'openclaw-memory',
    description: 'OpenClaw 智能体记忆管理技能'
  });
}

export default {
  register: registerOpenClawMemoryPlugin
};
