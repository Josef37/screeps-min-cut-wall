import { Position } from "./types";

export const toIndex =
  (roomSize: number) =>
  ([x, y]: Position) =>
    x + roomSize * y;

export const fromIndex =
  (roomSize: number) =>
  (index: number): Position =>
    [index % roomSize, Math.floor(index / roomSize)];
