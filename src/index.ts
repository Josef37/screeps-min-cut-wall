import { minCut } from "./minCut";
import { isInRegion, isNearRegion, expandRegionBy } from "./region";
import { Position, Edge, Vertex } from "./types";
import { Graph } from "./graph";
import { fromIndex, toIndex } from "./utils";

const SOURCE: Vertex = 0;
const TARGET: Vertex = 1;
const outKeyDelta = 2;
const getInKeyDelta = (roomSize: number) => outKeyDelta + roomSize ** 2;

enum TileState {
  WALL,
  BUILDABLE,
  CENTER,
  NEAR_EXIT,
  EXIT,
}

/**
 * Finds minimal wall placement to separate the center region from all exits.
 *
 * Walls are never built in the center or near exits.\
 * Make sure the center can be separated from the exists. Or you'll get stupid results!
 */
export const minCutWalls = ({
  roomSize = 50,
  isWall,
  isCenter,
}: {
  roomSize?: number;
  isWall: (pos: Position) => boolean;
  isCenter: (pos: Position) => boolean;
}) => {
  const graph = createGraph({ roomSize, isWall, isCenter });
  const edges = minCut({ graph, source: SOURCE, target: TARGET });
  return getPositionsFromCut(roomSize)(edges);
};

const createGraph = ({
  roomSize,
  isWall,
  isCenter,
}: {
  roomSize: number;
  isWall: (pos: Position) => boolean;
  isCenter: (pos: Position) => boolean;
}): Graph => {
  const graph = new Graph(2 + 2 * roomSize ** 2);
  const INFINITY = 4 * roomSize;
  const inKeyDelta = getInKeyDelta(roomSize);
  const getKey = toIndex(roomSize);
  const roomRegion = {
    left: 0,
    top: 0,
    right: roomSize - 1,
    bottom: roomSize - 1,
  };

  function* allPositionsKeyed() {
    for (let x = 0; x < roomSize; x++) {
      for (let y = 0; y < roomSize; y++) {
        const position: Position = [x, y];
        const key = getKey(position);
        yield { position, key };
      }
    }
  }
  function* allNeighborsOf([x, y]: Position) {
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0) continue;
        const neighbor: Position = [x + dx, y + dy];
        if (isOutOfBounds(neighbor)) continue;
        yield neighbor;
      }
    }
  }

  const isOnEdge = isNearRegion(expandRegionBy(-1)(roomRegion));
  const isNearEdge = isNearRegion(expandRegionBy(-2)(roomRegion));
  const isExit = (position: Position) =>
    isOnEdge(position) && !isWall(position);
  const isNearExit = (position: Position) =>
    isNearEdge(position) && [...allNeighborsOf(position)].some(isExit);
  const isOutOfBounds = (position: Position) =>
    !isInRegion(roomRegion)(position);

  const tileStates = Array(roomSize ** 2).fill(TileState.BUILDABLE);
  for (const { position, key } of allPositionsKeyed()) {
    if (isWall(position)) tileStates[key] = TileState.WALL;
    else if (isOnEdge(position)) tileStates[key] = TileState.EXIT;
    else if (isNearExit(position)) tileStates[key] = TileState.NEAR_EXIT;
    else if (isCenter(position)) tileStates[key] = TileState.CENTER;
  }

  const connectNeighbors = ({
    position,
    key,
  }: {
    position: Position;
    key: number;
  }) => {
    for (const neighbor of allNeighborsOf(position)) {
      const neighborKey = getKey(neighbor);
      const state = tileStates[neighborKey];
      if (state === TileState.WALL || state === TileState.EXIT) {
        // don't connect
      } else if (state === TileState.CENTER) {
        graph.createEdgeUnique(SOURCE, key + inKeyDelta, INFINITY);
      } else if (state === TileState.NEAR_EXIT) {
        graph.createEdgeUnique(key + outKeyDelta, TARGET, INFINITY);
      } else {
        graph.createEdge(key + outKeyDelta, neighborKey + inKeyDelta, INFINITY);
      }
    }
  };

  for (const { position, key } of allPositionsKeyed()) {
    if (tileStates[key] !== TileState.BUILDABLE) continue;

    connectNeighbors({ position, key });
    graph.createEdge(key + inKeyDelta, key + outKeyDelta, 1);
  }

  return graph;
};

const getPositionsFromCut = (roomSize: number) => {
  const fromKey = fromIndex(roomSize);
  return (edges: Edge[]) =>
    edges.map(([inKey, outKey]) => fromKey(outKey - outKeyDelta));
};

export const testable = {
  SOURCE,
  TARGET,
  outKeyDelta,
  getInKeyDelta,
  createGraph,
  getPositionsFromCut,
};
