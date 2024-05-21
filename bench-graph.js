// Run: node graph-tests.js > results/graph-tests.csv

import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import {
  ALPHA_EXISTS,
  CLINGO_VERSION,
  DUSA_VERSION,
  NUMBER_OF_REPS,
  PRINT_COMMANDS_TO_STDERR,
  testAlpha,
  testClingo,
  testDusa,
} from './util.js';

const avoidDups = new Set();
const graphdata = [];
for (const gd of [
  JSON.parse(readFileSync('data/test-graphs-32-to-224-edges-step-32.json')),
  JSON.parse(readFileSync('data/test-graphs-256-to-1792-edges-step-256.json')),
  JSON.parse(readFileSync('data/test-graphs-2048-to-14336-edges-step-2048.json')),
]) {
  for (const graphset of gd) {
    if (avoidDups.has(graphset.numEdges)) continue;
    avoidDups.add(graphset.numEdges);
    graphdata.push(graphset);
  }
}

// Write graphs to file
const tmp = tmpdir();
function getDataLP(graphType, numEdges) {
  return `${tmp}/graph-${graphType}-${numEdges}.lp`;
}
function getDataJSON(graphType, numEdges) {
  return `${tmp}/graph-${graphType}-${numEdges}.json`;
}
for (const { numEdges, graphs } of graphdata) {
  for (const [tp, graph] of Object.entries(graphs)) {
    // console.log(getDataLP(tp, numEdges));
    // console.log(getDataJSON(tp, numEdges));
    writeFileSync(
      getDataLP(tp, numEdges),
      `
${Array.from({ length: graph.numNodes })
  .map((_, i) => `node(${i}).`)
  .join('\n')}
${graph.edges.map(([a, b]) => `edge(${a},${b}).`).join('\n')}
`,
    );
    writeFileSync(
      getDataJSON(tp, numEdges),
      JSON.stringify([
        ...Array.from({ length: graph.numNodes }).map((_, i) => ({ name: 'node', args: [i] })),
        ...graph.edges.map((args) => ({ name: 'edge', args })),
      ]),
    );
  }
}

PRINT_COMMANDS_TO_STDERR.current = true;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');
for (let reps = 1; reps <= NUMBER_OF_REPS; reps++) {
  for (const { numEdges, graphs } of graphdata) {
    for (const [variant, graph] of Object.entries(graphs)) {
      const jsonFilename = getDataJSON(variant, numEdges);
      const seed = 0xcafe + 0xbeef * reps;
      const filename = getDataLP(variant, numEdges);

      // spanning-tree
      {
        const { solutions, result, time } = await testDusa('spanning-tree', jsonFilename, 'parent');
        console.log(`spanning-tree,fclp,dusa-${DUSA_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      {
        const { solutions, result, time } = await testDusa('spanning-tree-pure-asp', jsonFilename, 'p');
        console.log(`spanning-tree,pure-asp,dusa-${DUSA_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (ALPHA_EXISTS) {
        const { solutions, result, time } = await testAlpha('spanning-tree-pure-asp', filename, 'inTree', seed);
        console.log(`spanning-tree,pure-asp,alpha,${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (CLINGO_VERSION) {
        const { solutions, result, time } = await testClingo('spanning-tree-clingo-asp', filename, 'inTree/1', seed);
        console.log(`spanning-tree,clingo-asp,clingo-${CLINGO_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (CLINGO_VERSION) {
        const { solutions, result, time } = await testClingo('spanning-tree-pure-asp', filename, 'inTree/1', seed);
        console.log(`spanning-tree,pure-asp,clingo-${CLINGO_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      // canonical-reps
      {
        const { solutions, result, time } = await testDusa('canonical-reps', jsonFilename, 'isRep');
        console.log(`canonical-reps,fclp,dusa-${DUSA_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      {
        const { solutions, result, time } = await testDusa('canonical-reps-pure-asp', jsonFilename, 'isRep');
        console.log(`canonical-reps,pure-asp,dusa-${DUSA_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (ALPHA_EXISTS) {
        const { solutions, result, time } = await testAlpha('canonical-reps-pure-asp', filename, 'isRep', seed);
        console.log(`canonical-reps,pure-asp,alpha,${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (CLINGO_VERSION) {
        const { solutions, result, time } = await testClingo('canonical-reps-clingo-asp', filename, 'isRep/1', seed);
        console.log(`canonical-reps,clingo-asp,clingo-${CLINGO_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }

      if (CLINGO_VERSION) {
        const { solutions, result, time } = await testClingo('canonical-reps-pure-asp', filename, 'isRep/1', seed);
        console.log(`canonical-reps,pure-asp,clingo-${CLINGO_VERSION},${variant},${numEdges},${reps},${time},${solutions},${result}`);
      }
    }
  }
}
