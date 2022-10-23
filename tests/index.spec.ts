import { testable, minCutWalls } from "../src";
import { isInRegion } from "../src/region";
import { Edge, Position } from "../src/types";
import { toIndex } from "../src/utils";
const {
  SOURCE,
  TARGET,
  outKeyDelta,
  getInKeyDelta,
  createGraph,
  getPositionsFromCut,
} = testable;

describe("createInitialGraph", () => {
  const keyOut = (roomSize: number) => (pos: Position) =>
    outKeyDelta + toIndex(roomSize)(pos);
  const keyIn = (roomSize: number) => (pos: Position) =>
    getInKeyDelta(roomSize) + toIndex(roomSize)(pos);

  it("connects to a source and target", () => {
    const roomSize = 7;
    const isWall = () => false;
    const isCenter = ([x, y]: Position) => x === 3 && y === 3;

    const graph = createGraph({ roomSize, isWall, isCenter });

    // Terminals are connected correctly?
    expect(graph.data[SOURCE]).toHaveLength(8);
    expect(graph.data[TARGET]).toHaveLength(0);

    // Exits and positions near it should not exist in the graph since we cannot build there.
    expect(graph.data[keyIn(roomSize)([0, 0])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([0, 0])]).toHaveLength(0);
    expect(graph.data[keyIn(roomSize)([1, 1])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([1, 1])]).toHaveLength(0);
    expect(graph.getEdgeData(keyOut(roomSize)([2, 2]), TARGET)).toBeDefined();
    expect(graph.getEdgeData(keyOut(roomSize)([4, 4]), TARGET)).toBeDefined();
    expect(graph.data[keyIn(roomSize)([5, 5])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([5, 5])]).toHaveLength(0);
    expect(graph.data[keyIn(roomSize)([6, 6])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([6, 6])]).toHaveLength(0);

    // Check center and normal position
    expect(graph.data[keyIn(roomSize)([3, 3])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([3, 3])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([2, 2])]).toHaveLength(3);
  });

  it("works for larger centers", () => {
    const roomSize = 9;
    const isWall = () => false;
    const isCenter = isInRegion({ left: 3, top: 3, right: 5, bottom: 5 });

    const graph = createGraph({ roomSize, isWall, isCenter });

    expect(graph.data[SOURCE]).toHaveLength(4 * 4);
  });

  it("omits walls", () => {
    const roomSize = 7;
    const isWall = ([x, y]: Position) => x === 2 && y === 2;
    const isCenter = ([x, y]: Position) => x === 3 && y === 3;

    const graph = createGraph({ roomSize, isWall, isCenter });

    expect(graph.data[SOURCE]).toHaveLength(7);
    expect(graph.getEdgeData(SOURCE, keyIn(roomSize)([2, 2]))).toBeUndefined();
    expect(graph.data[keyIn(roomSize)([2, 2])]).toHaveLength(0);
    expect(graph.data[keyOut(roomSize)([2, 2])]).toHaveLength(0);
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
    const isWall = ([x, y]: Position) => terrain[y][x] === "W";
    const isCenter = ([x, y]: Position) => terrain[y][x] === "C";

    const graph = createGraph({ roomSize, isWall, isCenter });

    expect(graph.getEdgeData(keyOut(roomSize)([2, 2]), TARGET)).toBeDefined();
    expect(graph.getEdgeData(keyOut(roomSize)([2, 3]), TARGET)).toBeUndefined();
    expect(graph.getEdgeData(keyOut(roomSize)([2, 4]), TARGET)).toBeUndefined();
    expect(graph.getEdgeData(keyOut(roomSize)([4, 2]), TARGET)).toBeUndefined();
    expect(graph.getEdgeData(keyOut(roomSize)([4, 3]), TARGET)).toBeDefined();
    expect(graph.getEdgeData(keyOut(roomSize)([4, 4]), TARGET)).toBeDefined();
  });
});

describe("getPositionsFromCut", () => {
  const roomSize = 10;

  it("gets positions", () => {
    const edges: Edge[] = [
      [102, 2],
      [126, 26],
    ];

    const positions = getPositionsFromCut(roomSize)(edges);

    expect(positions).toEqual([
      [0, 0],
      [4, 2],
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
    const isResult = ([x1, y1]: Position) =>
      positions.some(([x2, y2]) => x1 === x2 && y1 === y2);

    const getCharacter = (pos: Position) => {
      if (isResult(pos)) return "o";
      if (isWall(pos)) return "W";
      if (isCenter(pos)) return "C";
      return ".";
    };

    const visualization = _.range(roomSize)
      .map((y) =>
        _.range(roomSize)
          .map((x) => getCharacter([x, y]))
          .join("")
      )
      .join("\n");

    return visualization;
  };

  const expectMinCutWallsToWork = (
    terrain: string[],
    resultLength?: number
  ) => {
    const roomSize = terrain.length;
    const isWall = ([x, y]: Position) => terrain[y][x] === "W";
    const isCenter = ([x, y]: Position) => terrain[y][x] === "C";

    const positions = minCutWalls({ roomSize, isWall, isCenter });
    const visualization = visualizeResult({
      roomSize,
      positions,
      isWall,
      isCenter,
    });

    if (resultLength !== undefined)
      expect(positions).toHaveLength(resultLength);
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

    expectMinCutWallsToWork(terrain, 8);
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

    expectMinCutWallsToWork(terrain, 4);
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

    expectMinCutWallsToWork(terrain, 6);
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

    expectMinCutWallsToWork(terrain, 4);
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

    expectMinCutWallsToWork(terrain, 24);
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

    expectMinCutWallsToWork(terrain, 4);
  });

  it.failing(
    "does something stupid if the center is too close to an exit",
    () => {
      const terrain = [
        "......", //
        "......",
        "..C...",
        "......",
        "......",
        "......",
      ];

      expectMinCutWallsToWork(terrain, 3);
    }
  );

  it("Actual room size test", () => {
    const terrain = [
      "WWWW.W........W....WWW....W...........WWWW........",
      "WWWW...............WWW.................WWW........",
      "WWWW....................W..WWWWWW......WWWWW......",
      "..............WWW..........WWWWWW...WWW..WWW..WWW.",
      "WW.......WWW..WWW.W........WWWWWW.WWWWW..WWW..WWW.",
      "WW.......WWWoWWWWWWW......W.WWW...WWWWW..WWW..WWW.",
      "WW.......WWW...WWWWWWW............WWWWWWW.....WWW.",
      ".........W.....WWWWWWW.WWW............WWWWWWWWW...",
      "......WWWo.........WWWoWWW............WWWWWWWWW...",
      "......WWW.......W......WWW.............WWWWWWWW...",
      "...WWWWWW.......W........o.....WWW.....WWW........",
      "...WWW..............W....oooo..WWWWWWWW...........",
      "...WWWW.....CCCCCCCCCCCCCCCCWWWWWWWWWCo...WWW.....",
      "WW..WWW.....CCCCWWWWWWCWWWCWWWWCCCWWWCo.W.WWW.....",
      "WW..WWW.....CCCCCWWWWWCWWWWWWWWCCCCCCCoW..WWW...W.",
      "WW..W...WWWWWWWWWWWWWWWWWWWWWWCCCCCCCCo...........",
      "....o.W.WWWWWWWWWWWCWCWWWWWCCCCCCCCCCCo......W....",
      "...WWW..WWWWWWWWWWWCCCWWWWWWCCCCCCCCCWo...........",
      "WWWWWWW.....CCWCWWWCCCCCCWWWCCCCCWWWWWW...........",
      "WWWWWW....WWWCCWWWCCCCCCCWWWWWWCCWWWWWW...........",
      "WWW....W..WWWCWWWWCCCCCCWWWWWWWCCWWWWWW..W........",
      "..o.......WWWCCWWWCCCCCCWWWCWWWCCWWWWCoWWW.....WWW",
      "..o.........CCCCCCCCCCCCWWWCCCCCCCWCWWWWWWWWW.WWWW",
      ".WWW........CCCCWCCCCCWWWCCCCCCCCCCCWWWWWWWWWW.WWW",
      ".WWW....W...CCWCWCCCCCWWWCCCCCCCCCCCWWWWWWWWWW....",
      "WWWWWWW.....CCCWCCCCCWWWWCCCWWWCCCCCCWWW..WWWW....",
      "WW..WWW.....CCCCCCWWWCCCCCCCWWWCCCCWCWWW.WWW.WWW..",
      "WW..WWW.....CCCCCCWWWWCCCCCCWWWCCCCCCC...WWW.WWWW.",
      "...W.o......CCWCCCWWWWCCCCCCCCCCCCWCCC...WWW.WWWW.",
      "....Wo......CWCCCCCWWWCCWWWCCCCWCCCCCC........WWW.",
      ".....o......CCCCCCCCCCCCWWWCWWWCCCCCCC....W.WWW...",
      "...W.o......CCCCCCCCCCCCWWWCWWWCCCCCCC...WW.WWWWW.",
      ".....o.....WCCCCCCCCCCCCCCCCWWWCCCCCCC.....oWWWWW.",
      ".....o......CCCCCCCCCWWWCCCWWWCCWWWWCC.....W..WWW.",
      ".....o......CCCCCCCWWWWWCWWWWWCCWWWWCC.....o......",
      ".....W......WCCCCCCCWWWWCWWWWWCCWWWWCC.....o......",
      ".....Wo...WWWCCCWWWCCCCCCWWWCCCCCCCCCC.....o...W..",
      "WW..W.WWW.WWWCCCWWWWCCCWCCCCCCCCCCCCCC.....o......",
      "WW....WWW.WWWWWWWWWo.....W................oW......",
      "WW...WWWWWWWWWWW...o....................WWW.......",
      "WW...WWWWW..WWWW...WWWWW......WWW.......WWWW......",
      ".....WWWWW..WWW....WWW.WWW...WWWW......oWWWW......",
      "...WW...W..........WWW.WWWoWoWWWWWWooWWW.WWW......",
      "........W....W.........WWW...WWWWWW..WWW..........",
      "...............WWW.....WWW......WWW..WWW..........",
      "......WWW......WWW...WWWWW.....W..................",
      "......WWW......WWW...WWW...W.......WWW............",
      "....WWWWW....WWW.....WWWW...W...W..WWW............",
      ".............WWW......WWW..........WWW............",
      ".............WWW......WWW.........................",
    ];

    expectMinCutWallsToWork(terrain, 39);
  });

  it("works with actual map data", () => {
    const terrain = [
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
      "WWWWWWWWWWWWWWWWW..WWWWWW......WWWWWWWWWWWWWWWWWWW",
      "WWWWWW..............WWWW........WWWWWWWWWWW...WWWW",
      "WWWWWW..............WWW.........WWWWWWWWWW.....WWW",
      "WWWWWWW..............W..........WWWWWWWWWW........",
      "WWWWWWWW......................WWWWWWW...WWW.......",
      "WWWWW.WWW.......WWW..........WWWWWWW.....WWW......",
      "WWWW...WW......WWWWW..........WWWWW.......WWW.....",
      "WWWW....W......WWWWW.......................WWWW...",
      "..WWW...........WWWW....W...................WWWW..",
      "..WWW.....CCCCCCCWWWCCCCWCCCCCCCCCCCCCCC....WWWW..",
      "...WWW....CCCCCCCCWCCCCCCCCCCCCCCCCCCCCC...WWWWW..",
      "...WWWW...WWCCCCCCCCCCCCCCCCCCCCCCCCCCCC...WWWW...",
      "....WWWWWWWWWCCCCCCCCCCCCCCCCCCCCCCCCCCC....WW....",
      "....o.WWWWWWWWCCCCCCCCCCCCCCCCCCCCCCCCCC....o.....",
      "....o...WWWWWWCCCCCCCCWCCCWWWCCCCCCCCCCC....o.....",
      "....o....WWWWWWCCCCCCWWCCCWWWCCCCCCCCCCC....o.....",
      "...WW.....WWWWWCCCCCCCWCCCCWWWCCCCCCCCCC.WWWW.....",
      "..WWWW....CWWWCCCCCCCCCCCCCCWWWWWWWCCCCCWWWWW.....",
      "..WWWWW...CCCCCCCCCCCCCCCCCCCCWWWWWCCCCWWWWWW.....",
      "..WWWWW...CCCCCCCCWWCCCCCCCCCCCWWWCCCCCWWWWW......",
      "WWWWWW....CCCCCCCWWWWWWCCCCCCCCCWCCCCCWWWWWW......",
      "WWWWW.....CCCCCCCWWWWWWWCCCCCCCCCCCCCCWWWWW.......",
      "WWWW......CCCCCCCCWWWWWWCCCCCCCCCCCCCCCWWW........",
      "WWWW......CCCCCCCCCCCWWWWCCCCCCCCCCCCCCC.o........",
      "WWWW......CCCCCCCCCCCCWWWWWCCCCCCCCCCCCC.o........",
      "WWWWW.....CCCCCCCCCCCCCWWWWWCCCCCCCCCCCC.o.WW.....",
      "WWWWW.....CCCCCCCCCCCCCCWWWWCCCCCWWWCCCC.oWWWW....",
      "WWWWWW....CCCCCCCCCCCCCCCWWWWCCCCWWWCCCC.WWWW.....",
      "WWWWWW....CCCCCCCCCCCCCCCCWWWWCCCCWWCCCC.WWW......",
      "..WWWWW...CCCCCCCCCCCCCCCCWWWWWCCCCCCCCC.WWW......",
      "..WWWWW...CCCCCCCCCCCCCCCCWWWWWCCCCCCCCC..WWW.....",
      "..WWWW....CCCCCCCCWWCCCCCWWWWWWCCCCCCCCC..WWW.....",
      "..WWW.....CCCCWWWWWWWCCCCWWWWWWCCCCCCCCC..o.......",
      "..WWW.....CWWWWWWWWWWWCCCWWWWWCCCCCCCCCC..o.......",
      "..o.......CWWWWWWWWWWWCCCWWWWWCCCCCCCCCC..o.......",
      "..o.......CCWWWWCCCWWWCCCCWWWCCCCCCCCCCC..o.......",
      "..o.......CCCCCCCCCCCCCCCCCCCCCCCCCWWCCC..o.......",
      "WWo.......CCCCCCCCCCCCCCCCCCCCCCCCWWWWCC.WW.......",
      "WWW.......CCCCCCCCCCCCCCCCCCCCCCCCWWWWCC.WWWW.....",
      "WW........................ooooooooWWWWoooWWWWW....",
      "W........................WW........WW.....WWWW....",
      "W...........W...ooooooooWWW.......................",
      "W..........WWW..o........WW.......................",
      "W..........WWWW.o...............W.................",
      "W...........WWWWW..............WWW................",
      "W............WWWWW..............W.............WW..",
      "WW............WWWW.............................WWW",
      "WWWWW.........WWWWW.............................WW",
      "WWWWWWWWWWWWWWWWWWWWWW................WWWWW.....WW",
    ];

    expectMinCutWallsToWork(terrain, 40);
  });
});
