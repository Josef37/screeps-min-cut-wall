import { range } from "lodash-es";

import { testable, minCutWalls } from ".";
import { isInRegion } from "./region";
import { Edge, Position } from "./types";
const { createInitialGraph, transformGraph, getPositionsFromCut } = testable;

describe("createInitialGraph", () => {
  it("connects to a source and target", () => {
    const roomSize = 7;
    const isWall = () => false;
    const centerRegion = { left: 3, top: 3, right: 3, bottom: 3 };

    const graph = createInitialGraph({ roomSize, isWall, isCenter: isInRegion(centerRegion) });

    // Terminals are connect correctly?
    expect(Object.keys(graph.source)).toHaveLength(8);
    expect(graph.target).toEqual({});

    // Exits should not exist in the graph...
    expect(graph["1|1"].target).toBeDefined();
    expect(graph["0|0"]).toBeUndefined();
    expect(graph["5|5"].target).toBeDefined();
    expect(graph["6|6"]).toBeUndefined();

    // Check center and normal position
    expect(graph["3|3"]).toBeUndefined();
    expect(Object.keys(graph["2|2"])).toHaveLength(7);
  });

  it("works for larger centers", () => {
    const roomSize = 7;
    const isWall = () => false;
    const centerRegion = { left: 2, top: 2, right: 4, bottom: 4 };

    const graph = createInitialGraph({ roomSize, isWall, isCenter: isInRegion(centerRegion) });

    expect(Object.keys(graph.source)).toHaveLength(4 * 4);
  });

  it("omits walls", () => {
    const roomSize = 5;
    const isWall = ({ x, y }: Position) => x === 1 && y === 1;
    const centerRegion = { left: 2, top: 2, right: 2, bottom: 2 };

    const graph = createInitialGraph({ roomSize, isWall, isCenter: isInRegion(centerRegion) });

    expect(Object.keys(graph.source)).toHaveLength(7);
    expect(graph.source["1|1"]).toBeUndefined();
    expect(graph["1|1"]).toBeUndefined();
  });

  it("only connects to target if an exit is near", () => {
    const roomSize = 5;
    const isWall = ({ x, y }: Position) => x === 0;
    const centerRegion = { left: 2, top: 2, right: 2, bottom: 2 };

    const graph = createInitialGraph({ roomSize, isWall, isCenter: isInRegion(centerRegion) });

    expect(graph["1|1"].target).toBeDefined();
    expect(graph["1|2"].target).toBeUndefined();
    expect(graph["1|3"].target).toBeDefined();
  });
});

describe("transformGraph", () => {
  it("splits every vertex into two", () => {
    const initialGraph = {
      source: { "0|0": 100 },
      "0|0": { target: 100 },
      target: {},
    };

    const graph = transformGraph(initialGraph);

    expect(graph["0|0_out"]).toBeDefined();
    expect(graph["0|0_in"]).toBeDefined();
    expect(graph["0|0"]).toBeUndefined();
    expect(graph.source["0|0_in"]).toBeDefined();
    expect(graph["0|0_in"]["0|0_out"]).toBeDefined();
    expect(graph["0|0_out"].target).toBeDefined();
  });
});

describe("getPositionsFromCut", () => {
  it("gets positions", () => {
    const edges: Edge[] = [
      ["0|0_in", "0|0_out"],
      ["12|3_in", "12|3_out"],
    ];

    const positions = getPositionsFromCut(edges);

    expect(positions).toEqual([
      { x: 0, y: 0 },
      { x: 12, y: 3 },
    ]);
  });
});

describe("minCutWalls", () => {
  const visualizeResult = (args: {
    roomSize: number;
    positions: Array<Position>;
    isWall: (position: Position) => boolean;
    isCenter: (position: Position) => boolean;
  }) => {
    const { roomSize, positions, isWall, isCenter } = args;
    const isResult = ({ x, y }: Position) => positions.some(position => x === position.x && y === position.y);

    const getCharacter = ({ x, y }: Position) => {
      if (isResult({ x, y })) return "o";
      if (isWall({ x, y })) return "W";
      if (isCenter({ x, y })) return "C";
      return ".";
    };

    const visualization = range(roomSize)
      .map(y =>
        range(roomSize)
          .map(x => getCharacter({ x, y }))
          .join(""),
      )
      .join("\n");

    return visualization;
  };

  const expectMinCutWallsToWork = (terrain: string[]) => {
    const roomSize = terrain.length;
    const isWall = ({ x, y }: Position) => terrain[y][x] === "W";
    const isCenter = ({ x, y }: Position) => terrain[y][x] === "C";

    const positions = minCutWalls({ roomSize, isWall, isCenter });

    const visualization = visualizeResult({ roomSize, positions, isWall, isCenter });
    expect(visualization).toEqual(terrain.join("\n"));
  };

  it("works for 5x5 terrain without walls and single center", () => {
    const terrain = [
      ".....", //
      ".ooo.",
      ".oCo.",
      ".ooo.",
      ".....",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("only builds walls when an exit is near", () => {
    const terrain = [
      "WWWW.", //
      "W..o.",
      "WoCoW",
      ".o.o.",
      "WWWWW",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for a 7x7 example", () => {
    const terrain = [
      "W..WWWW", //
      ".Woo.W.",
      ".WCC.o.",
      ".oCC.o.",
      "WWoWWW.",
      "WWW..W.",
      "WW....W",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for non-rectangular center", () => {
    const terrain = [
      ".......", //
      ".WoW...",
      ".WCWo..",
      ".oCCWW.",
      ".WCCCW.",
      ".WWWoW.",
      ".......",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for disconnected centers", () => {
    const terrain = [
      "WWW.....WW", //
      ".oooo.....",
      ".oCCo....W",
      ".ooCo....W",
      "..o.o....W",
      "..o.oooo..",
      "..oCC.Co..",
      "W.oooooo..",
      "W.........",
      "....WWWW..",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it.failing("does something stupid if the center can't be separated from an exit", () => {
    const terrain = [
      "....", //
      ".C..",
      "....",
      "....",
    ];

    expectMinCutWallsToWork(terrain);
  });
});
