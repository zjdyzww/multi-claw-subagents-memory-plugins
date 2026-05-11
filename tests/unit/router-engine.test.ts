import { describe, it, expect, beforeEach } from 'vitest';
import { RouterEngine } from '@multi-claw/shared-memory-core';

describe('RouterEngine', () => {
  let engine: RouterEngine;

  beforeEach(() => {
    engine = new RouterEngine();
    engine.resetStats();
  });

  it('should classify exact queries as direct', () => {
    const decision = engine.classifyQuery('什么是记忆存储');
    expect(decision.strategy).toBe('direct');
  });

  it('should classify short queries as direct', () => {
    const decision = engine.classifyQuery('id:abc');
    expect(decision.strategy).toBe('direct');
  });

  it('should classify broad queries as parallel', () => {
    const decision = engine.classifyQuery('分析所有仓库中的关键决策');
    expect(decision.strategy).toBe('parallel');
  });

  it('should classify summary queries as parallel', () => {
    const decision = engine.classifyQuery('汇总分析全部变更记录');
    expect(decision.strategy).toBe('parallel');
  });

  it('should classify chain queries as iterative', () => {
    const decision = engine.classifyQuery('如果架构变了，那么需要推理影响范围');
    expect(decision.strategy).toBe('iterative');
  });

  it('should classify why queries as iterative', () => {
    const decision = engine.classifyQuery('为什么上次部署失败了');
    expect(decision.strategy).toBe('iterative');
  });

  it('should prefer speed strategy when specified', () => {
    const decision = engine.classifyQuery('random query text longer than ten chars', {
      preferSpeed: true,
    });
    expect(decision.strategy).toBe('direct');
  });

  it('should prefer accuracy strategy when specified', () => {
    const decision = engine.classifyQuery('random query text longer than ten chars', {
      preferAccuracy: true,
    });
    expect(decision.strategy).toBe('parallel');
  });

  it('should track stats correctly', () => {
    engine.classifyQuery('id:test');
    engine.classifyQuery('id:test2');
    engine.classifyQuery('分析所有仓库');
    engine.classifyQuery('盘点汇总全部记录');
    engine.classifyQuery('为什么这样');

    const stats = engine.getStats();
    expect(stats.totalQueries).toBe(5);
    expect(stats.directCount).toBe(2);
    expect(stats.parallelCount).toBe(2);
    expect(stats.iterativeCount).toBe(1);
  });

  it('should log route decisions', () => {
    engine.classifyQuery('id:test');
    engine.classifyQuery('分析全部');

    const recent = engine.getRecentDecisions(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].decisionId).toBeDefined();
    expect(recent[0].reason).toBeDefined();
  });

  it('should include decisionId and timestamp in decisions', () => {
    const decision = engine.classifyQuery('什么是记忆');
    expect(decision.decisionId).toMatch(/route-\d+-/);
    expect(decision.timestamp).toBeDefined();
    expect(decision.targetAgents.length).toBeGreaterThan(0);
  });

  it('should handle empty query as direct', () => {
    const decision = engine.classifyQuery('');
    expect(decision.strategy).toBe('direct');
    expect(decision.reason).toContain('空查询');
  });

  it('should handle null/undefined query as direct', () => {
    const decision = engine.classifyQuery(undefined as any);
    expect(decision.strategy).toBe('direct');
  });

  it('should reset stats', () => {
    engine.classifyQuery('id:test');
    engine.classifyQuery('分析全部');
    engine.resetStats();
    const stats = engine.getStats();
    expect(stats.totalQueries).toBe(0);
  });
});
