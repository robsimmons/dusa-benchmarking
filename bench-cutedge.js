import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { ALPHA_EXISTS, CLINGO_VERSION, DUSA_VERSION, PRINT_COMMANDS_TO_STDERR, testDusa } from './util.js';

const data = JSON.parse(readFileSync('data/test-cutedge.json'));

const tmp = tmpdir();
function getDataLP(nodes, percentage, reps) {
  const filename = `${tmp}/cutedge-${nodes}-${percentage}-${reps}.lp`;
  const variant = data[`${nodes}/${percentage}`];
  writeFileSync(
    filename,
    `special(${variant.variants[reps].special}).\n` + variant.variants[reps].links.map(([x, y]) => `edge(${x},${y}).`).join('\n'),
  );
  return filename;
}
function getDataJSON(nodes, percentage, reps) {
  const filename = `${tmp}/cutedge-${nodes}-${percentage}-${reps}.json`;
  const variant = data[`${nodes}/${percentage}`];
  writeFileSync(
    filename,
    JSON.stringify(
      [{ name: 'special', args: [variant.variants[reps].special] }].concat(
        variant.variants[reps].links.map((args) => ({ name: 'edge', args })),
      ),
    ),
  );
  return filename;
}

PRINT_COMMANDS_TO_STDERR.current = true;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');
let i = 0;
for (const [_, { nodes, percentage, variants }] of [...Object.entries(data)].sort(([_a, a], [_b, b]) => a.nodes - b.nodes)) {
  for (const [reps] of variants.entries()) {
    i++;
    const seed = 0xcafe + 0xbeef * i;
    const lpFilename = getDataLP(nodes, percentage, reps);
    const jsonFilename = getDataJSON(nodes, percentage, reps);

    {
      const { solutions, result, time } = await testDusa('cutedge', jsonFilename, 'reachable', 10);
      console.log(`cutedge,pure-asp,dusa-${DUSA_VERSION},${percentage}%,${nodes},${reps},${time},${solutions},${result}`);
    }
  }
}
