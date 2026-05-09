import { describe, it, expect, beforeEach } from 'vitest';
import { ConfidenceEngine } from '@multi-claw/shared-memory-core';
import type { MemoryDocument } from '@multi-claw/shared-memory-core';

describe('ConfidenceEngine', () => {
  let engine: ConfidenceEngine;

  function makeDoc(id: string, confidence?: string): MemoryDocument {
    return {
      id,
      title: `Doc ${id}`,
      content: 'Test content',
      repoType: 'main',
      category: 'test',
      tags: [],
      accessLevel: 'SHARED',
      author: 'test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
  }

  beforeEach(() => {
    engine = new ConfidenceEngine();
  });

  it('should annotate a document with confidence level', () => {
    const doc = makeDoc('doc1');
    const annotated = engine.annotate(doc, 'CONFIRMED', 'openclaw', 'user-statement', '用户明确表达');

    expect(annotated.confidence).toBe('CONFIRMED');
    expect(annotated.confidenceChain).toHaveLength(1);
    expect(annotated.confidenceChain![0].level).toBe('CONFIRMED');
  });

  it('should store and retrieve confidence metadata', () => {
    const doc = makeDoc('doc1');
    engine.annotate(doc, 'LIKELY', 'hermes', 'inference', '推断结果');

    const meta = engine.getMetadata('doc1');
    expect(meta).toBeDefined();
    expect(meta!.currentLevel).toBe('LIKELY');
    expect(meta!.chain).toHaveLength(1);
  });

  it('should handle CASE 1: higher confidence replaces lower', () => {
    const doc = makeDoc('doc1');
    engine.annotate(doc, 'UNCERTAIN', 'agent1', 'initial');
    const annotated = engine.annotate(
      { ...doc, confidence: 'UNCERTAIN' },
      'CONFIRMED',
      'agent2',
      'verified-refined'
    );

    expect(annotated.confidence).toBe('CONFIRMED');
    expect(annotated.confidenceChain).toHaveLength(2);
  });

  it('should handle CASE 2: equal confidence keeps both with conflict', () => {
    const doc = makeDoc('doc1');
    engine.annotate(doc, 'LIKELY', 'agent1', 'source1');
    engine.annotate({ ...doc, confidence: 'LIKELY' }, 'LIKELY', 'agent2', 'source2');

    const meta = engine.getMetadata('doc1');
    expect(meta!.conflictDetected).toBe(true);
  });

  it('should handle CASE 3: lower confidence is ignored', () => {
    const doc = makeDoc('doc1');
    engine.annotate(doc, 'CONFIRMED', 'agent1', 'verified');
    const annotated = engine.annotate(
      { ...doc, confidence: 'CONFIRMED' },
      'UNCERTAIN',
      'agent2',
      'unreliable'
    );

    expect(annotated.confidence).toBe('CONFIRMED');
  });

  it('should annotate a batch of documents', () => {
    const docs = [makeDoc('d1'), makeDoc('d2'), makeDoc('d3')];
    const result = engine.annotateBatch(docs, 'CONFIRMED', 'batch-test');
    expect(result).toHaveLength(3);
    expect(result[0].confidence).toBe('CONFIRMED');
  });

  it('should track confidence stats', () => {
    engine.annotate(makeDoc('d1'), 'CONFIRMED', 'a', 's');
    engine.annotate(makeDoc('d2'), 'LIKELY', 'a', 's');
    engine.annotate(makeDoc('d3'), 'LIKELY', 'a', 's');
    engine.annotate(makeDoc('d4'), 'UNCERTAIN', 'a', 's');

    const stats = engine.getStats();
    expect(stats.totalAnnotated).toBe(4);
    expect(stats.confirmedCount).toBe(1);
    expect(stats.likelyCount).toBe(2);
    expect(stats.uncertainCount).toBe(1);
  });

  it('should return UNCERTAIN for unannotated docs', () => {
    expect(engine.getConfidence('non-existent')).toBe('UNCERTAIN');
  });

  it('should track conflicts', () => {
    const doc = makeDoc('doc1');
    engine.annotate(doc, 'LIKELY', 'agent1', 's1');
    engine.annotate({ ...doc, confidence: 'LIKELY' }, 'LIKELY', 'agent2', 's2');

    const conflicts = engine.getConflicts();
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].docId).toBe('doc1');
  });
});
