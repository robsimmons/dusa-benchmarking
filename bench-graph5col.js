import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import {
  ALPHA_EXISTS,
  CLINGO_VERSION,
  DUSA_VERSION,
  PRINT_COMMANDS_TO_STDERR,
  testAlpha,
  testClingo,
  testDusa,
} from './util.js';

const data = JSON.parse(readFileSync('data/test-graph5col.json'));

const tmp = tmpdir();
function getDataLP(nodes, edges, reps) {
  const filename = `${tmp}/graph5col-${nodes}-${edges.length / 2}-${reps + 1}.lp`;
  writeFileSync(
    filename,
    Array.from({ length: nodes })
      .map((_, i) => `node(${i + 1}).`)
      .join('\n') +
      '\n' +
      edges.map(([a, b]) => `link(${a},${b}).`).join('\n'),
  );
  return filename;
}

function getDataJSON(nodes, edges, reps) {
  const filename = `${tmp}/graph5col-${nodes}-${edges.length / 2}-${reps + 1}.json`;
  writeFileSync(
    filename,
    JSON.stringify(
      Array.from({ length: nodes })
        .map((_, i) => ({ name: 'node', args: [i + 1] }))
        .concat(edges.map((args) => ({ name: 'link', args }))),
    ),
  );
  return filename;
}

PRINT_COMMANDS_TO_STDERR.current = true;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');
let i = 0;
for (const [_, { nodes, edges, variants }] of [...Object.entries(data)].sort(([_a, a], [_b, b]) => a.nodes - b.nodes)) {
  for (const [reps, variant] of variants.entries()) {
    i++;
    const seed = 0xcafe + 0xbeef * i;
    const lpFilename = getDataLP(nodes, variant, reps);
    const jsonFilename = getDataJSON(nodes, variant, reps);

    {
      const { solutions, result, time } = await testDusa('graph5col', jsonFilename, 'isRed', 10);
      console.log(`graph5col,fclp,dusa-${DUSA_VERSION},${edges / nodes},${nodes},${reps},${time},${solutions},${result}`);
    }

    if (ALPHA_EXISTS) {
      const { solutions, result, time } = await testAlpha('graph5col', lpFilename, 'numRed', seed, 10);
      console.log(`graph5col,pure-asp,alpha,${edges / nodes},${nodes},${reps},${time},${solutions},${result}`);
    }

    if (CLINGO_VERSION) {
      const { solutions, result, time } = await testClingo('graph5col', lpFilename, 'numRed', seed, 10);
      console.log(`graph5col,pure-asp,clingo-${CLINGO_VERSION},${edges / nodes},${nodes},${reps},${time},${solutions},${result}`);
    }
  }
}
