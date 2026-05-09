import { describe, it, expect, beforeEach } from 'vitest';
import { VectorEngine, ForgettingEngine, GraphEngine, FusionEngine, SleepEngine, MetacognitionEngine } from '@multi-claw/shared-memory-core';
import type { MemoryDocument } from '@multi-claw/shared-memory-core';

function makeDoc(id: string, content = 'test', tags: string[] = []): MemoryDocument {
  return { id, title: `Doc ${id}`, content, repoType: 'main' as const, category: 'test', tags, accessLevel: 'SHARED' as const, author: 'test', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 };
}

describe('VectorEngine', () => {
  let engine: VectorEngine;
  beforeEach(() => { engine = new VectorEngine(); });

  it('should index and search semantically', () => {
    engine.index(makeDoc('d1', 'architecture design patterns'));
    engine.index(makeDoc('d2', 'deployment configuration guide'));
    engine.index(makeDoc('d3', 'architecture and design principles'));

    const results = engine.search('architecture design', { topK: 3 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.document.content.includes('architecture'))).toBe(true);
  });

  it('should meet ≤200ms search latency', () => {
    for (let i = 0; i < 100; i++) engine.index(makeDoc(`d${i}`, `content ${i} memory test`));
    const start = Date.now();
    engine.search('memory test', { topK: 10 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(200);
  }, 5000);

  it('should filter by repoType', () => {
    engine.index(makeDoc('d1', 'main content', [], 'main'));
    engine.index({ ...makeDoc('d2', 'private content'), repoType: 'private' });
    const results = engine.search('content', { repoTypes: ['main'], topK: 5 });
    expect(results.every(r => r.document.repoType === 'main')).toBe(true);
  });
});

describe('ForgettingEngine', () => {
  let engine: ForgettingEngine;
  beforeEach(() => { engine = new ForgettingEngine(); });

  it('should register and track retention', () => {
    engine.register(makeDoc('d1', 'important fact'), 1.0);
    const retention = engine.getRetention('d1');
    expect(retention).toBeGreaterThan(0);
    expect(retention).toBeLessThanOrEqual(1);
  });

  it('should boost retention on access', () => {
    engine.register(makeDoc('d1'), 1.0);
    engine.register(makeDoc('d1'), 1.0); // re-access
    const retention = engine.getRetention('d1');
    expect(retention).toBeGreaterThan(0.9);
  });

  it('should provide stats by type', () => {
    engine.register(makeDoc('d1'), 1.0);
    const stats = engine.getStats();
    expect(stats.totalTracked).toBe(1);
    expect(stats.averageRetention).toBeGreaterThan(0);
  });
});

describe('GraphEngine', () => {
  let engine: GraphEngine;
  beforeEach(() => { engine = new GraphEngine(); engine.clear(); });

  it('should add nodes and edges', () => {
    engine.addNode(makeDoc('n1', 'node 1'));
    engine.addNode(makeDoc('n2', 'node 2'));
    engine.addEdge('n1', 'n2', 'refers');
    const stats = engine.getStats();
    expect(stats.nodeCount).toBe(2);
    expect(stats.edgeCount).toBe(1);
  });

  it('should support 1000+ nodes', () => {
    for (let i = 0; i < 1000; i++) engine.addNode(makeDoc(`n${i}`, `node ${i}`));
    for (let i = 0; i < 999; i++) engine.addEdge(`n${i}`, `n${i + 1}`, 'child');
    const stats = engine.getStats();
    expect(stats.nodeCount).toBe(1000);
    expect(stats.edgeCount).toBe(999);
  }, 10000);

  it('should BFS traverse', () => {
    engine.addNode(makeDoc('root'));
    engine.addNode(makeDoc('a'));
    engine.addNode(makeDoc('b'));
    engine.addEdge('root', 'a', 'child');
    engine.addEdge('root', 'b', 'child');
    const results = engine.bfs('root', 2);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get neighbors subgraph', () => {
    engine.addNode(makeDoc('center'));
    engine.addNode(makeDoc('n1'));
    engine.addNode(makeDoc('n2'));
    engine.addEdge('center', 'n1', 'refers');
    engine.addEdge('center', 'n2', 'supports');
    const sub = engine.getNeighbors('center', 1);
    expect(sub.nodes.length).toBe(3);
  });
});

describe('FusionEngine', () => {
  let engine: FusionEngine;
  beforeEach(() => { engine = new FusionEngine(); });

  it('should fuse two similar documents', () => {
    const result = engine.fusionPair(
      makeDoc('d1', 'architecture four layer L1 L4 pyramid'),
      makeDoc('d2', 'architecture four-layer L1-L4 design pattern')
    );
    expect(result.mergedFrom.length).toBe(2);
  });

  it('should detect near-duplicates', () => {
    const result = engine.fusionPair(
      makeDoc('d1', 'deploy nginx server configuration'),
      makeDoc('d2', 'deploy nginx server configuration')
    );
    expect(result.facts.length).toBe(1);
  });

  it('should keep both when dissimilar', () => {
    const result = engine.fusionPair(
      makeDoc('d1', 'memory management system'),
      makeDoc('d2', 'completely unrelated basketball game')
    );
    expect(result.facts.length).toBeGreaterThanOrEqual(1);
  });
});

describe('SleepEngine', () => {
  it('should register default tasks', () => {
    const engine = new SleepEngine();
    const stats = engine.getStats();
    expect(stats.tasks.length).toBe(5);
  });

  it('should track idle time', () => {
    const engine = new SleepEngine();
    engine.activity();
    const stats = engine.getStats();
    expect(stats.idleTimeMs).toBeLessThan(5000);
  });

  it('should enable/disable tasks', () => {
    const engine = new SleepEngine();
    engine.setTaskEnabled('index-optimization', false);
    const task = engine.getStats().tasks.find((t: { id: string }) => t.id === 'index-optimization');
    expect(task?.enabled).toBe(false);
  });
});

describe('MetacognitionEngine', () => {
  let engine: MetacognitionEngine;
  beforeEach(() => { engine = new MetacognitionEngine(); });

  it('should assess document quality', () => {
    const report = engine.assess(makeDoc('d1', 'A comprehensive analysis of the four-layer L1-L4 pyramid memory architecture', ['architecture', 'memory']));
    expect(report.scores.overall).toBeGreaterThanOrEqual(0);
    expect(report.scores.overall).toBeLessThanOrEqual(100);
    expect(report.assessedAt).toBeDefined();
  });

  it('should flag incomplete documents', () => {
    const report = engine.assess({ ...makeDoc('d1'), title: 'Untitled', content: 'ab' });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('should provide batch assessment stats', () => {
    engine.assess(makeDoc('d1', 'good content with more than fifty characters for proper assessment', ['tag1']));
    engine.assess(makeDoc('d2', 'short'));
    const stats = engine.getStats();
    expect(stats.totalAssessed).toBe(2);
    expect(stats.averageScore).toBeGreaterThan(0);
  });
});
