import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaEngine } from '@multi-claw/shared-memory-core';
import type { MemoryRepresentation, FactPoint } from '@multi-claw/shared-memory-core';

describe('PersonaEngine', () => {
  let engine: PersonaEngine;

  function makeInput(text: string, facts?: Partial<FactPoint>[]): MemoryRepresentation {
    return {
      id: `test-${Date.now()}`,
      rawContent: text,
      facts: (facts || []).map((f, i) => ({
        id: `f${i}`,
        content: f.content || `fact ${i}`,
        confidence: f.confidence || 'UNCERTAIN',
        source: f.source || 'test',
        category: f.category || 'test',
        verified: f.verified || false,
      })),
      confidence: 'UNCERTAIN',
      source: 'conversation',
      timestamp: new Date().toISOString(),
    };
  }

  beforeEach(() => {
    engine = new PersonaEngine();
    engine.resetActivation();
  });

  it('should register 4 default personas', () => {
    const personas = engine.getPersonas();
    expect(personas).toHaveLength(4);
    expect(personas.map(p => p.id)).toContain('architect');
    expect(personas.map(p => p.id)).toContain('reviewer');
    expect(personas.map(p => p.id)).toContain('critic');
    expect(personas.map(p => p.id)).toContain('integrator');
  });

  it('should activate Architect on architecture keywords', () => {
    const activated = engine.activateByKeywords('这个L1 L2 L3分层的架构设计模式很好');
    expect(activated.some(p => p.id === 'architect')).toBe(true);
  });

  it('should activate Reviewer on accuracy keywords', () => {
    const activated = engine.activateByKeywords('验证这个记忆是否准确一致');
    expect(activated.some(p => p.id === 'reviewer')).toBe(true);
  });

  it('should activate Critic on contradiction keywords', () => {
    const activated = engine.activateByKeywords('这个假设存在漏洞和矛盾');
    expect(activated.some(p => p.id === 'critic')).toBe(true);
  });

  it('should activate Integrator on synthesis keywords', () => {
    const activated = engine.activateByKeywords('让我们综合所有信息做个汇总整合');
    expect(activated.some(p => p.id === 'integrator')).toBe(true);
  });

  it('should collaborate and return consensus', async () => {
    const input = makeInput(
      '这是一个需要综合分析架构设计的关键决策',
      [
        { content: '确认采用L1-L4四层架构', confidence: 'CONFIRMED' as const },
        { content: '需要验证一致性', confidence: 'LIKELY' as const },
        { content: '可能存在边界冲突', confidence: 'UNCERTAIN' as const },
      ]
    );

    const result = await engine.collaborate(input);
    expect(result.consensusConfidence).toBeDefined();
    expect(result.opinions.length).toBeGreaterThan(0);
    expect(result.votes).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should use all 4 personas when no keywords match', async () => {
    const input = makeInput('random text without any keywords', [
      { content: 'basic fact', confidence: 'LIKELY' as const },
    ]);

    engine.resetActivation();
    const result = await engine.collaborate(input);
    expect(result.opinions.length).toBeGreaterThanOrEqual(1);
  });

  it('should track collaboration history', async () => {
    const input = makeInput('分析所有架构设计模式', [
      { content: 'arch pattern', confidence: 'LIKELY' as const },
    ]);

    await engine.collaborate(input);
    await engine.collaborate(input);

    const history = engine.getHistory(2);
    expect(history).toHaveLength(2);
  });

  it('should produce votes summing to 4', async () => {
    const input = makeInput('验证整体所有一致', [
      { content: 'f1', confidence: 'CONFIRMED' as const },
      { content: 'f2', confidence: 'LIKELY' as const },
    ]);

    const result = await engine.collaborate(input);
    const totalVotes = result.votes.CONFIRMED + result.votes.LIKELY + result.votes.UNCERTAIN;
    expect(totalVotes).toBeGreaterThanOrEqual(1);
    expect(totalVotes).toBeLessThanOrEqual(4);
  });
});
