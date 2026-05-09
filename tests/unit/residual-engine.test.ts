import { describe, it, expect, beforeEach } from 'vitest';
import { ResidualEngine } from '@multi-claw/shared-memory-core';

describe('ResidualEngine', () => {
  let engine: ResidualEngine;

  beforeEach(() => {
    engine = new ResidualEngine(100);
  });

  it('should calculate residual score R = Σ(size × age_weight)', () => {
    engine.enqueue({
      id: 'f1',
      content: 'Hello World',
      confidence: 'UNCERTAIN',
      source: 'test',
      category: 'test',
      verified: false,
    });

    const info = engine.getResidualInfo();
    expect(info.size).toBe(1);
    expect(info.residualScore).toBeGreaterThan(0);
  });

  it('should start and stop periodic checks', () => {
    engine.start();
    expect(engine.getStats().totalResiduals).toBe(0);
    engine.stop();
  });

  it('should enqueue and resolve residuals', () => {
    engine.enqueue({
      id: 'f1',
      content: 'Test fact',
      confidence: 'UNCERTAIN',
      source: 'test',
      category: 'test',
      verified: false,
    });

    expect(engine.getQueue().length).toBe(1);
    const record = engine.resolve('f1', 'active');
    expect(record.success).toBe(true);
    expect(engine.getQueue().length).toBe(0);
  });

  it('should prevent duplicate entries', () => {
    const fact = {
      id: 'f1',
      content: 'Test fact',
      confidence: 'UNCERTAIN' as const,
      source: 'test',
      category: 'test',
      verified: false,
    };

    engine.enqueue(fact);
    engine.enqueue(fact);
    expect(engine.getQueue().length).toBe(1);
  });

  it('should persist and restore via serialization', () => {
    engine.enqueue({
      id: 'f1',
      content: 'Test',
      confidence: 'UNCERTAIN',
      source: 'test',
      category: 'test',
      verified: false,
    });

    const json = engine.serialize();
    expect(json).toContain('f1');

    const engine2 = new ResidualEngine(100);
    engine2.deserialize(json);
    expect(engine2.getQueue().length).toBe(1);
  });

  it('should compute ageWeight per layer', () => {
    engine.enqueue({
      id: 'f1',
      content: 'Short',
      confidence: 'UNCERTAIN',
      source: 'test',
      category: 'test',
      verified: false,
    });

    const info = engine.getResidualInfo();
    expect(info.cleanupLayer).toBeGreaterThanOrEqual(1);
    expect(info.cleanupLayer).toBeLessThanOrEqual(3);
  });

  it('should provide stats with layer counts', () => {
    for (let i = 0; i < 3; i++) {
      engine.enqueue({
        id: `f${i}`,
        content: 'Test fact content',
        confidence: 'UNCERTAIN',
        source: 'test',
        category: 'test',
        verified: false,
      });
    }

    const stats = engine.getStats();
    expect(stats.totalResiduals).toBe(3);
    expect(stats.layer1Count + stats.layer2Count + stats.layer3Count).toBe(3);
  });
});
