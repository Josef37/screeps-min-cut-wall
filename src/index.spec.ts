import { range } from "lodash-es";

import { testable, minCutWalls } from ".";
import { isInRegion } from "./region";
import { Edge, Position } from "./types";
const { createInitialGraph, transformGraph, getPositionsFromCut } = testable;

describe("createInitialGraph", () => {
  it("connects to a source and target", () => {
    const roomSize = 7;
    const isWall = () => false;
    const isCenter = ({ x, y }: Position) => x === 3 && y === 3;

    const graph = createInitialGraph({ roomSize, isWall, isCenter });

    // Terminals are connected correctly?
    expect(Object.keys(graph.source)).toHaveLength(8);
    expect(graph.target).toEqual({});

    // Exits and positions near it should not exist in the graph since we cannot build there.
    expect(graph["0|0"]).toBeUndefined();
    expect(graph["1|1"]).toBeUndefined();
    expect(graph["2|2"].target).toBeDefined();
    expect(graph["4|4"].target).toBeDefined();
    expect(graph["5|5"]).toBeUndefined();
    expect(graph["6|6"]).toBeUndefined();

    // Check center and normal position
    expect(graph["3|3"]).toBeUndefined();
    expect(Object.keys(graph["2|2"])).toHaveLength(3);
  });

  it("works for larger centers", () => {
    const roomSize = 9;
    const isWall = () => false;
    const isCenter = isInRegion({ left: 3, top: 3, right: 5, bottom: 5 });

    const graph = createInitialGraph({ roomSize, isWall, isCenter });

    expect(Object.keys(graph.source)).toHaveLength(4 * 4);
  });

  it("omits walls", () => {
    const roomSize = 7;
    const isWall = ({ x, y }: Position) => x === 2 && y === 2;
    const isCenter = ({ x, y }: Position) => x === 3 && y === 3;

    const graph = createInitialGraph({ roomSize, isWall, isCenter });

    expect(Object.keys(graph.source)).toHaveLength(7);
    expect(graph.source["2|2"]).toBeUndefined();
    expect(graph["2|2"]).toBeUndefined();
  });

  it("doesn't create connections for exits or positions near one", () => {
    const terrain = [
      "eeeWWWW", //
      "ennWWWW",
      "WW....W",
      "WW.C..W",
      "WW...nW",
      "WWWWnne",
      "WWeeeeW",
    ];
    const roomSize = terrain.length;
    const isWall = ({ x, y }: Position) => terrain[y][x] === "W";
    const isCenter = ({ x, y }: Position) => terrain[y][x] === "C";

    const graph = createInitialGraph({ roomSize, isWall, isCenter });

    expect(graph["2|2"].target).toBeDefined();
    expect(graph["2|3"].target).toBeUndefined();
    expect(graph["2|4"].target).toBeUndefined();
    expect(graph["4|2"].target).toBeUndefined();
    expect(graph["4|3"].target).toBeDefined();
    expect(graph["4|4"].target).toBeDefined();
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

  it("works for 7x7 terrain without walls and single center", () => {
    const terrain = [
      ".......", //
      ".......",
      "..ooo..",
      "..oCo..",
      "..ooo..",
      ".......",
      ".......",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("only builds walls when an exit is near", () => {
    const terrain = [
      "WWWWW..", //
      "WWWWW..",
      "WW..o..",
      "WWoCoWW",
      "..o...W",
      "WWWWWWW",
      "WWWWWWW",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for a 9x9 example", () => {
    const terrain = [
      "WW..WWWWW", //
      "WW..WWWWW",
      "..Woo.W..",
      "..WCC.o..",
      "..oCC.o..",
      "WWWoWWW..",
      "WWWW..W..",
      "WWW....WW",
      "WWW....WW",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for non-rectangular center", () => {
    const terrain = [
      ".........", //
      ".........",
      "..WoW....",
      "..WCWo...",
      "..oCCWW..",
      "..WCCCW..",
      "..WWWoW..",
      ".........",
      ".........",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("works for disconnected centers", () => {
    const terrain = [
      "...........", //
      "...........",
      "..oooo.....",
      "..oCCo.....",
      "..ooCo.....",
      "...o.o.....",
      "...o.oooo..",
      "...oCC.Co..",
      "...oooooo..",
      "...........",
      "...........",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it("doesn't build next to exits but near edge when there is a wall", () => {
    const terrain = [
      "..WWWWW", //
      "W..o..W",
      "Wooo..W",
      "W...C.W",
      "W..CCCW",
      "W...C.W",
      "WWWWWWW",
    ];

    expectMinCutWallsToWork(terrain);
  });

  it.failing("does something stupid if the center is too close to an exit", () => {
    const terrain = [
      "......", //
      "......",
      "..C...",
      "......",
      "......",
      "......",
    ];

    expectMinCutWallsToWork(terrain);
  });
});
