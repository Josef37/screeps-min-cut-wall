# `minCutWall`

Minimize the amount of walls necessary by graph theory!

I've tried my best to make the code as easy as possible to understand.\
Feel free to extend it and use it for your script! 😊

![Visualization of `minCutWall` computation result](assets/minCutWall.png)

## Usage

The function `minCutWall` takes the two arguments:

- `isWall: ({x,y}) => boolean`: Treat these as not walkable.
- `isCenter: ({x,y}) => boolean`: Don't put walls here. Center positions don't have to be connected.

It returns a list of position which minimizes the amount of walls you have to place to separate the center (defined by `isCenter`) from the exits.

Have a look at the tests to get a feel for the returned values.

If you want your center to be a rectangular region, you can use `isCenter = isInRegion({ left, top, right, bottom })`.

Walls are usually defined by `isWall = ({ x, y }) => terrain.get(x, y) === TERRAIN_MASK_WALL`.

## Explanation

The main idea is to find a minimum cut in the flow network from center to exit.\
See [Edmonds–Karp algorithm](https://en.wikipedia.org/wiki/Edmonds%E2%80%93Karp_algorithm) and [Max-flow min-cut theorem](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem).

### Step 1 - `createInitialGraph`

We create a weighted directed graph where the vertices represent walkable positions. Edges connect neighboring vertices (by walking).\
Additionally we create a source node for the center and a target node for all exits.

- Connect all buildable positions (not wall, center or near exit) to each other.
- Connect the source node to all positions next to the center.
- Collect all positions that are next to an exit. Connect their neighbors to the target.

### Step 2 - `transformGraph`

We try to find a minimum cut through vertices (i.e. room positions), but the algorithm only works for edges...

Therefore we transform the graph such that each node becomes two - connected by a single edge.\
`s -> u -> v -> w -> t` will become `s -> u_in -> u_out -> v_in -> v_out -> w_in -> w_out -> t`.

Since we only want to cut these newly created "node-edges", we assign them a weight of `1`. All other edges have a weight of `Infinity`.

### Step 3 - `minCut`

Execute the actual min-cut algorithm on the transformed graph.\
The resulting edges in the minimum cut can be traced back to the positions in the room.
