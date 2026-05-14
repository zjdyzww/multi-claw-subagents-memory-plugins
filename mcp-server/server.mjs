#!/usr/bin/env node
/**
 * Multi-Claw Memory MCP Server — OpenCode 桥接
 * 将 14 个记忆引擎暴露为 MCP stdio 工具
 */

import { homedir } from 'os';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  indexEngine,
  confidenceEngine,
  residualEngine,
  routerEngine,
  vectorEngine,
  personaEngine,
  forgettingEngine,
  fusionEngine,
  graphEngine,
  sleepEngine,
  metacognitionEngine,
  System2Agent,
  System1Agent,
  FullMemoryAgentClient,
  AgentCommunicationManager,
} from '@multi-claw/shared-memory-core';

const PROJECT_ROOT = new URL('..', import.meta.url).pathname;

const server = new Server(
  { name: 'multi-claw-memory', version: '13.1.0' },
  { capabilities: { tools: {} } }
);

function makeDoc(id, content) {
  return {
    id, title: id, content, repoType: 'main', category: 'mcp', tags: [],
    accessLevel: 'SHARED', author: 'mcp', createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), version: 1,
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'memory_search',
      description: '全文搜索记忆文档（跨仓库/标签过滤/日期范围） — IndexEngine',
      inputSchema: { type: 'object', properties: { query: { type: 'string' }, repos: { type: 'array', items: { type: 'string' } }, tags: { type: 'array', items: { type: 'string' } }, limit: { type: 'number', default: 10 } }, required: ['query'] },
    },
    {
      name: 'memory_vector_search',
      description: '向量语义搜索（128-dim 余弦相似度） — VectorEngine',
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, topK: { type: 'number', default: 10 } }, required: ['text'] },
    },
    {
      name: 'memory_residuals',
      description: '残差队列状态：R=Σ(size×weight) + L1/L2/L3 清理进度 — ResidualEngine',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'memory_route',
      description: '自适应路由评估（direct/parallel/iterative） — RouterEngine',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    },
    {
      name: 'memory_confidence',
      description: '置信度统计：CONFIRMED/LIKELY/UNCERTAIN 分布 — ConfidenceEngine',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'memory_annotate',
      description: '标注文档置信度 🟢CONFIRMED / 🟡LIKELY / 🔴UNCERTAIN — ConfidenceEngine',
      inputSchema: { type: 'object', properties: { content: { type: 'string' }, level: { type: 'string', enum: ['CONFIRMED', 'LIKELY', 'UNCERTAIN'] }, source: { type: 'string' } }, required: ['content', 'level'] },
    },
    {
      name: 'memory_collaborate',
      description: '4 专家 Persona 协作评估（Architect/Reviewer/Critic/Integrator） — PersonaEngine',
      inputSchema: { type: 'object', properties: { content: { type: 'string' }, facts: { type: 'array', items: { type: 'string' } } }, required: ['content'] },
    },
    {
      name: 'memory_forgetting',
      description: '艾宾浩斯遗忘曲线查询（R=e^(-t/S)，5 种 memoryType） — ForgettingEngine',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'memory_fuse',
      description: '多源记忆融合去重（Jaccard 相似度 + 3 级阈值） — FusionEngine',
      inputSchema: { type: 'object', properties: { texts: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 10 } }, required: ['texts'] },
    },
    {
      name: 'memory_graph',
      description: '记忆图结构查询（节点数/边数/密度/关系类型） — GraphEngine',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'memory_assess',
      description: '记忆质量自评估（完整性/时效性/一致性/置信度 4 维评分） — MetacognitionEngine',
      inputSchema: { type: 'object', properties: { content: { type: 'string', description: '要评估的文本内容' } }, required: ['content'] },
    },
    {
      name: 'agent_system2_capture',
      description: 'System2 记忆代理：海绵式全量捕获（零遗漏原则），输入对话内容返回全量 MemoryRepresentation',
      inputSchema: { type: 'object', properties: { content: { type: 'string', description: '对话/文档原文' } }, required: ['content'] },
    },
    {
      name: 'agent_system1_refine',
      description: 'System1 记忆代理：淘金式精炼（5-15%淘金率），对 System2 输出进行 7 标准筛选标注置信度',
      inputSchema: { type: 'object', properties: { content: { type: 'string', description: 'System2 全量捕获的文本' } }, required: ['content'] },
    },
    {
      name: 'agent_fullmemory_persist',
      description: '全量记忆代理-Client：本地持久化写入 + 残差队列调度',
      inputSchema: { type: 'object', properties: { content: { type: 'string', description: 'System1 精炼后的文本（含🟢🟡🔴标注）' } }, required: ['content'] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'memory_search': {
        const results = await indexEngine.searchMemory({
          text: args.query,
          repoTypes: args.repos,
          tags: args.tags,
          limit: args.limit || 10,
        });
        const perf = indexEngine.getSearchPerformance();
        return { content: [{ type: 'text', text: JSON.stringify({
          results: results.map(r => ({ title: r.document.title, score: r.score, category: r.document.category, highlights: r.highlights?.join('; ') })),
          performance: perf,
        }, null, 2) }] };
      }

      case 'memory_vector_search': {
        const text = args.text;
        for (const r of [args]) { /* index dummy docs if empty */
          if (vectorEngine.getStats().totalVectors === 0) {
            vectorEngine.index(makeDoc('v1', 'memory architecture design patterns L1-L4 pyramid'));
            vectorEngine.index(makeDoc('v2', 'residual convergence cleanup three-layer mechanism'));
            vectorEngine.index(makeDoc('v3', 'confidence propagation confirmed likely uncertain'));
            vectorEngine.index(makeDoc('v4', 'adaptive router parallel iterative strategy query'));
          }
        }
        const results = vectorEngine.search(text, { topK: args.topK || 10 });
        const stats = vectorEngine.getStats();
        return { content: [{ type: 'text', text: JSON.stringify({
          results: results.map(r => ({ title: r.document.title, similarity: Math.round(r.score * 10000) / 10000, preview: r.document.content?.substring(0, 150) })),
          engine: stats,
        }, null, 2) }] };
      }

      case 'memory_residuals': {
        const stats = residualEngine.getStats();
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'memory_route': {
        const decision = routerEngine.classifyQuery(args.query);
        return { content: [{ type: 'text', text: JSON.stringify({
          query: args.query,
          strategy: decision.strategy,
          reason: decision.reason,
          targetAgents: decision.targetAgents,
          decisionId: decision.decisionId,
        }, null, 2) }] };
      }

      case 'memory_confidence': {
        const stats = confidenceEngine.getStats();
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'memory_annotate': {
        const doc = makeDoc(`mcp-${Date.now()}`, args.content);
        const level = args.level;
        const annotated = confidenceEngine.annotate(doc, level, args.source || 'mcp', 'manual annotation');
        return { content: [{ type: 'text', text: JSON.stringify({
          id: annotated.id,
          confidence: annotated.confidence,
          chainLength: annotated.confidenceChain?.length || 0,
        }, null, 2) }] };
      }

      case 'memory_collaborate': {
        const facts = (args.facts || [args.content]).map((f, i) => ({
          id: `mcp-f${i}`, content: f, confidence: 'UNCERTAIN',
          source: 'user', category: 'evaluation', verified: false,
        }));
        const result = await personaEngine.collaborate({
          id: `mcp-collab-${Date.now()}`, rawContent: args.content,
          facts, confidence: 'UNCERTAIN', source: 'conversation', timestamp: new Date().toISOString(),
        });
        return { content: [{ type: 'text', text: JSON.stringify({
          consensus: result.consensusConfidence,
          votes: result.votes,
          opinions: result.opinions.map(o => ({ persona: o.personaName, confidence: o.confidence, reasoning: o.reasoning })),
          summary: result.summary,
        }, null, 2) }] };
      }

      case 'memory_forgetting': {
        const stats = forgettingEngine.getStats();
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'memory_fuse': {
        const texts = args.texts;
        const docs = texts.map((t, i) => makeDoc(`fuse-${i}`, t));
        const result = fusionEngine.fusionPair(docs[0], docs[1]);
        return { content: [{ type: 'text', text: JSON.stringify({
          factCount: result.facts.length,
          mergedFrom: result.mergedFrom,
          decisions: result.mergeDecisions.length,
          confidence: result.confidence,
        }, null, 2) }] };
      }

      case 'memory_graph': {
        const stats = graphEngine.getStats();
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
      }

      case 'memory_assess': {
        const doc = makeDoc(`mcp-assess-${Date.now()}`, args.content);
        const report = metacognitionEngine.assess(doc);
        return { content: [{ type: 'text', text: JSON.stringify({
          scores: report.scores,
          issues: report.issues.map(i => ({ type: i.type, severity: i.severity, description: i.description })),
          recommendations: report.recommendations,
        }, null, 2) }] };
      }

      // ========== 三记忆增强代理 ==========

      case 'agent_system2_capture': {
        const sys2 = new System2Agent('sys2-opencode', 'opencode');
        await sys2.startProcessing({
          id: `mcp-s2-${Date.now()}`,
          rawContent: args.content,
          facts: [],
          confidence: 'UNCERTAIN',
          source: 'opencode-conversation',
          timestamp: new Date().toISOString(),
        });
        const result = await sys2.getResult();
        const status = sys2.getStatus();
        await sys2.shutdown();
        return { content: [{ type: 'text', text: JSON.stringify({
          agent: 'System2 (海绵式全量捕获)',
          principle: '零遗漏 — 不做筛选判断，全量接收',
          id: result.id,
          factCount: result.facts.length,
          captureMode: 'zero-omission',
          sampleFact: result.facts[0]?.content?.substring(0, 100),
          agentStatus: status,
          metadata: result.metadata,
        }, null, 2) }] };
      }

      case 'agent_system1_refine': {
        const sys2 = new System2Agent('sys2-refine', 'opencode');
        await sys2.startProcessing({
          id: `mcp-s2-pre-${Date.now()}`,
          rawContent: args.content,
          facts: [],
          confidence: 'UNCERTAIN',
          source: 'opencode-conversation',
          timestamp: new Date().toISOString(),
        });
        const raw = await sys2.getResult();
        await sys2.shutdown();

        const sys1 = new System1Agent('sys1-refine', 'opencode');
        await sys1.startProcessing(raw);
        const refined = await sys1.getResult();
        const status = sys1.getStatus();
        const goldPan = sys1.getGoldPanRate();
        await sys1.shutdown();

        return { content: [{ type: 'text', text: JSON.stringify({
          agent: 'System1 (淘金式精炼)',
          principle: `筛选·沉淀·淘金率 ${goldPan.min*100}-${goldPan.max*100}%`,
          pipeline: 'System2 → System1',
          inputFactCount: raw.facts.length,
          refinedFactCount: refined.facts.length,
          goldPanRatio: (raw.facts.length > 0 ? Math.round(refined.facts.length / raw.facts.length * 100) : 0) + '%',
          overallConfidence: refined.confidence,
          confidenceBreakdown: {
            CONFIRMED: refined.facts.filter(f => f.confidence === 'CONFIRMED').length,
            LIKELY: refined.facts.filter(f => f.confidence === 'LIKELY').length,
            UNCERTAIN: refined.facts.filter(f => f.confidence === 'UNCERTAIN').length,
          },
          refinedContent: refined.refinedContent?.substring(0, 500),
          agentStatus: status,
        }, null, 2) }] };
      }

      case 'agent_fullmemory_persist': {
        const fullPath = `${homedir()}/.opencode/memory/MEMORY.md`;
        const fc = new FullMemoryAgentClient('full-opencode', 'opencode', fullPath);

        const content = String(args.content || '');
        const facts = content.split('\n').filter(f => f.trim()).map((f, i) => {
          const isConfirmed = f.includes('🟢');
          const isLikely = f.includes('🟡');
          return {
            id: `mcp-persist-${i}`,
            content: f.replace(/[🟢🟡🔴]/g, '').trim(),
            confidence: isConfirmed ? 'CONFIRMED' : isLikely ? 'LIKELY' : 'UNCERTAIN',
            source: 'opencode-system1',
            category: 'refined',
            verified: isConfirmed,
          };
        });

        const input = {
          id: `mcp-full-${Date.now()}`,
          rawContent: '',
          refinedContent: args.content,
          facts,
          confidence: 'LIKELY',
          source: 'opencode-pipeline',
          timestamp: new Date().toISOString(),
        };

        await fc.startProcessing(input);
        const result = await fc.getResult();
        const residuals = fc.getResidualQueue();
        const status = fc.getStatus();
        await fc.shutdown();

        return { content: [{ type: 'text', text: JSON.stringify({
          agent: '全量记忆代理-Client (本地持久化)',
          principle: '本地文件写入 + 残差队列调度',
          persistedTo: fullPath,
          factCount: facts.length,
          residualsQueued: residuals.length,
          residualInfo: result.residualInfo,
          agentStatus: status,
        }, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`Multi-Claw Memory MCP Server v13.1.0 started (${server.capabilities?.tools ? Object.keys(server.capabilities.tools).length : 0} tools)`);
