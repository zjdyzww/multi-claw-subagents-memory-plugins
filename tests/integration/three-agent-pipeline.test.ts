import { describe, it, expect } from 'vitest';
import { System2Agent } from '@multi-claw/shared-memory-core';
import { System1Agent } from '@multi-claw/shared-memory-core';
import { ConfidenceEngine } from '@multi-claw/shared-memory-core';
import { PersonaEngine } from '@multi-claw/shared-memory-core';
import { ResidualEngine } from '@multi-claw/shared-memory-core';
import { AgentCommunicationManager } from '@multi-claw/shared-memory-core';
import type { MemoryRepresentation } from '@multi-claw/shared-memory-core';

describe('三代理协作集成测试', () => {
  it('should complete System2 → System1 → Confidence pipeline', async () => {
    const sys2 = new System2Agent('sys2-test', 'openclaw');
    const sys1 = new System1Agent('sys1-test', 'openclaw');
    const confEngine = new ConfidenceEngine();

    // Phase 1: System2 全量捕获
    await sys2.startProcessing({
      id: `pipe-${Date.now()}`,
      rawContent: '我是张三。确认使用 TypeScript 开发。可能还需要 Rust。大概三天完成。',
      facts: [],
      confidence: 'UNCERTAIN',
      source: 'conversation',
      timestamp: new Date().toISOString(),
    });
    const raw = await sys2.getResult();
    expect(raw.facts.length).toBeGreaterThan(0);

    // Phase 2: System1 精炼
    await sys1.startProcessing(raw);
    const refined = await sys1.getResult();
    expect(refined.facts.length).toBeGreaterThan(0);
    expect(refined.confidence).toBeDefined();

    // Phase 3: 置信度标注精炼结果
    const confirmed = refined.facts.filter(f => f.confidence === 'CONFIRMED');
    expect(confirmed.length).toBeGreaterThan(0);

    // Phase 4: 标注
    for (const fact of refined.facts) {
      confEngine.annotate(
        {
          id: fact.id,
          title: fact.content,
          content: fact.content,
          repoType: 'main',
          category: 'test',
          tags: [],
          accessLevel: 'SHARED',
          author: 'test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
        fact.confidence,
        'sys1-test',
        fact.content.slice(0, 30)
      );
    }

    const stats = confEngine.getStats();
    expect(stats.totalAnnotated).toBeGreaterThan(0);
  });

  it('should complete System2 → System1 → Residual pipeline', async () => {
    const sys2 = new System2Agent('sys2-r', 'openclaw');
    const sys1 = new System1Agent('sys1-r', 'openclaw');
    const residual = new ResidualEngine(100);

    await sys2.startProcessing({
      id: 'rpipe-1',
      rawContent: '这可能是个好主意，但我不确定。也许明天再说吧。',
      facts: [],
      confidence: 'UNCERTAIN',
      source: 'conversation',
      timestamp: new Date().toISOString(),
    });
    const raw = await sys2.getResult();

    await sys1.startProcessing(raw);
    const refined = await sys1.getResult();

    // 将 UNCERTAIN fact 放入残差队列
    for (const fact of refined.facts) {
      if (fact.confidence === 'UNCERTAIN') {
        residual.enqueue(fact);
      }
    }

    const info = residual.getResidualInfo();
    expect(info).toBeDefined();
    expect(info.size).toBeGreaterThanOrEqual(0);
  });

  it('should establish agent communication pipeline', () => {
    const comm = new AgentCommunicationManager({ heartbeatIntervalMs: 60000 });

    const messages: string[] = [];
    comm.connect('sys2', 'system2', 'sys1', 'system1', async (msg) => {
      messages.push(msg.type);
      return null;
    });

    const state = comm.getState('sys2', 'sys1');
    expect(state?.status).toBe('connected');
    expect(state?.fromRole).toBe('system2');
    expect(state?.toRole).toBe('system1');

    comm.shutdown();
  });

  it('should run Persona collaboration on refined output', async () => {
    const sys2 = new System2Agent('sys2-p', 'openclaw');
    const sys1 = new System1Agent('sys1-p', 'openclaw');
    const persona = new PersonaEngine();

    await sys2.startProcessing({
      id: 'ppipe-1',
      rawContent: '分析L1-L4金字塔架构设计，验证整体一致性，可能存在边界冲突需要整合汇总。',
      facts: [],
      confidence: 'UNCERTAIN',
      source: 'conversation',
      timestamp: new Date().toISOString(),
    });
    const raw = await sys2.getResult();

    await sys1.startProcessing(raw);
    const refined = await sys1.getResult();

    const result = await persona.collaborate(refined);
    expect(result.consensusConfidence).toBeDefined();
    expect(result.opinions.length).toBeGreaterThan(0);
  });
});
