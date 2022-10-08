import { cloneDeep } from "lodash-es";
import { breadthFirstSearch, getAllEdges } from "./graph";
import { Edge, Graph } from "./types";

/**
 * Implementation using Ford-Fulkerson
 *
 * It could break when some weights are `Infinity` because there could be a flow with infinite capacity resulting in `Infinity - Infinity === NaN`.
 * Better use a "large enough" value instead of `Infinity` - unless you know there won't be a flow with infinite capacity.
 */
export const minCut = ({ graph, source, target }: { graph: Graph; source: string; target: string }): Edge[] => {
  const originalGraph = cloneDeep(graph);

  const getPathFlowCapacity = (parent: Record<string, string>) => {
    let pathFlow = Infinity;
    let vertex = target;
    while (vertex !== source) {
      pathFlow = Math.min(pathFlow, graph[parent[vertex]][vertex]);
      vertex = parent[vertex];
    }
    return pathFlow;
  };

  const sendPathFlow = (parent: Record<string, string>, pathFlowCapacity: number) => {
    let vertex = target;
    while (vertex !== source) {
      const [i, j] = [vertex, parent[vertex]];
      graph[j][i] = (graph[j][i] ?? 0) - pathFlowCapacity;
      graph[i][j] = (graph[i][j] ?? 0) + pathFlowCapacity;
      vertex = parent[vertex];
    }
  };

  while (true) {
    const { visited, parent } = breadthFirstSearch({ graph, sources: [source] });
    if (!visited[target]) break;

    const capacity = getPathFlowCapacity(parent);
    sendPathFlow(parent, capacity);
  }

  const { visited } = breadthFirstSearch({ graph, sources: [source] });

  return getAllEdges(graph).filter(([from, to]) => {
    const isInMaxFlow = graph[from][to] === 0 && originalGraph[from][to] > 0;
    const verticesDisconnected = visited[from] && !visited[to];
    return isInMaxFlow && verticesDisconnected;
  });
};
