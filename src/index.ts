import { fromPairs, mapKeys, range, toPairs } from "lodash-es";
import { ROOM_SIZE } from "./constants";
import { minCut } from "./minCut";
import { expandRegionBy, isInRegion, isNearRegion } from "./region";
import { Edge, Graph, Position } from "./types";
import { not } from "./typescript";

const SOURCE = "source";
const TARGET = "target";

/**
 * Finds minimal wall placement to separate the center region from all exits.
 *
 * Walls are never built in the center or on exits.\
 * Make sure the center can be separated from the exists. Or you'll get stupid results!
 */
export const minCutWalls = ({
  roomSize = ROOM_SIZE,
  isWall,
  isCenter,
}: {
  roomSize?: number;
  isWall: (pos: Position) => boolean;
  isCenter: (pos: Position) => boolean;
}) => {
  const initialGraph = createInitialGraph({ roomSize, isWall, isCenter });
  const transformedGraph = transformGraph(initialGraph);
  const cut = minCut({ graph: transformedGraph, source: SOURCE, target: TARGET });
  return getPositionsFromCut(cut);
};

const createInitialGraph = ({
  roomSize,
  isWall,
  isCenter,
}: {
  roomSize: number;
  isWall: (pos: Position) => boolean;
  isCenter: (pos: Position) => boolean;
}): Graph => {
  const graph: Graph = { [SOURCE]: {}, [TARGET]: {} };
  const key = serializePosition;

  const roomRegion = { left: 0, top: 0, right: roomSize - 1, bottom: roomSize - 1 };
  const isOnEdge = isNearRegion(expandRegionBy(-1)(roomRegion));
  const isOutOfBounds = not(isInRegion(roomRegion));

  const forAllPositions = (callback: (position: Position) => void) => {
    for (const x of range(roomSize)) {
      for (const y of range(roomSize)) {
        callback({ x, y });
      }
    }
  };
  const forAllNeighborsOf = ({ x, y }: Position, callback: (neighbor: Position) => void) => {
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0) continue;
        const neighbor = { x: x + dx, y: y + dy };
        if (isOutOfBounds(neighbor)) continue;
        callback(neighbor);
      }
    }
  };
  const connectNeighbors = (current: Position) => {
    forAllNeighborsOf(current, neighbor => {
      if (isWall(neighbor)) {
        return;
      }
      if (isCenter(neighbor)) {
        graph[SOURCE][key(current)] = Infinity;
      } else if (isOnEdge(neighbor)) {
        graph[key(current)][TARGET] = Infinity;
      } else {
        graph[key(current)][key(neighbor)] = Infinity;
      }
    });
  };

  forAllPositions(position => {
    if (isWall(position) || isCenter(position) || isOnEdge(position)) return;

    graph[key(position)] = {};
    connectNeighbors(position);
  });

  return graph;
};

/**
 * Takes all non-terminal vertices `v` and split them into `v_in` and `v_out` connected with edge `(v_in, v_out)`.
 */
const transformGraph = (initialGraph: Graph): Graph => {
  const addSuffixOut = addSuffix("out");
  const addSuffixIn = addSuffix("in");
  const newEdgeWeight = 1;

  const normalKeys = Object.keys(initialGraph).filter(key => !isTerminal(key));
  const newListPairs = normalKeys.map(key => [
    addSuffixIn(key), //
    { [addSuffixOut(key)]: newEdgeWeight },
  ]);
  const transformedListPairs = toPairs(initialGraph).map(([key, list]) => {
    const newKey = addSuffixOut(key);
    const newList = mapKeys(list, (weight, listKey) => addSuffixIn(listKey!));
    return [newKey, newList];
  });
  return fromPairs([...transformedListPairs, ...newListPairs]);
};

/**
 * Expects all edges in cut to be "vertex edges", i.e. `["5|2_in", "5|2_out"]`.
 */
const getPositionsFromCut = (edges: Edge[]): Position[] => edges.map(([from, to]) => deserializePosition(from));

const serializePosition = ({ x, y }: Position) => `${x}|${y}`;
/**
 * Expects keys to be two integers separated by one character.\
 * Examples: `12|3`, `5|22_in`, `52t12whatever`
 */
const deserializePosition = (key: string): Position => {
  const result = key.match(/(?<x>\d+).(?<y>\d+)/);
  if (result === null) throw new Error(`Failed to deserialize ${key}`);
  return { x: Number(result.groups?.x), y: Number(result.groups?.y) };
};
const isTerminal = (key: string) => [SOURCE, TARGET].includes(key);
const addSuffix = (suffix: string) => (key: string) => isTerminal(key) ? key : `${key}_${suffix}`;

export const testable = {
  createInitialGraph,
  transformGraph,
  getPositionsFromCut,
};
