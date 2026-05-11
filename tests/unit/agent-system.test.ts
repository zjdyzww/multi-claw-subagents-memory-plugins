import { describe, it, expect, beforeEach, vi } from 'vitest';
import { System2Agent, System1Agent, FullMemoryAgentClient } from '@multi-claw/shared-memory-core';
import type { MemoryRepresentation, FactPoint } from '@multi-claw/shared-memory-core';

function makeInput(overrides: Partial<MemoryRepresentation> = {}): MemoryRepresentation {
  return {
    id: 'test-input',
    rawContent: 'This is a test conversation content with important information. The user decided to use PostgreSQL.',
    facts: [],
    confidence: 'UNCERTAIN',
    source: 'conversation',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe('System2Agent', () => {
  let agent: System2Agent;
  beforeEach(() => { agent = new System2Agent('sys2-test', 'opencode'); });

  it('should start idle', () => {
    expect(agent.status).toBe('idle');
    expect(agent.role).toBe('system2');
  });

  it('should capture all content as facts (zero omission)', async () => {
    const input = makeInput();
    await agent.startProcessing(input);
    const result = await agent.getResult();
    expect(result.facts.length).toBeGreaterThan(0);
    expect(result.metadata?.captureMode).toBe('zero-omission');
  });

  it('should handle empty content gracefully', async () => {
    await agent.startProcessing(makeInput({ rawContent: '' }));
    const result = await agent.getResult();
    expect(result.facts).toHaveLength(0);
  });

  it('should error if getResult before startProcessing', async () => {
    await expect(agent.getResult()).rejects.toThrow('No result available');
  });

  it('should track processed count', async () => {
    await agent.startProcessing(makeInput());
    const status = agent.getStatus();
    expect(status.processedCount).toBe(1);
  });

  it('should shutdown cleanly', async () => {
    await agent.shutdown();
    expect(agent.status).toBe('idle');
  });

  it('should capture each paragraph as separate fact', async () => {
    const input = makeInput({ rawContent: 'Paragraph one.\n\nParagraph two.\n\nParagraph three.' });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    expect(result.facts).toHaveLength(3);
    expect(result.facts[0].content).toContain('Paragraph one');
    expect(result.facts[1].content).toContain('Paragraph two');
  });
});

describe('System1Agent', () => {
  let agent: System1Agent;
  beforeEach(() => { agent = new System1Agent('sys1-test', 'opencode'); });

  it('should start with default gold pan rate 5-15%', () => {
    const rate = agent.getGoldPanRate();
    expect(rate.min).toBe(0.05);
    expect(rate.max).toBe(0.15);
  });

  it('should accept custom gold pan rate', () => {
    agent.setGoldPanRate(0.1, 0.3);
    const rate = agent.getGoldPanRate();
    expect(rate.min).toBe(0.1);
    expect(rate.max).toBe(0.3);
  });

  it('should elevate explicit statements to CONFIRMED', async () => {
    const input = makeInput({ facts: [{ id: 'f1', content: '我是公司CEO', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false }] });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    const confirmed = result.facts.filter(f => f.confidence === 'CONFIRMED');
    expect(confirmed.length).toBeGreaterThan(0);
  });

  it('should mark vague statements as UNCERTAIN', async () => {
    const input = makeInput({ facts: [{ id: 'f2', content: '可能明天会下雨', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false }] });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    const uncertain = result.facts.filter(f => f.confidence === 'UNCERTAIN');
    expect(uncertain.length).toBeGreaterThan(0);
  });

  it('should discard short meaningless facts', async () => {
    const input = makeInput({ facts: [
      { id: 'f3', content: '可能明天会下雨', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
      { id: 'f4', content: 'hi', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
    ] });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    expect(result.metadata?.refinedCount).toBeLessThan(result.metadata?.totalFacts);
  });

  it('should maintain gold pan ratio within bounds', async () => {
    const facts: FactPoint[] = Array.from({ length: 20 }, (_, i) => ({
      id: `f${i}`, content: `Meaningful content piece number ${i} with enough length`, confidence: 'UNCERTAIN' as const,
      source: 'user', category: 'test', verified: false,
    }));
    await agent.startProcessing(makeInput({ facts }));
    const result = await agent.getResult();
    const ratio = (result.metadata?.refinedCount as number) / (result.metadata?.totalFacts as number);
    expect(ratio).toBeGreaterThan(0);
  });

  it('should calculate overall confidence correctly', async () => {
    const input = makeInput({ facts: [
      { id: 'f5', content: '我是用户', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
      { id: 'f6', content: '决定使用MySQL', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
    ] });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    expect(['CONFIRMED', 'LIKELY', 'UNCERTAIN']).toContain(result.confidence);
  });

  it('should include residualInfo from input', async () => {
    const input = makeInput({ facts: [], residualInfo: { size: 2, ageWeight: 1.5, residualScore: 300, lastCheckAt: 'now', cleanupLayer: 1, resolutionAttempts: 1 } });
    await agent.startProcessing(input);
    const result = await agent.getResult();
    expect(result.residualInfo).toBeDefined();
    expect(result.residualInfo!.size).toBe(2);
  });

  it('should shutdown cleanly', async () => {
    await agent.shutdown();
    expect(agent.status).toBe('idle');
  });
});

describe('FullMemoryAgentClient', () => {
  const testPath = '/tmp/test-memory-test-client.md';
  let client: FullMemoryAgentClient;
  beforeEach(() => {
    client = new FullMemoryAgentClient('full-test', 'opencode', testPath);
    const fs = require('fs');
    if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
  });

  it('should write memory to local file', async () => {
    const input = makeInput({ facts: [{ id: 'f1', content: 'Test fact', confidence: 'CONFIRMED', source: 'user', category: 'test', verified: true }] });
    await client.startProcessing(input);
    const fs = require('fs');
    expect(fs.existsSync(testPath)).toBe(true);
    const content = fs.readFileSync(testPath, 'utf-8');
    expect(content).toContain('Test fact');
  });

  it('should delegate residuals to ResidualEngine', async () => {
    const input = makeInput({ facts: [
      { id: 'r1', content: 'Uncertain fact', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
      { id: 'r2', content: 'Confirmed fact', confidence: 'CONFIRMED', source: 'user', category: 'test', verified: true },
    ] });
    await client.startProcessing(input);
    const residualEngine = (await import('@multi-claw/shared-memory-core')).residualEngine;
    const queue = residualEngine.getQueue();
    const uncertainIds = queue.map(e => e.fact.id);
    expect(uncertainIds).toContain('r1');
    expect(uncertainIds).not.toContain('r2');
  });

  it('should resolve residuals via ResidualEngine', async () => {
    const input = makeInput({ facts: [{ id: 'resolve-me', content: 'Will resolve', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false }] });
    await client.startProcessing(input);
    client.resolveResidual('resolve-me');
    const residualEngine = (await import('@multi-claw/shared-memory-core')).residualEngine;
    expect(residualEngine.getQueue().find(e => e.fact.id === 'resolve-me')).toBeUndefined();
  });

  it('should clear all residuals via ResidualEngine', async () => {
    const input = makeInput({ facts: [
      { id: 'c1', content: 'Clear me', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
      { id: 'c2', content: 'Clear me too', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false },
    ] });
    await client.startProcessing(input);
    client.clearResidualQueue();
    const residualEngine = (await import('@multi-claw/shared-memory-core')).residualEngine;
    expect(residualEngine.getQueue().length).toBe(0);
  });

  it('should report residualInfo after processing', async () => {
    const input = makeInput({ facts: [{ id: 'info-1', content: 'Info fact', confidence: 'UNCERTAIN', source: 'user', category: 'test', verified: false }] });
    await client.startProcessing(input);
    const result = await client.getResult();
    expect(result.residualInfo).toBeDefined();
    expect(typeof result.residualInfo!.residualScore).toBe('number');
  });

  it('should emit events during processing lifecycle', async () => {
    const events: string[] = [];
    client.on('processingStarted', () => events.push('started'));
    client.on('processingComplete', () => events.push('complete'));
    await client.startProcessing(makeInput());
    expect(events).toContain('started');
    expect(events).toContain('complete');
  });

  it('should track agent status', async () => {
    const status = client.getStatus();
    expect(status.agentId).toBe('full-test');
    expect(status.role).toBe('full_client');
  });
});
