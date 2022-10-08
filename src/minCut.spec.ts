import "jest-extended";

import { minCut } from "./minCut";

describe("minCut", () => {
  it("works for a simple example", () => {
    const graph = {
      "0": { "1": 16, "2": 13 },
      "1": { "2": 10, "3": 12 },
      "2": { "1": 4, "4": 14 },
      "3": { "2": 9, "5": 20 },
      "4": { "3": 7, "5": 4 },
      "5": {},
    };
    const source = "0";
    const target = "5";

    const cut = minCut({ graph, source, target });

    const expected = [
      ["1", "3"],
      ["4", "3"],
      ["4", "5"],
    ];

    expect(cut).toIncludeSameMembers(expected);
  });

  it("only returns edges connecting two components in the residual graph", () => {
    const graph = {
      "0": { "1": 1000, "2": 1 },
      "1": { "2": 1000, "3": 1 },
      "2": { "3": 1 },
      "3": {},
    };
    const source = "0";
    const target = "3";

    const cut = minCut({ graph, source, target });

    const expected = [
      ["1", "3"],
      ["2", "3"],
    ];

    expect(cut).toIncludeSameMembers(expected);
  });

  it("allows `Infinity` als weight as long as there is no infinite flow", () => {
    const graph = {
      "0": { "1": Infinity, "2": 1 },
      "1": { "2": Infinity, "3": 1 },
      "2": { "3": 1 },
      "3": {},
    };
    const source = "0";
    const target = "3";

    const cut = minCut({ graph, source, target });

    const expected = [
      ["1", "3"],
      ["2", "3"],
    ];

    expect(cut).toIncludeSameMembers(expected);
  });
});
