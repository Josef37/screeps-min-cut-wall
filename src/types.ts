export type Position = [number, number];

export interface Region {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Vertex = number;
export type Edge = [Vertex, Vertex];
export type Weight = number;
// Outer array is indexed by "from" vertex
// Inner array is just a list
export type GraphData<EdgeData extends {}> = Array<
  Array<{ vertex: Vertex } & EdgeData>
>;
