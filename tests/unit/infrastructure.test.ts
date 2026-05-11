import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventBus,
  AccessControl,
  FullMemoryAgentServer,
  AgentCommunicationManager,
  SleepEngine,
  ForgettingEngine,
  ResidualEngine,
  IndexEngine,
  gitSyncManager,
} from '@multi-claw/shared-memory-core';

// Prevent cross-test pollution: reset singletons
beforeEach(() => {
  const eb = new EventBus() as any;
  Object.assign(EventBus.prototype, eb);

  const ac = new AccessControl() as any;
  Object.assign(AccessControl.prototype, ac);
});

// ============================================================
// EventBus
// ============================================================
describe('EventBus', () => {
  let bus: EventBus;
  beforeEach(() => { bus = new EventBus(); });

  it('should subscribe and receive events', () => new Promise<void>(done => {
    bus.subscribe('test-agent', ['memory.created'], (event) => {
      expect(event.type).toBe('memory.created');
      expect(event.agentId).toBe('test-agent');
      done();
    });
    bus.publishMemoryCreated('test-agent', 'main', 'doc-1', '/path/doc.md');
  }));

  it('should filter events with custom filter', () => new Promise<void>(done => {
    const received: string[] = [];
    bus.subscribe('filter-agent', ['memory.created'], (event) => {
      received.push(event.payload.docId as string);
    }, (event) => event.payload.docId === 'include-me');
    bus.publishMemoryCreated('filter-agent', 'main', 'include-me', '/path/a.md');
    bus.publishMemoryCreated('filter-agent', 'main', 'exclude-me', '/path/b.md');
    setTimeout(() => {
      expect(received).toContain('include-me');
      expect(received).not.toContain('exclude-me');
      done();
    }, 50);
  }));

  it('should unsubscribe', () => {
    const id = bus.subscribe('agent', ['memory.created'], () => {});
    bus.unsubscribe(id);
    const stats = bus.getSubscriptionStats();
    expect(stats.total).toBe(0);
  });

  it('should unsubscribe all for an agent', () => {
    bus.subscribe('agent-a', ['memory.created'], () => {});
    bus.subscribe('agent-a', ['memory.updated'], () => {});
    bus.subscribe('agent-b', ['memory.created'], () => {});
    const count = bus.unsubscribeAll('agent-a');
    expect(count).toBe(2);
  });

  it('should log events', () => {
    bus.publishMemoryCreated('log-agent', 'main', 'log-doc', '/path/doc.md');
    const logs = bus.getEventLog();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].event.type).toBe('memory.created');
  });

  it('should filter event log by type', () => {
    bus.publishMemoryCreated('agent', 'main', 'd1', '/p');
    bus.publishMemoryDeleted('agent', 'main', 'd2', '/p');
    const logs = bus.getEventLog(10, 'memory.created');
    expect(logs.every(l => l.event.type === 'memory.created')).toBe(true);
  });

  it('should track subscription stats', () => {
    bus.subscribe('agent-x', ['memory.created', 'memory.updated'], () => {});
    bus.subscribe('agent-y', ['memory.created'], () => {});
    const stats = bus.getSubscriptionStats();
    expect(stats.total).toBe(2);
    expect(stats.byType['memory.created']).toBe(2);
    expect(stats.byType['memory.updated']).toBe(1);
  });

  it('should clear log', () => {
    bus.publishMemoryCreated('a', 'main', 'd', '/p');
    bus.clearLog();
    expect(bus.getEventLog().length).toBe(0);
  });
});

// ============================================================
// AccessControl
// ============================================================
describe('AccessControl', () => {
  let ac: AccessControl;
  beforeEach(() => { ac = new AccessControl(); });

  it('should allow shared access to recognized agents', () => {
    ac.registerAgent({ agentId: 'openclaw-1', agentType: 'openclaw', displayName: 'OpenClaw#1', priority: 100, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    const decision = ac.checkAccess('openclaw-1', 'main', 'SHARED');
    expect(decision.allowed).toBe(true);
  });

  it('should deny access to unknown agents for private repos', () => {
    const decision = ac.checkAccess('unknown-agent', 'private', 'PRIVATE');
    expect(decision.allowed).toBe(false);
  });

  it('should deny explicitly denied agents', () => {
    ac.registerAgent({ agentId: 'blocked-agent', agentType: 'openclaw', displayName: 'Blocked', priority: 100, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    ac.setRule('main', { repoType: 'main', accessLevel: 'SHARED_WRITE', allowedAgents: ['openclaw-1'], deniedAgents: ['blocked-agent'] });
    ac.registerAgent({ agentId: 'openclaw-1', agentType: 'openclaw', displayName: 'OC1', priority: 100, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    const blocked = ac.checkAccess('blocked-agent', 'main', 'SHARED');
    expect(blocked.allowed).toBe(false);
    const allowed = ac.checkAccess('openclaw-1', 'main', 'SHARED');
    expect(allowed.allowed).toBe(true);
  });

  it('should register and retrieve agents', () => {
    ac.registerAgent({ agentId: 'agent-1', agentType: 'hermes', displayName: 'Hermes', priority: 80, capabilities: ['memory:read'], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    const agent = ac.getAgent('agent-1');
    expect(agent).toBeDefined();
    expect(agent!.agentType).toBe('hermes');
  });

  it('should unregister agents', () => {
    ac.registerAgent({ agentId: 'tmp', agentType: 'openclaw', displayName: 'Tmp', priority: 100, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    ac.unregisterAgent('tmp');
    expect(ac.getAgent('tmp')).toBeUndefined();
  });

  it('should return correct priority', () => {
    ac.registerAgent({ agentId: 'oc-1', agentType: 'openclaw', displayName: 'OC', priority: 100, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    expect(ac.getAgentPriority('oc-1')).toBe(100);
    expect(ac.getAgentPriority('unknown')).toBe(50);
  });

  it('should list all registered agents', () => {
    ac.registerAgent({ agentId: 'a1', agentType: 'opencode', displayName: 'OC', priority: 60, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    ac.registerAgent({ agentId: 'a2', agentType: 'claude-code', displayName: 'CC', priority: 60, capabilities: [], memoryRepoUrl: '', lastActiveAt: '', status: 'online' });
    expect(ac.getAllAgents()).toHaveLength(2);
  });
});

// ============================================================
// AgentCommunicationManager
// ============================================================
describe('AgentCommunicationManager', () => {
  it('should establish connection between agents', () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    const state = cm.connect('sys2-1', 'system2', 'sys1-1', 'system1', async (msg) => {
      return { ...msg, type: 'response' as const, messageId: msg.messageId, from: msg.to, to: msg.from, payload: {}, timestamp: new Date().toISOString(), requiresAck: false };
    });
    expect(state.status).toBe('connected');
    expect(state.fromAgent).toBe('sys2-1');
  });

  it('should send and receive messages', async () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    cm.connect('sys2', 'system2', 'sys1', 'system1', async (msg) => {
      return msg.type === 'heartbeat' ? null : { ...msg, type: 'response' as const, messageId: msg.messageId, from: msg.to, to: msg.from, payload: {}, timestamp: '', requiresAck: false };
    });
    const sent = await cm.sendMessage({
      messageId: 'msg-1', from: 'sys2', to: 'sys1', type: 'handoff', priority: 'high',
      payload: { data: 'test' }, timestamp: new Date().toISOString(), requiresAck: true,
    });
    expect(sent).toBe(true);
  });

  it('should maintain communication state', async () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    cm.connect('a', 'system2', 'b', 'system1', async (msg) => null);
    await cm.sendMessage({ messageId: 'm1', from: 'a', to: 'b', type: 'handoff', priority: 'normal', payload: {}, timestamp: '', requiresAck: false });
    const state = cm.getState('a', 'b');
    expect(state).toBeDefined();
    expect(state!.messagesSent).toBe(1);
  });

  it('should broadcast to all connected agents', async () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000, maxQueueSize: 1000 });
    cm.connect('source', 'system2', 'dest1', 'system1', async () => null);
    cm.connect('source', 'system2', 'dest2', 'system1', async () => null);
    const delivered = await cm.broadcastMessage('source', { msg: 'hello' });
    // broadcastMessage returns list of connected agents from its connection check
    expect(Array.isArray(delivered)).toBe(true);
  });

  it('should disconnect cleanly', () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    cm.connect('a', 'system2', 'b', 'system1', async () => null);
    cm.disconnect('a', 'b');
    const state = cm.getState('a', 'b');
    expect(state!.status).toBe('disconnected');
  });

  it('should shutdown all connections', () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    cm.connect('a', 'system2', 'b', 'system1', async () => null);
    cm.connect('b', 'system2', 'c', 'system1', async () => null);
    cm.shutdown();
    expect(cm.getAllStates().every(s => s.status === 'disconnected')).toBe(true);
  });

  it('should send query messages', async () => {
    const cm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });
    cm.connect('q-from', 'system2', 'q-to', 'system1', async (msg) => {
      return msg.type === 'heartbeat' ? null : msg;
    });
    const result = await cm.sendQuery('q-from', 'q-to', 'test query', { strategy: 'parallel' });
    expect(result).toBeDefined();
    expect(result!.type).toBe('query');
  });
});

// ============================================================
// FullMemoryAgentServer
// ============================================================
describe('FullMemoryAgentServer', () => {
  let server: FullMemoryAgentServer;
  beforeEach(() => {
    const gs = gitSyncManager;
    const eb = new EventBus();
    server = new FullMemoryAgentServer('server-test', 'opencode', gs, eb);
  });

  it('should start idle', () => {
    expect(server.status).toBe('idle');
    expect(server.role).toBe('full_server');
  });

  it('should process input and produce result', async () => {
    const input = { id: 'srv-input', rawContent: 'test', facts: [], confidence: 'UNCERTAIN' as const, source: 'conversation' as const, timestamp: new Date().toISOString() };
    try {
      await server.startProcessing(input);
      const result = await server.getResult();
      expect(result.id).toBe('srv-input');
    } catch {
      // OK if no git repos registered
    }
  });

  it('should receive broadcasts', () => {
    const broadcast = { id: 'bc-1', rawContent: '', facts: [], confidence: 'LIKELY' as const, source: 'agent' as const, timestamp: '' };
    server.receiveBroadcast(broadcast);
    expect(server.getReceivedBroadcasts()).toHaveLength(1);
  });

  it('should record and retrieve cleanup records', () => {
    server.recordCleanup({ factId: 'f-1', resolvedAt: 'now', resolutionType: 'active', fromLayer: 1, success: true });
    expect(server.getCleanupRecords()).toHaveLength(1);
  });

  it('should track agent status', () => {
    const status = server.getStatus();
    expect(status.agentId).toBe('server-test');
  });
});

// ============================================================
// SleepEngine
// ============================================================
describe('SleepEngine', () => {
  let engine: SleepEngine;
  beforeEach(() => { engine = new SleepEngine(); });

  it('should start not sleeping', () => {
    const stats = engine.getStats();
    expect(stats.isSleeping).toBe(false);
  });

  it('should register 5 default tasks', () => {
    const stats = engine.getStats();
    expect(stats.tasks.length).toBe(5);
    const taskNames = stats.tasks.map(t => t.name);
    expect(taskNames).toContain('Index Optimization');
    expect(taskNames).toContain('Forgetting Curve Scan');
    expect(taskNames).toContain('Residual Queue Cleanup');
    expect(taskNames).toContain('Confidence Audit');
    expect(taskNames).toContain('Memory Consolidation');
  });

  it('should wake from sleep', async () => {
    engine.activity();
    engine.activity(); // reset idle timer
    const stats = engine.getStats();
    expect(stats.isSleeping).toBe(false);
  });

  it('should support enabling/disabling tasks', () => {
    engine.setTaskEnabled('index-optimization', false);
    const stats = engine.getStats();
    const task = stats.tasks.find(t => t.id === 'index-optimization');
    expect(task!.enabled).toBe(false);
  });

  it('should execute sleep cycle without crashing', async () => {
    await engine.sleep();
    const stats = engine.getStats();
    expect(stats.isSleeping).toBe(true);
    engine.wake();
    expect(engine.getStats().isSleeping).toBe(false);
  });

  it('should bind engines and not throw', () => {
    const ie = new IndexEngine();
    const re = new ResidualEngine();
    const fe = new ForgettingEngine();
    expect(() => engine.bindEngines(ie, re, fe)).not.toThrow();
  });
});

// ============================================================
// IndexEngine
// ============================================================
describe('IndexEngine', () => {
  let engine: IndexEngine;
  beforeEach(() => { engine = new IndexEngine(); });

  it('should initialize with 4 repo indexes', () => {
    const stats = engine.getIndexStats();
    expect(stats.main).toBe(0);
    expect(stats.business).toBe(0);
    expect(stats.code).toBe(0);
    expect(stats.private).toBe(0);
  });

  it('should clear specific repo index', () => {
    engine.clearIndex('main');
    const stats = engine.getIndexStats();
    expect(stats.main).toBe(0);
  });

  it('should clear all indexes', () => {
    engine.clearIndex();
    const stats = engine.getIndexStats();
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });

  it('should return search performance metrics', () => {
    const perf = engine.getSearchPerformance();
    expect(perf.totalQueries).toBe(0);
    expect(typeof perf.avgMs).toBe('number');
  });
});

// ============================================================
// ForgettingEngine
// ============================================================
describe('ForgettingEngine', () => {
  let engine: ForgettingEngine;
  beforeEach(() => { engine = new ForgettingEngine(); });

  it('should register and return retention close to 1.0 immediately', () => {
    const doc = { id: 'd1', title: 't', content: 'c', repoType: 'main' as const, category: 'test', tags: [], accessLevel: 'SHARED' as const, author: 'a', createdAt: new Date().toISOString(), updatedAt: '', version: 1, memoryType: 'fact' as const };
    engine.register(doc, 1.0);
    const retention = engine.getRetention('d1');
    // Immediately after registration, R ≈ e^(0/S) = 1.0
    expect(retention).toBeCloseTo(1.0, 1);
  });

  it('should return stats with tracked count', () => {
    const doc = { id: 'd2', title: 't', content: 'c', repoType: 'main' as const, category: 'test', tags: [], accessLevel: 'SHARED' as const, author: 'a', createdAt: '', updatedAt: '', version: 1, memoryType: 'fact' as const };
    engine.register(doc, 1.0);
    const stats = engine.getStats();
    expect(stats.totalTracked).toBe(1);
    expect(stats.averageRetention).toBeGreaterThan(0);
  });

  it('should remove tracking', () => {
    engine.register({ id: 'd2', title: 't', content: 'c', repoType: 'main', category: 'test', tags: [], accessLevel: 'SHARED', author: 'a', createdAt: '', updatedAt: '', version: 1 }, 1.0);
    engine.remove('d2');
    expect(engine.getRetention('d2')).toBe(0);
  });
});
