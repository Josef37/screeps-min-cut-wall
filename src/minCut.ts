import { Graph } from "./graph";
import { Edge, Vertex } from "./types";

/**
 * Implementation using Dinic's algorithm
 *
 * It could break when some weights are `Infinity` because there could be a flow with infinite capacity resulting in `Infinity - Infinity === NaN`.
 * Better use a "large enough" value instead of `Infinity` - unless you know there won't be a flow with infinite capacity.
 */
export const minCut = ({
  graph,
  source,
  target,
}: {
  graph: Graph;
  source: Vertex;
  target: Vertex;
}): Edge[] => {
  const augment = ([from, to]: Edge, capacity: number) => {
    graph.addWeight(from, to, -capacity);
    graph.addWeight(to, from, capacity);
  };

  const findFlowAndAugment = (levels: Record<Vertex, number>) => {
    const findFlowRecursive = (
      current: Vertex,
      currentCapacity: number
    ): number => {
      if (current === target) return currentCapacity;

      for (const { vertex: next, weight: capacity } of graph.iterateEdgesFrom(
        current
      )) {
        const isInNextLevel = levels[current] + 1 === levels[next];
        if (!isInNextLevel || capacity <= 0) continue;

        const nextCapacity = Math.min(currentCapacity, capacity);
        const flow = findFlowRecursive(next, nextCapacity);
        if (flow > 0) {
          augment([current, next], flow);
          return flow;
        }
      }
      // This is a dead end...
      levels[current] = -1;
      return 0;
    };
    return findFlowRecursive(source, Number.MAX_SAFE_INTEGER);
  };

  while (true) {
    const { levels, isConnected } = graph.breadthFirstSearch(source);
    if (!isConnected(target)) break;

    while (true) {
      const flow = findFlowAndAugment(levels);
      if (flow === 0) break;
    }
  }

  return graph.getFilledEdgesOnEdge(source);
};
