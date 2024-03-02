// Run: node graph-tests.js > results/graph-tests.csv

import { exec } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { DANGER_RESET_DATA, Dusa } from '../lib/client.cjs';

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

const DUSA_VERSION = JSON.parse(readFileSync('package-lock.json')).packages['node_modules/dusa']
  .version;

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

const ALPHA_EXISTS = await new Promise((resolve) => {
  exec('java --version', (error, stdout) => {
    if (error || typeof stdout !== 'string') {
      process.stderr.write('info: omitting alpha, did not successfully find java on path\n');
      resolve(false);
    } else if (!existsSync('alpha.jar')) {
      process.stderr.write('info: omitting alpha, alpha.jar needs to be in this directory\n');
      process.stderr.write('info: alpha.jar can be found at https://github.com/alpha-asp/Alpha');
      resolve(false);
    } else {
      process.stderr.write(`info: using alpha via ${stdout.split('\n')[0]}\n`);
      resolve(true);
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

const NUMBER_OF_REPS = 5;
const TIMEOUT_IN_SECONDS = 60;

const TIMEOUT = TIMEOUT_IN_SECONDS * 1000;
const TIMEOUT_EPSILON = 500;
let reps = 0;
console.log('Algorithm,Dialect,System,Graph type,Problem Size,Rep,Time,Output');
while (reps < NUMBER_OF_REPS) {
  reps += 1;
  for (const { numEdges, graphs } of graphdata) {
    for (const [tp, graph] of Object.entries(graphs)) {
      const jsonFilename = getDataJSON(tp, numEdges);

      // Dusa / Spanning Tree / FCLP
      {
        const start = performance.now();
        const command = `node run-dusa.js asp/spanning-tree.dusa ${jsonFilename} parent`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output / graph.numNodes, time: end - start };
        console.log(
          `spanning-tree,fclp,dusa-${DUSA_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Dusa / Spanning Tree / Pure ASP
      {
        const start = performance.now();
        const command = `node run-dusa.js asp/spanning-tree-pure-asp.dusa ${jsonFilename} parent`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output / graph.numNodes, time: end - start };
        console.log(
          `spanning-tree,pure-asp,dusa-${DUSA_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Dusa / Canoncal Reps / FCLP
      {
        const start = performance.now();
        const command = `node run-dusa.js asp/canonical-reps.dusa ${jsonFilename} isRep`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output, time: end - start };
        console.log(
          `canonical-reps,fclp,dusa-${DUSA_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Dusa / Canoncal Reps / Pure ASP
      {
        const start = performance.now();
        const command = `node run-dusa.js asp/canonical-reps-pure-asp.dusa ${jsonFilename} isRep`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output, time: end - start };
        console.log(
          `canonical-reps,pure-asp,dusa-${DUSA_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      const seed = 0xcafe + 0xbeef * reps; // Whimsy
      const filename = getDataLP(tp, numEdges);

      // Alpha / Spanning Tree (Pure ASP)
      if (ALPHA_EXISTS) {
        const start = performance.now();
        const command = `java -jar alpha.jar -n1 -dni -i ${filename} -i asp/spanning-tree-pure-asp.lp -ftreecount -e${seed}`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout.slice(26)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output / graph.numNodes, time: end - start };
        console.log(`spanning-tree,pure-asp,alpha,${tp},${numEdges},${reps},${time},${result}`);
      }

      // Alpha / Canonical Representative (Pure ASP)
      if (ALPHA_EXISTS) {
        const start = performance.now();
        const command = `java -jar alpha.jar -n1 -dni -i ${filename} -i asp/canonical-reps-pure-asp.lp -frepcount -e${seed}`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            // console.log(stdout);
            resolve(parseInt(stdout.slice(25)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output, time: end - start };
        console.log(`canonical-reps,pure-asp,alpha,${tp},${numEdges},${reps},${time},${result}`);
      }

      // Clingo / Spanning Tree (Clingo ASP)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${filename} asp/spanning-tree-clingo-asp.lp asp/spanning-tree-show-treecount-clingo.lp`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(10)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output / graph.numNodes, time: end - start };
        console.log(
          `spanning-tree,clingo-asp,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Clingo / Spanning Tree (Pure ASP)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${filename} asp/spanning-tree-pure-asp.lp asp/spanning-tree-show-treecount-clingo.lp`;
        // console.log(command);
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(10)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output / graph.numNodes, time: end - start };
        console.log(
          `spanning-tree,pure-asp,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Clingo / Canonical Representative (Clingo ASP)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const seed = Math.floor(Math.random() * 100000);
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${filename} asp/canonical-reps-clingo-asp.lp asp/canonical-reps-show-repcount-clingo.lp`;
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(9)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output, time: end - start };
        console.log(
          `canonical-reps,clingo-asp,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }

      // Clingo / Canonical Representative (Pure ASP)
      if (CLINGO_VERSION) {
        const start = performance.now();
        const seed = Math.floor(Math.random() * 100000);
        const command = `clingo -n1 -V0 --rand-freq=1 --seed=${seed} ${filename} asp/canonical-reps-pure-asp.lp asp/canonical-reps-show-repcount-clingo.lp`;
        const output = await new Promise((resolve) => {
          exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
            resolve(parseInt(stdout.slice(9)));
          });
        });
        const end = performance.now();
        const { result, time } =
          end - start > TIMEOUT
            ? { result: 0, time: TIMEOUT }
            : { result: output, time: end - start };
        console.log(
          `canonical-reps,pure-asp,clingo-${CLINGO_VERSION},${tp},${numEdges},${reps},${time},${result}`,
        );
      }
    }
  }
}
