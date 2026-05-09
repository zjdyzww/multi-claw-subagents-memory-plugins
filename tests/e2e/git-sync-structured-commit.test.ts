import { describe, it, expect } from 'vitest';
import { buildStructuredMessage, buildStructuredMessageWithContext, getAgentAuthor } from '@multi-claw/shared-memory-core';

describe('Git Sync E2E — Structured Commits', () => {
  it('should build structured commit message with prefix', () => {
    const msg = buildStructuredMessage('Add important decision');
    expect(msg).toContain('Add important decision');
    expect(msg).toContain('Author:');
    expect(msg).toContain('multi-claw@memory.system');
  });

  it('should build structured commit with full context', () => {
    const msg = buildStructuredMessageWithContext(
      '关键决策采纳',
      {
        confidence: 'CONFIRMED',
        source: 'openclaw',
        memoryType: 'decision',
        traceabilityId: 'trace-abc-123',
        agentId: 'openclaw-agent',
        agentType: 'openclaw',
        factCount: 5,
      }
    );

    expect(msg).toContain('[CONFIRMED]');
    expect(msg).toContain('[openclaw]');
    expect(msg).toContain('[decision]');
    expect(msg).toContain('traceabilityId: trace-abc-123');
    expect(msg).toContain('Agent: openclaw-agent');
    expect(msg).toContain('Facts: 5');
    expect(msg).toContain('OpenClaw Agent');
  });

  it('should produce correct agent authors for all gateways', () => {
    expect(getAgentAuthor('openclaw')).toContain('OpenClaw Agent');
    expect(getAgentAuthor('hermes')).toContain('Hermes Agent');
    expect(getAgentAuthor('claude-code')).toContain('Claude Code Agent');
    expect(getAgentAuthor('opencode')).toContain('OpenCode Agent');
    expect(getAgentAuthor('default')).toContain('Multi-Claw Memory System');
    expect(getAgentAuthor(undefined)).toContain('Multi-Claw Memory System');
  });

  it('should produce compact message without context', () => {
    const msg = buildStructuredMessageWithContext(
      'simple update',
      undefined,
      { author: 'test', email: 'test@test.com' }
    );

    expect(msg).not.toContain('[');
    expect(msg).toContain('simple update');
    expect(msg).toContain('Author: test');
  });

  it('should include traceabilityId in commit body', () => {
    const msg = buildStructuredMessageWithContext(
      'document change',
      {
        traceabilityId: 'tid-2026-001',
      }
    );

    expect(msg).toContain('traceabilityId: tid-2026-001');
  });

  it('should handle all confidence levels in prefix', () => {
    const levels = ['CONFIRMED', 'LIKELY', 'UNCERTAIN'] as const;
    for (const level of levels) {
      const msg = buildStructuredMessageWithContext('test', { confidence: level });
      expect(msg).toContain(`[${level}]`);
    }
  });
});
