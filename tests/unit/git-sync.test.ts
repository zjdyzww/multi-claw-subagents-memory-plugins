import { describe, it, expect, beforeEach } from 'vitest';
import { buildStructuredMessage, buildStructuredMessageWithContext, getAgentAuthor, gitSyncManager } from '@multi-claw/shared-memory-core';

describe('GitSyncManager', () => {
  it('should return registered repos as array', () => {
    const repos = gitSyncManager.getRegisteredRepos();
    expect(Array.isArray(repos)).toBe(true);
  });
});

describe('buildStructuredMessage', () => {
  it('should build a structured commit message', () => {
    const msg = buildStructuredMessage('Test summary', { author: 'Test Author', email: 'test@test.com' });
    expect(msg).toContain('Test summary');
    expect(msg).toContain('Test Author');
  });

  it('should use default author when not provided', () => {
    const msg = buildStructuredMessage('Default author test');
    expect(msg).toContain('Multi-Claw Memory System');
  });
});

describe('buildStructuredMessageWithContext', () => {
  it('should include confidence and source prefix', () => {
    const msg = buildStructuredMessageWithContext('Context test', { confidence: 'CONFIRMED', source: 'openclaw', memoryType: 'fact', agentId: 'agent-1', factCount: 5, traceabilityId: 'trace-abc' });
    expect(msg).toContain('[CONFIRMED]');
    expect(msg).toContain('[openclaw]');
    expect(msg).toContain('[fact]');
    expect(msg).toContain('Context test');
    expect(msg).toContain('trace-abc');
    expect(msg).toContain('Agent: agent-1');
    expect(msg).toContain('Facts: 5');
  });

  it('should handle empty context', () => {
    const msg = buildStructuredMessageWithContext('No context');
    expect(msg).toContain('No context');
    expect(msg).not.toContain('[CONFIRMED]');
  });
});

describe('getAgentAuthor', () => {
  it('should return author for known agent types', () => {
    expect(getAgentAuthor('openclaw')).toContain('OpenClaw Agent');
    expect(getAgentAuthor('hermes')).toContain('Hermes Agent');
    expect(getAgentAuthor('opencode')).toContain('OpenCode Agent');
    expect(getAgentAuthor('claude-code')).toContain('Claude Code Agent');
  });

  it('should return default for unknown types', () => {
    expect(getAgentAuthor('unknown')).toContain('Multi-Claw Memory System');
  });

  it('should return default when no type provided', () => {
    expect(getAgentAuthor()).toContain('Multi-Claw Memory System');
  });
});
