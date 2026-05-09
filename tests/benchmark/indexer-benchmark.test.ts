import { describe, it, expect } from 'vitest';
import { IndexEngine } from '@multi-claw/shared-memory-core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Benchmark — IndexEngine Performance', () => {
  const TARGET_DOCS = 100;
  const MAX_INDEX_MS = 5000;
  const MAX_SEARCH_MS = 500;

  it(`should index ${TARGET_DOCS} documents within ${MAX_INDEX_MS}ms`, () => {
    const engine = new IndexEngine();
    const tmpDir = path.join(os.tmpdir(), `benchmark-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      // Create test documents
      for (let i = 0; i < TARGET_DOCS; i++) {
        const content = [
          '---',
          `title: "Benchmark Document ${i}"`,
          `tags: [benchmark, test, category-${i % 5}]`,
          `author: benchmark`,
          `createdAt: "${new Date().toISOString()}"`,
          `updatedAt: "${new Date().toISOString()}"`,
          `category: "category-${i % 5}"`,
          '---',
          `This is benchmark document ${i}. It contains sample content for testing indexing performance. `,
          `The purpose is to measure how fast the IndexEngine can process ${TARGET_DOCS} markdown files.`.repeat(2),
        ].join('\n');

        fs.writeFileSync(path.join(tmpDir, `doc-${i}.md`), content, 'utf-8');
      }

      const start = Date.now();
      engine.indexRepo(tmpDir, 'main');
      const elapsed = Date.now() - start;

      const stats = engine.getIndexStats();
      expect(stats.main).toBeGreaterThanOrEqual(Math.floor(TARGET_DOCS * 0.90));
      expect(elapsed).toBeLessThanOrEqual(MAX_INDEX_MS);

      // Search benchmark
      const searchStart = Date.now();
      const results = engine.searchMemory({ text: 'benchmark document', repoTypes: ['main'] as any, limit: 10 });
      const searchElapsed = Date.now() - searchStart;
      expect(results).toBeDefined();
      expect(searchElapsed).toBeLessThanOrEqual(MAX_SEARCH_MS);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 10000);

  it('should perform sub-100ms single document index', () => {
    const engine = new IndexEngine();
    const tmpDir = path.join(os.tmpdir(), `bench-single-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      fs.writeFileSync(path.join(tmpDir, 'single.md'), [
        '---',
        'title: "Single Doc"',
        'tags: [fast]',
        'author: benchmark',
        '---',
        'Fast indexing test.',
      ].join('\n'), 'utf-8');

      const start = Date.now();
      engine.indexDocument('main', path.join(tmpDir, 'single.md'));
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThanOrEqual(100);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should search among indexed docs with scoring', async () => {
    const engine = new IndexEngine();
    const tmpDir = path.join(os.tmpdir(), `bench-search-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      fs.writeFileSync(path.join(tmpDir, 'important.md'), [
        '---',
        'title: "Important Decision: Architecture"',
        'tags: [architecture, decision]',
        'author: test',
        '---',
        'The team decided on a four-layer L1-L4 architecture.',
      ].join('\n'), 'utf-8');

      fs.writeFileSync(path.join(tmpDir, 'other.md'), [
        '---',
        'title: "Random Note"',
        'tags: [misc]',
        'author: test',
        '---',
        'Just a random note.',
      ].join('\n'), 'utf-8');

      engine.indexRepo(tmpDir, 'main');

      const results = await engine.searchMemory({ text: 'architecture', repoTypes: ['main'], limit: 5 });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].document.title).toContain('Architecture');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
