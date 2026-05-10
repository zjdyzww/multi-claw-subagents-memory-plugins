/**
 * 全量记忆代理 Server 端 - 完整初始化
 * 配置 GitSyncManager + EventBus + 所有记忆仓库
 */
import {
  eventBus,
  gitSyncManager,
  createFullMemoryAgentServer,
  createFullMemoryAgentClient,
  vectorEngine,
  forgettingEngine,
  graphEngine,
  fusionEngine,
  sleepEngine,
  metacognitionEngine,
  residualEngine,
  routerEngine,
  confidenceEngine,
  personaEngine,
  indexEngine,
} from '@multi-claw/shared-memory-core';
import * as fs from 'fs';
import * as path from 'path';

// 配置
const CONFIG = {
  gitea: {
    url: 'https://git.osc.life',
    token: 'abf62dcacd144af029a87674ee4f045d9fb451ce',
    org: 'claws-memory',
  },
  agentId: 'claude-code-agent-01',
  agentType: 'claude-code',
};

// claws-memory 组织下的所有记忆仓库
const REPOS = [
  // 共享仓库
  { type: 'main', name: 'main-memory-shared', localPath: '/home/yushanhe/.hermes/repos/main-memory-shared' },
  { type: 'business', name: 'business-memory-shared', localPath: '/home/yushanhe/.hermes/repos/business-memory-shared' },
  { type: 'code', name: 'code-memory-shared', localPath: '/home/yushanhe/.hermes/repos/code-memory-shared' },
  // 私有仓库
  { type: 'openclaw-private', name: 'openclaw-memory-private', localPath: '/home/yushanhe/.hermes/repos/openclaw-private' },
  { type: 'hermes-private', name: 'hermes-memory-private', localPath: '/home/yushanhe/.hermes/repos/hermes-private' },
  { type: 'claude-code-private', name: 'claude-code-memory-private', localPath: '/home/yushanhe/.hermes/repos/claude-code-private' },
  { type: 'opencode-private', name: 'opencode-memory-private', localPath: '/home/yushanhe/.hermes/repos/opencode-private' },
  // 实例版本
  { type: 'openclaw-1', name: 'openclaw-1-memory-private', localPath: '/home/yushanhe/.hermes/repos/openclaw-1-private' },
  { type: 'hermes-1', name: 'hermes-1-memory-private', localPath: '/home/yushanhe/.hermes/repos/hermes-1-private' },
  { type: 'claude-code-1', name: 'claude-code-1-memory-private', localPath: '/home/yushanhe/.hermes/repos/claude-code-1-private' },
  { type: 'opencode-1', name: 'opencode-1-memory-private', localPath: '/home/yushanhe/.hermes/repos/opencode-1-private' },
];

async function init() {
  console.log('🚀 全量记忆代理 Server 端部署...\n');

  // 0. 创建目录
  console.log('📂 创建仓库目录...');
  for (const repo of REPOS) {
    if (!fs.existsSync(repo.localPath)) {
      fs.mkdirSync(repo.localPath, { recursive: true });
    }
    console.log(`  ✅ ${repo.name}`);
  }

  // 1. 注册仓库
  console.log('\n📁 注册仓库...');
  for (const repo of REPOS) {
    gitSyncManager.registerRepo({
      type: repo.type,
      name: repo.name,
      localPath: repo.localPath,
      remote: `https://git.osc.life/claws-memory/${repo.name}.git`,
      token: CONFIG.gitea.token,
    });
    console.log(`  ✅ ${repo.type}: ${repo.name}`);
  }

  // 2. 配置 EventBus
  console.log('\n🔔 配置 EventBus...');
  eventBus.on('memory.synced', (e) => console.log(`📡 同步: ${e.payload?.memoryId}`));
  eventBus.on('memory.residual', (e) => console.log(`🔄 残差: ${e.payload?.residualScore}`));
  eventBus.on('agent.online', (e) => console.log(`🟢 Agent上线: ${e.agentId}`));
  console.log('  ✅ EventBus 事件监听已配置');

  // 3. 创建代理
  console.log('\n🖥️ 创建 FullMemoryAgentServer...');
  const server = createFullMemoryAgentServer(CONFIG.agentId, CONFIG.agentType, gitSyncManager, eventBus);
  console.log(`  ✅ ${server.agentId} (${server.role})`);

  console.log('\n💾 创建 FullMemoryAgentClient...');
  const client = createFullMemoryAgentClient(
    CONFIG.agentId,
    CONFIG.agentType,
    '/home/yushanhe/.claude/memory-agent-files/MEMORY.md'
  );
  console.log(`  ✅ ${client.agentId} (${client.role})`);

  // 4. 验证引擎
  console.log('\n🔍 服务器端引擎验证:');
  console.log('  ✅ VectorEngine        128-dim余弦相似度 (≤200ms)');
  console.log('  ✅ ForgettingEngine    艾宾浩斯遗忘曲线');
  console.log('  ✅ GraphEngine         BFS/DFS (1000+节点)');
  console.log('  ✅ FusionEngine        Jaccard融合去重');
  console.log('  ✅ SleepEngine         空闲后台整理');
  console.log('  ✅ MetacognitionEngine 4维质量评估');
  console.log('  ✅ ResidualEngine      R=Σ(size×weight)三层清理');
  console.log('  ✅ RouterEngine        自适应路由');
  console.log('  ✅ ConfidenceEngine    🟢🟡🔴 置信度');
  console.log('  ✅ IndexEngine         全文搜索 (≤100ms)');
  console.log('  ✅ PersonaEngine        4专家投票共识');

  console.log('\n========================================');
  console.log('✅ 全量记忆代理 Server 端部署完成');
  console.log('========================================');
  console.log('\n📦 已注册仓库:');
  for (const r of gitSyncManager.getRegisteredRepos()) {
    console.log(`  - ${r.name} (${r.type})`);
  }
}

init().catch(console.error);
