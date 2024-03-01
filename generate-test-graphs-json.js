function makeEdges(numEdges, type) {
  // how many nodes do we need?
  // verysparse-random: V = 1.3E nodes
  //    so we want 1.3E(1.3E-1)/2 * P = E
  //    so the probability P of an edge should be 200 / 13 * (13 * E - 10)
  // sparse-random: V = E/2 nodes
  //    so we want E/2(E/2-1)/2 * P = E
  //    so the probabilty P of an edge should be 8/(x - 2)
  // sparse-almost-connected: V = E+2 nodes, always an edge from n to n+1 with one exception
  //    so we expect exactly V-1 = E nodes to exist
  // dense-random: we want 1/4 of edges to exist
  //    so we want V(V-1)/2 * 1/4 = E
  //    so we want V = (1 + sqrt(1 + 32E))/2 vertices (and we'll round up)
  // fully-connected: we want all edges to exist
  //    so we want V(V-1)/2  = E
  //    we can't have exactly (1 + sqrt(1 + 8E))/2 nodes
  //    so we'll round up and then add edges till we're done
  let numNodes;
  let probabilityOfEdge;
  switch (type) {
    case 'verysparse-random':
      numNodes = Math.floor(numEdges * 1.3);
      probabilityOfEdge = 200 / (13 * (13 * numEdges - 10));
      break;
    case 'sparse-random':
      numNodes = Math.floor(numEdges / 2);
      probabilityOfEdge = 8 / (numEdges - 2);
      break;
    case 'sparse-almost-connected': {
      const midpoint = Math.floor(numEdges / 2);
      return {
        numNodes: numEdges + 2,
        actualNumEdges: numEdges,
        edges: Array.from({ length: numEdges }).map((_, i) => (i < midpoint ? [i, i + 1] : [i + 1, i + 2])),
      };
    }
    case 'dense-random':
      numNodes = Math.ceil((1 + Math.sqrt(1 + 32 * numEdges)) / 2);
      probabilityOfEdge = 1 / 4;
      break;
    case 'fully-connected': {
      numNodes = Math.ceil((1 + Math.sqrt(1 + 8 * numEdges)) / 2);
      let edges = [];
      let count = 0;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          edges.push([i, j]);
          count += 1;
          if (count === numEdges) {
            return { numNodes, actualNumEdges: numEdges, edges };
          }
        }
      }
      throw new Error('Fully connected: not enough nodes to make enough edges');
    }
  }
  //console.log(probabilityOfEdge);

  const edges = [];
  let actualNumEdges = 0;
  for (let i = 0; i < numNodes; i++) {
    for (let j = i + 1; j < numNodes; j++) {
      if (Math.random() < probabilityOfEdge) {
        actualNumEdges += 1;
        edges.push([i, j]);
      }
    }
  }
  return { numNodes, actualNumEdges, edges };
}

const TYPES = ['verysparse-random', 'sparse-random', 'sparse-almost-connected', 'dense-random', 'fully-connected'];

const results = [];
//for (let i = 0; i < 15; i ++) {
//  const problemSize = 500 * (i + 1);
for (let i = 0; i < 10; i++) {
  const problemSize = 200 * (i + 1);
  const graphs = {};
  for (const tp of TYPES) {
    let best = makeEdges(problemSize, tp);
    while (best.actualNumEdges !== problemSize) {
      // console.log(tp, problemSize, best.actualNumEdges);
      best = makeEdges(problemSize, tp);
    }
    graphs[tp] = { edges: best.edges, numNodes: best.numNodes };
    // console.log(problemSize, tp, best.numNodes)
  }
  results.push({ numEdges: problemSize, graphs });
}

console.log(JSON.stringify(results));
