// Run: node graph-tests.js > results/graph-tests.csv

import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { DANGER_RESET_DATA, Dusa } from '../lib/client.cjs';

const graphdata = JSON.parse(readFileSync('data/test-graphs-200-to-2000-edges.json'));

// Write graphs to file
const tmp = tmpdir();
function getFilename(graphType, numEdges) {
  return `${tmp}/graph-${graphType}-${numEdges}.lp`;
}
for (const { numEdges, graphs } of graphdata) {
  for (const [tp, graph] of Object.entries(graphs)) {
    const filename = getFilename(tp, numEdges);
    writeFileSync(
      filename,
      `
${Array.from({ length: graph.numNodes })
  .map((_, i) => `node(${i}).`)
  .join('\n')}
${graph.edges.map(([a, b]) => `edge(${a},${b}).`).join('\n')}
`,
    );
  }
}

const CLINGO_VERSION = await new Promise((resolve) => {
  exec('clingo -v', (error, stdout) => {
    if (error || typeof stdout !== 'string' || !stdout.startsWith('clingo version ')) {
      process.stderr.write('info: omitting clingo, did not successfully find clingo on path\n');
      resolve(null);
    } else {
      const version = stdout.split('\n')[0].slice('clingo version '.length);
      process.stderr.write(`info: using clingo, found version ${version} on path\n`);
      resolve(version);
    }
  });
});

function testSpanningTreeInDusa(edges) {
  DANGER_RESET_DATA();
  const start = performance.now();
  const dusa = new Dusa(`
      edge Y X :- edge X Y.
      root is { X? } :- edge X _.
      parent X is X :- root is X.
      parent X is { Y? } :- edge X Y, parent Y is _.`);
  for (const [a, b] of edges) {
    dusa.assert({ name: 'edge', args: [a, b] });
  }
  const size = [...dusa.sample().lookup('parent')].length;
  const end = performance.now();
  return { time: end - start, size };
}

function testCanonicalRepsInDusa(edges, numNodes) {
  DANGER_RESET_DATA();
  const start = performance.now();
  const dusa = new Dusa(`
      edge Y X :- edge X Y.
      representative X is { X? } :- node X.
      representative Y is Rep :-
          edge X Y,
          representative X is Rep.
      isRep Rep :- representative _ is Rep.`);
  for (let i = 0; i < numNodes; i++) {
    dusa.assert({ name: 'node', args: [i] });
  }
  for (const [a, b] of edges) {
    dusa.assert({ name: 'edge', args: [a, b] });
  }
  const size = [...dusa.sample().lookup('isRep')].length;
  const end = performance.now();
  return { time: end - start, size };
}

let reps = 0;
console.log('Algorithm,System,Graph type,Problem Size,Rep,Time,Output');
while (reps < 15) {
  reps += 1;
  for (const { numEdges, graphs } of graphdata) {
    for (const [tp, graph] of Object.entries(graphs)) {
      // Dusa / Spanning Tree
      {
        const { time, size } = testSpanningTreeInDusa(graph.edges);
        console.log(
          `spanning-tree,dusa,${tp},${numEdges},${reps},${time},${size / graph.numNodes}`,
        );
      }

      // Dusa / Canonical-reps
      {
        const { time, size } = testCanonicalRepsInDusa(graph.edges, graph.numNodes);
        console.log(`canonical-reps,dusa,${tp},${numEdges},${reps},${time},${size}`);
      }

      // Clingo / Spanning Tree (Idiomatic)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const seed = Math.floor(Math.random() * 100000);
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${getFilename(
          tp,
          numEdges,
        )} asp/spanning-tree.lp asp/spanning-tree-treecount.lp`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(10)));
          });
        });
        const end = performance.now();
        console.log(
          `spanning-tree,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${end - start},${
            output / graph.numNodes
          }`,
        );
      }

      // Clingo / Spanning Tree (Pure ASP)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const seed = Math.floor(Math.random() * 100000);
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${getFilename(
          tp,
          numEdges,
        )} asp/spanning-tree-pure-asp.lp asp/spanning-tree-treecount.lp`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(10)));
          });
        });
        const end = performance.now();
        console.log(
          `spanning-tree-pure-asp,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${end - start},${
            output / graph.numNodes
          }`,
        );
      }

      // Clingo / Canonical-reps
      if (CLINGO_VERSION) {
        const start = performance.now();
        const seed = Math.floor(Math.random() * 100000);
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${getFilename(
          tp,
          numEdges,
        )} asp/canonical-reps.lp`;
        const output = await new Promise((resolve) => {
          exec(command, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(9)));
          });
        });
        const end = performance.now();
        console.log(
          `canonical-reps,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${
            end - start
          },${output}`,
        );
      }
    }
  }
}
