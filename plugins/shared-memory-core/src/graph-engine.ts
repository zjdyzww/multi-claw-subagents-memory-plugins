/**
 * Graph Engine — 记忆图结构建模引擎
 *
 * 节点 = MemoryDocument | 边 = 语义关系
 * 支持 BFS/DFS 遍历，1000+ 节点高效查询
 */

import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument, RepoType } from './types.js';

type RelationType = 'refers' | 'derives' | 'contradicts' | 'supports' | 'parent' | 'child' | 'context';

interface GraphNode {
  id: string;
  document: MemoryDocument;
  labels: string[];
  properties: Record<string, string>;
  inDegree: number;
  outDegree: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationType;
  weight: number;
  createdAt: string;
  properties: Record<string, string>;
}

interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  avgDegree: number;
  maxDegree: number;
  density: number;
  byRelationType: Record<string, number>;
  byCategory: Record<string, number>;
}

interface TraversalResult {
  path: string[];
  edges: GraphEdge[];
  length: number;
}

interface SubgraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphEngine extends EventEmitter {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();

  /**
   * 添加节点
   */
  addNode(document: MemoryDocument, labels: string[] = []): GraphNode {
    const node: GraphNode = {
      id: document.id,
      document,
      labels: [...labels, document.category || 'general'],
      properties: {
        title: document.title,
        author: document.author,
        repoType: document.repoType,
        tags: (document.tags || []).join(','),
      },
      inDegree: 0,
      outDegree: 0,
    };

    this.nodes.set(node.id, node);
    if (!this.adjacency.has(node.id)) {
      this.adjacency.set(node.id, new Set());
    }

    this.emit('nodeAdded', { nodeId: node.id, labels: node.labels });
    return node;
  }

  /**
   * 添加边（关系）
   */
  addEdge(
    sourceId: string,
    targetId: string,
    type: RelationType,
    weight = 1.0
  ): GraphEdge | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return null;
    }

    const edge: GraphEdge = {
      id: `e-${sourceId}-${targetId}-${type}`,
      source: sourceId,
      target: targetId,
      type,
      weight,
      createdAt: new Date().toISOString(),
      properties: {},
    };

    this.edges.set(edge.id, edge);

    // 更新邻接表
    const neighbors = this.adjacency.get(sourceId);
    if (neighbors) {
      neighbors.add(targetId);
    }

    // 更新度数
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);
    if (sourceNode) sourceNode.outDegree++;
    if (targetNode) targetNode.inDegree++;

    this.emit('edgeAdded', { edgeId: edge.id, source: sourceId, target: targetId, type });
    return edge;
  }

  /**
   * BFS 遍历（从指定节点出发）
   */
  bfs(startId: string, maxDepth = 3): TraversalResult[] {
    const results: TraversalResult[] = [];
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[]; edges: GraphEdge[]; depth: number }> = [
      { nodeId: startId, path: [startId], edges: [], depth: 0 },
    ];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const neighbors = this.adjacency.get(current.nodeId);
      if (!neighbors) continue;

      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        // Find edge
        const edge = this.findEdge(current.nodeId, neighborId);
        const newPath = [...current.path, neighborId];
        const newEdges = edge ? [...current.edges, edge] : current.edges;

        results.push({
          path: newPath,
          edges: newEdges,
          length: newPath.length - 1,
        });

        queue.push({
          nodeId: neighborId,
          path: newPath,
          edges: newEdges,
          depth: current.depth + 1,
        });
      }
    }

    return results;
  }

  /**
   * DFS 遍历
   */
  dfs(startId: string, maxDepth = 3): TraversalResult[] {
    const results: TraversalResult[] = [];
    const visited = new Set<string>();

    const explore = (nodeId: string, path: string[], edges: GraphEdge[], depth: number) => {
      if (depth >= maxDepth || visited.has(nodeId)) return;
      visited.add(nodeId);

      const neighbors = this.adjacency.get(nodeId);
      if (!neighbors) return;

      for (const neighborId of neighbors) {
        const edge = this.findEdge(nodeId, neighborId);
        const newPath = [...path, neighborId];
        const newEdges = edge ? [...edges, edge] : edges;

        results.push({
          path: newPath,
          edges: newEdges,
          length: newPath.length - 1,
        });

        explore(neighborId, newPath, newEdges, depth + 1);
      }
    };

    explore(startId, [startId], [], 0);
    return results;
  }

  /**
   * 获取指定节点的邻居子图
   */
  getNeighbors(nodeId: string, radius = 1): SubgraphResult {
    const visitedNodes = new Set<string>();
    const visitedEdges: GraphEdge[] = [];

    const expand = (id: string, currentRadius: number) => {
      if (currentRadius > radius || visitedNodes.has(id)) return;
      visitedNodes.add(id);

      const neighbors = this.adjacency.get(id);
      if (!neighbors) return;

      for (const neighborId of neighbors) {
        const edge = this.findEdge(id, neighborId);
        if (edge) visitedEdges.push(edge);
        expand(neighborId, currentRadius + 1);
      }
    };

    expand(nodeId, 0);

    return {
      nodes: Array.from(visitedNodes).map(id => this.nodes.get(id)!).filter(Boolean),
      edges: visitedEdges,
    };
  }

  /**
   * 按关系类型查询边
   */
  getEdgesByType(type: RelationType): GraphEdge[] {
    return Array.from(this.edges.values()).filter(e => e.type === type);
  }

  /**
   * 按标签查询节点
   */
  getNodesByLabel(label: string): GraphNode[] {
    return Array.from(this.nodes.values()).filter(n => n.labels.includes(label));
  }

  /**
   * 获取图统计
   */
  getStats(): GraphStats {
    const nodes = Array.from(this.nodes.values());
    const edges = Array.from(this.edges.values());

    const byRelationType: Record<string, number> = {};
    for (const e of edges) {
      byRelationType[e.type] = (byRelationType[e.type] || 0) + 1;
    }

    const byCategory: Record<string, number> = {};
    for (const n of nodes) {
      byCategory[n.document.category] = (byCategory[n.document.category] || 0) + 1;
    }

    const degrees = nodes.map(n => n.inDegree + n.outDegree);
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;
    const avgDegree = nodes.length > 0
      ? Math.round(degrees.reduce((a, b) => a + b, 0) / nodes.length * 100) / 100
      : 0;

    // 密度: 2|E| / (|V|(|V|-1))
    const n = nodes.length;
    const density = n > 1
      ? Math.round((2 * edges.length) / (n * (n - 1)) * 10000) / 10000
      : 0;

    return {
      nodeCount: n,
      edgeCount: edges.length,
      avgDegree,
      maxDegree,
      density,
      byRelationType,
      byCategory,
    };
  }

  /**
   * 清除图
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
  }

  // ============================================================
  // 内部
  // ============================================================

  private findEdge(source: string, target: string): GraphEdge | undefined {
    return Array.from(this.edges.values()).find(
      e => e.source === source && e.target === target
    );
  }
}

export const graphEngine = new GraphEngine();
