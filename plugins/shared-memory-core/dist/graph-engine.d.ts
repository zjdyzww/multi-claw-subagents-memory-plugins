/**
 * Graph Engine — 记忆图结构建模引擎
 *
 * 节点 = MemoryDocument | 边 = 语义关系
 * 支持 BFS/DFS 遍历，1000+ 节点高效查询
 */
import { EventEmitter } from 'eventemitter3';
import type { MemoryDocument } from './types.js';
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
export declare class GraphEngine extends EventEmitter {
    private nodes;
    private edges;
    private adjacency;
    /**
     * 添加节点
     */
    addNode(document: MemoryDocument, labels?: string[]): GraphNode;
    /**
     * 添加边（关系）
     */
    addEdge(sourceId: string, targetId: string, type: RelationType, weight?: number): GraphEdge | null;
    /**
     * BFS 遍历（从指定节点出发）
     */
    bfs(startId: string, maxDepth?: number): TraversalResult[];
    /**
     * DFS 遍历
     */
    dfs(startId: string, maxDepth?: number): TraversalResult[];
    /**
     * 获取指定节点的邻居子图
     */
    getNeighbors(nodeId: string, radius?: number): SubgraphResult;
    /**
     * 按关系类型查询边
     */
    getEdgesByType(type: RelationType): GraphEdge[];
    /**
     * 按标签查询节点
     */
    getNodesByLabel(label: string): GraphNode[];
    /**
     * 获取图统计
     */
    getStats(): GraphStats;
    /**
     * 清除图
     */
    clear(): void;
    private findEdge;
}
export declare const graphEngine: GraphEngine;
export {};
//# sourceMappingURL=graph-engine.d.ts.map