import { Position, Region } from "./types";

export const expandRegionBy =
  (by: number) =>
  ({ left, top, right, bottom }: Region) => ({
    left: left - by,
    top: top - by,
    right: right + by,
    bottom: bottom + by,
  });

export const isInRegion =
  ({ left, top, right, bottom }: Region) =>
  ([x, y]: Position) =>
    left <= x && x <= right && top <= y && y <= bottom;

export const isNearRegion = (region: Region) => (position: Position) =>
  !isInRegion(region)(position) &&
  isInRegion(expandRegionBy(1)(region))(position);
