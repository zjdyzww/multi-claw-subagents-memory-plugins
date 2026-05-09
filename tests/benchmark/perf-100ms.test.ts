import { describe, it, expect } from 'vitest';
import { IndexEngine } from '@multi-claw/shared-memory-core';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Performance — IndexEngine latency < 100ms', () => {
  it('should search 1000 docs under 100ms', () => {
    const engine = new IndexEngine();
    const tmpDir = path.join(os.tmpdir(), `perf-1k-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      for (let i = 0; i < 1000; i++) {
        fs.writeFileSync(
          path.join(tmpDir, `doc-${i}.md`),
          `---\ntitle: "Doc ${i}"\ntags: [cat-${i % 10}]\n---\nContent for document ${i}. Performance test.`,
          'utf-8'
        );
      }

      engine.indexRepo(tmpDir, 'main');

      // Warm up
      engine.searchMemory({ text: 'performance', repoTypes: ['main'], limit: 10 });

      // Measure
      const start = Date.now();
      engine.searchMemory({ text: 'performance', repoTypes: ['main'], limit: 10 });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThanOrEqual(100);

      const perf = engine.getSearchPerformance();
      expect(perf.lastMs).toBeLessThanOrEqual(100);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }, 10000);
});
