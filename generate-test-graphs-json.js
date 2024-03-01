// Run: node generate-test-graphs-json.js
import { writeFileSync } from 'fs';

function makeEdges(numEdges, type) {
  // how many nodes do we need?
  // verysparse-islands: V = 1.2E nodes
  // verysparse-random: V = 1.3E nodes
  //    so we want 1.3E(1.3E-1)/2 * P = E
  //    so the probability P of an edge should be 200 / 13 * (13 * E - 10)
  // sparse-random: V = E/2 nodes
  //    so we want E/2(E/2-1)/2 * P = E
  //    so the probabilty P of an edge should be 8/(x - 2)
  // sparse-linear: V = E+2 nodes, always an edge from n to n+1 with one exception
  // sparse-cycles: V = E-2 nodes, two components that are both shaped like an 8
  // mid-random: we want V^(5/4) = E
  //    so we want V(V-1)/2 * P = V^(5/4)
  //    so we want about P = 2*V^(1/4)/(V - 1)
  //    and we want V = 2*E^(4/5)
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
    case 'verysparse-islands': {
      return { ...makeIslandsGraph(numEdges), actualNumEdges: numEdges };
    }
    case 'verysparse-random':
      numNodes = Math.floor(numEdges * 1.3);
      probabilityOfEdge = 200 / (13 * (13 * numEdges - 10));
      break;
    case 'sparse-random':
      numNodes = Math.floor(numEdges / 2);
      probabilityOfEdge = 8 / (numEdges - 2);
      break;
    case 'sparse-linear': {
      const midpoint = Math.floor(numEdges / 2);
      return {
        numNodes: numEdges + 2,
        actualNumEdges: numEdges,
        edges: Array.from({ length: numEdges }).map((_, i) =>
          i < midpoint ? [i, i + 1] : [i + 1, i + 2],
        ),
      };
    }
    case 'sparse-cycles': {
      return { ...makeEightsGraph(numEdges), actualNumEdges: numEdges };
    }
    case 'mid-random': {
      numNodes = Math.floor(Math.pow(numEdges, 4 / 5));
      probabilityOfEdge = (2 * Math.pow(numNodes, 1 / 4)) / (numNodes - 1);
      break;
    }
    case 'dense-random':
      numNodes = Math.ceil((1 + Math.sqrt(1 + 32 * numEdges)) / 2);
      probabilityOfEdge = 1 / 4;
      break;
    case 'dense-near-complete': {
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

/* Makes graphs that repeat this pattern over and over:
 *
 * 0 - 1 - 2   3 - 4   5 - 6 - 7   8 - 9 ...
 *  \_____/             \_____/
 */
function makeIslandsGraph(numEdges) {
  if (Math.floor(numEdges / 4) * 4 !== numEdges) {
    throw new Error(`numEdges must be a multiple of 4, ${numEdges} is not`);
  }

  const numNodes = (numEdges / 4) * 5;
  const edges = [];
  for (let i = 0; i < numNodes; i += 5) {
    edges.push([i, i + 1], [i, i + 2], [i + 1, i + 2], [i + 3, i + 4]);
  }
  return { edges, numNodes };
}

/* Makes two graphs that look like figure eights, with the specified
 * number of edges numEdges and numEdges - 2 nodes.
 *
 * makeEightsGraph(14) looks like this:
 * 0 - 1 - 2   6 - 7 - 8
 * |   |   |   |   |   |
 * 5 - 4 - 3   B - A - 9
 *
 * makeEightsGraph(22) looks like this:
 * 0 - 1 - 2 - 3 - 4   A - B - C - D - E
 * |       |       |   |       |       |
 * 9 - 8 - 7 - 6 - 5   J - I - H - G - F
 */
function makeEightsGraph(numEdges) {
  if (Math.floor(numEdges / 2) * 2 !== numEdges) {
    throw new Error(`numEdges must be a multiple of 2, ${numEdges} is not`);
  }
  if (numEdges < 10) {
    throw new Error(`numEdges must be at least 10, ${numEdges} is not`);
  }

  const componentNodes = numEdges / 2 - 1;

  const edges = [];
  for (let component = 0; component < 2; component++) {
    const offset = component * componentNodes;
    edges.push([offset, offset + componentNodes - 1]);
    for (let i = 0; i < componentNodes - 1; i++) {
      const start = offset + i;
      const end = offset + i + 1;
      edges.push([start, end]);
    }
    edges.push([
      offset + Math.floor(componentNodes / 4),
      offset + Math.floor((3 * componentNodes) / 4),
    ]);
  }

  return { edges, numNodes: numEdges - 2 };
}

const TYPES = [
  'dense-near-complete',
  'dense-random',
  'mid-random',
  'sparse-cycles',
  'sparse-linear',
  'sparse-random',
  'verysparse-islands',
  'verysparse-random',
];

for (const [start, end, step] of [
  [32, 32 * 7, 32],
  [256, 256 * 7, 256],
  [2048, 2048 * 7, 2048],
]) {
  const results = [];
  for (let problemSize = start; problemSize <= end; problemSize += step) {
    const graphs = {};
    for (const tp of TYPES) {
      let best = makeEdges(problemSize, tp);
      while (best.actualNumEdges !== problemSize) {
        console.log(`rejecting ${tp} - needed ${problemSize} edges, got ${best.actualNumEdges}`);
        best = makeEdges(problemSize, tp);
      }
      graphs[tp] = { edges: best.edges, numNodes: best.numNodes };
      console.log(`generated ${tp} with ${problemSize} edges`);
    }
    results.push({ numEdges: problemSize, graphs });
  }
  writeFileSync(
    `data/test-graphs-${start}-to-${end}-edges-step-${step}.json`,
    JSON.stringify(results),
  );
}
