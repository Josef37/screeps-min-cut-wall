# `minCutWall`

Minimize the amount of walls necessary by graph theory!

I've tried my best to make the code as easy as possible to understand.\
Feel free to extend it and use it for your script! 😊

![Visualization of `minCutWall` computation result](assets/minCutWall.png)

## Usage

The function `minCutWall` takes the two arguments:

- `isWall: ({x,y}) => boolean`: Treat these as not walkable.
- `isCenter: ({x,y}) => boolean`: Don't put walls here. Center positions don't have to be connected.

It returns a list of positions which minimizes the amount of walls you have to place to separate the center (defined by `isCenter`) from the exits.

Have a look at the tests to get a feel for the returned values.

If you want your center to be a rectangular region, you can use `isCenter = isInRegion({ left, top, right, bottom })`.

Walls are usually defined by `isWall = ({ x, y }) => terrain.get(x, y) === TERRAIN_MASK_WALL`.

## Explanation

The main idea is to find a minimum cut in the flow network from center to exit.\
See [Dinic's algorithm](https://en.wikipedia.org/wiki/Dinic%27s_algorithm) and [Max-flow min-cut theorem](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem).

### Step 1 - `createGraph`

We create a weighted directed graph where each walkable position is represented by a vertex.\
Edges connect neighboring vertices (neighboring in the sense of walking).\
Additionally we create a source node for the center and a target node for all exits.

We want to partition the edges of the graph by removing as little vertices as possible.\
Since minimum cut algorithms only work for partitioning the vertices, we have to represent the room in a slightly different way:

Build the graph such that each position becomes two vertices - connected by a single edge. All incoming edges are connected to one vertex and all outgoing edges to the other vertex.\
The path `s -> u -> v -> t` in the "room world" will become `s -> u_in -> u_out -> v_in -> v_out -> t` in the "graph world".

Since we only want to cut these specially created "node-edges", we assign them a capacity/weight of `1`. All other edges have a capacity/weight of `Infinity`.

### Step 2 - `minCut`

Execute a maximum flow algorithm on the graph.

The residual graph of that flow (meaning all capacity the graph has left after subtracting the flow) splits the vertices in at least two partitions.\
A minimum cut can be constructed by those edges from the initial graph which connect the source partition with another partition and which got drained in the residual graph (meaning they got fully used by the maximum flow).

The resulting edges in the minimum cut can be traced back to the positions in the room.
