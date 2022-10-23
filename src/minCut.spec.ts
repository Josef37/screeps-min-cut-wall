import "jest-extended";
import { Graph } from "./graph";

import { minCut } from "./minCut";

describe("minCut", () => {
  it("works for a simple example", () => {
    const graph = new Graph(6);
    graph.createEdge(0, 1, 16);
    graph.createEdge(0, 2, 13);
    graph.createEdge(1, 2, 10);
    graph.createEdge(1, 3, 12);
    graph.createEdge(2, 1, 4);
    graph.createEdge(2, 4, 14);
    graph.createEdge(3, 2, 9);
    graph.createEdge(3, 5, 20);
    graph.createEdge(4, 3, 7);
    graph.createEdge(4, 5, 4);
    const source = 0;
    const target = 5;

    const edges = minCut({ graph, source, target });

    const expected = [
      [1, 3],
      [4, 3],
      [4, 5],
    ];

    expect(edges).toIncludeSameMembers(expected);
  });

  it("only returns edges connecting two components in the residual graph", () => {
    const graph = new Graph(4);
    graph.createEdge(0, 1, 1000);
    graph.createEdge(0, 2, 1);
    graph.createEdge(1, 2, 1000);
    graph.createEdge(1, 3, 1);
    graph.createEdge(2, 3, 1);
    const source = 0;
    const target = 3;

    const edges = minCut({ graph, source, target });

    const expected = [
      [1, 3],
      [2, 3],
    ];

    expect(edges).toIncludeSameMembers(expected);
  });

  it("allows `Infinity` als weight as long as there is no infinite flow", () => {
    const graph = new Graph(4);
    graph.createEdge(0, 1, Infinity);
    graph.createEdge(0, 2, 1);
    graph.createEdge(1, 2, Infinity);
    graph.createEdge(1, 3, 1);
    graph.createEdge(2, 3, 1);
    const source = 0;
    const target = 3;

    const edges = minCut({ graph, source, target });

    const expected = [
      [1, 3],
      [2, 3],
    ];

    expect(edges).toIncludeSameMembers(expected);
  });

  it("also works if source and target are already disconnected", () => {
    const graph = new Graph(2);
    const source = 0;
    const target = 1;

    const edges = minCut({ graph, source, target });

    expect(edges).toHaveLength(0);
  });
});
