/**
 * Metacognition Engine — 记忆质量自我评估与修正引擎
 *
 * 评估维度：完整性 / 时效性 / 一致性 / 置信度分布
 * 输出质量评分 + 改进建议
 */

import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument, ConfidenceLevel } from './types.js';

interface QualityScore {
  overall: number;      // 0-100
  completeness: number;
  freshness: number;
  consistency: number;
  confidenceBalance: number;
}

interface QualityReport {
  documentId: string;
  title: string;
  scores: QualityScore;
  issues: QualityIssue[];
  recommendations: string[];
  assessedAt: string;
}

interface QualityIssue {
  type: 'missing_content' | 'stale' | 'inconsistent' | 'low_confidence' | 'no_tags';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface MetacognitionStats {
  totalAssessed: number;
  averageScore: number;
  highQualityCount: number;
  needsAttentionCount: number;
  topIssues: Array<{ type: string; count: number }>;
}

export class MetacognitionEngine extends EventEmitter {
  private reports: Map<string, QualityReport> = new Map();

  // 评估阈值
  private readonly STALE_THRESHOLD_DAYS = 30;
  private readonly MIN_CONTENT_LENGTH = 50;
  private readonly MIN_TAGS = 1;

  /**
   * 评估单个文档的记忆质量
   */
  assess(document: MemoryDocument): QualityReport {
    const issues: QualityIssue[] = [];
    const recommendations: string[] = [];

    // 1. 完整性评分
    const completenessScore = this.scoreCompleteness(document, issues, recommendations);

    // 2. 时效性评分
    const freshnessScore = this.scoreFreshness(document, issues, recommendations);

    // 3. 一致性评分
    const consistencyScore = this.scoreConsistency(document, issues, recommendations);

    // 4. 置信度平衡评分
    const confidenceBalanceScore = this.scoreConfidenceBalance(document, issues, recommendations);

    // 综合评分
    const overall = Math.round(
      (completenessScore + freshnessScore + consistencyScore + confidenceBalanceScore) / 4
    );

    const report: QualityReport = {
      documentId: document.id,
      title: document.title,
      scores: {
        overall,
        completeness: completenessScore,
        freshness: freshnessScore,
        consistency: consistencyScore,
        confidenceBalance: confidenceBalanceScore,
      },
      issues,
      recommendations,
      assessedAt: new Date().toISOString(),
    };

    this.reports.set(document.id, report);
    this.emit('assessmentComplete', { docId: document.id, score: overall });

    return report;
  }

  /**
   * 批量评估
   */
  assessBatch(documents: MemoryDocument[]): QualityReport[] {
    return documents.map(doc => this.assess(doc));
  }

  /**
   * 获取评估报告
   */
  getReport(docId: string): QualityReport | undefined {
    return this.reports.get(docId);
  }

  /**
   * 获取统计
   */
  getStats(): MetacognitionStats {
    const reports = Array.from(this.reports.values());
    const avgScore = reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.scores.overall, 0) / reports.length)
      : 0;

    const issueCounts = new Map<string, number>();
    for (const r of reports) {
      for (const issue of r.issues) {
        issueCounts.set(issue.type, (issueCounts.get(issue.type) || 0) + 1);
      }
    }

    const topIssues = Array.from(issueCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalAssessed: reports.length,
      averageScore: avgScore,
      highQualityCount: reports.filter(r => r.scores.overall >= 80).length,
      needsAttentionCount: reports.filter(r => r.scores.overall < 50).length,
      topIssues,
    };
  }

  // ============================================================
  // 评分函数
  // ============================================================

  private scoreCompleteness(doc: MemoryDocument, issues: QualityIssue[], recs: string[]): number {
    let score = 100;

    if (!doc.title || doc.title === 'Untitled') {
      score -= 15;
      issues.push({ type: 'missing_content', severity: 'medium', description: '缺少标题' });
      recs.push('添加有意义的标题');
    }

    if (!doc.content || doc.content.length < this.MIN_CONTENT_LENGTH) {
      score -= 20;
      issues.push({ type: 'missing_content', severity: 'high', description: '内容过短' });
      recs.push('扩展记忆内容（建议 >= 50 字符）');
    }

    if (!doc.tags || doc.tags.length < this.MIN_TAGS) {
      score -= 10;
      issues.push({ type: 'no_tags', severity: 'low', description: '缺少标签' });
      recs.push('添加至少 1 个标签以提高检索效率');
    }

    return Math.max(0, score);
  }

  private scoreFreshness(doc: MemoryDocument, issues: QualityIssue[], recs: string[]): number {
    let score = 100;

    const updatedDate = new Date(doc.updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > this.STALE_THRESHOLD_DAYS) {
      score -= 40;
      issues.push({ type: 'stale', severity: 'high', description: `超过 ${this.STALE_THRESHOLD_DAYS} 天未更新` });
      recs.push('审查并更新过期内容');
    } else if (daysSinceUpdate > this.STALE_THRESHOLD_DAYS / 2) {
      score -= 15;
      issues.push({ type: 'stale', severity: 'medium', description: `超过 ${Math.round(this.STALE_THRESHOLD_DAYS / 2)} 天未更新` });
    }

    return Math.max(0, score);
  }

  private scoreConsistency(doc: MemoryDocument, issues: QualityIssue[], recs: string[]): number {
    let score = 100;

    // Author consistency
    if (doc.author && doc.author === 'unknown') {
      score -= 5;
    }

    // Content-author relevance
    if (doc.content.includes(doc.author) && doc.author.length > 3) {
      score -= 10;
      issues.push({ type: 'inconsistent', severity: 'low', description: '内容包含作者名' });
    }

    return Math.max(0, score);
  }

  private scoreConfidenceBalance(doc: MemoryDocument, issues: QualityIssue[], recs: string[]): number {
    let score = 100;

    if (!doc.confidence) {
      score -= 25;
      issues.push({ type: 'low_confidence', severity: 'medium', description: '未设置置信度' });
      recs.push('使用 confidence-engine 标注置信度');
    } else if (doc.confidence === 'UNCERTAIN') {
      score -= 15;
      issues.push({ type: 'low_confidence', severity: 'low', description: '置信度为 UNCERTAIN' });
      recs.push('尝试通过额外验证提升置信度');
    }

    return Math.max(0, score);
  }
}

export const metacognitionEngine = new MetacognitionEngine();
