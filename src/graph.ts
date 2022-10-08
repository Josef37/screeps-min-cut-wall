import { fromPairs } from "lodash-es";
import { Edge, Graph } from "./types";

export const breadthFirstSearch = ({ graph, sources }: { graph: Graph; sources: string[] }) => {
  const parent: Record<string, string> = {};
  const visited = fromPairs(sources.map(source => [source, true]));
  const queue = sources.slice();

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const neighbor in graph[current]) {
      const weight = graph[current][neighbor];
      if (!visited[neighbor] && weight > 0) {
        queue.push(neighbor);
        visited[neighbor] = true;
        parent[neighbor] = current;
      }
    }
  }

  return { visited, parent };
};

export function* iterateEdges(graph: Graph) {
  for (const from in graph) {
    const list = graph[from];
    for (const to in list) {
      yield [from, to] as Edge;
    }
  }
}

export const getAllEdges = (graph: Graph) => [...iterateEdges(graph)];
