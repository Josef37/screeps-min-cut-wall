export interface Position {
  x: number;
  y: number;
}

export interface Region {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Node = string;
export type Edge = [Node, Node];
export type Weight = number;
export type Graph = Record<Node, Record<Node, Weight>>;
