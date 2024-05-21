import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { ALPHA_EXISTS, CLINGO_VERSION, DUSA_VERSION, PRINT_COMMANDS_TO_STDERR, testDusa } from './util.js';

const data = JSON.parse(readFileSync('data/test-reachability.json'));

const tmp = tmpdir();
function getDataLP(nodes, multiplier, reps) {
  const filename = `${tmp}/reachability-${nodes}-${multiplier}-${reps}.lp`;
  const variant = data[`${nodes}/${multiplier}`];
  writeFileSync(
    filename,
    `start(${variant.variants[reps].start}).\n` + variant.variants[reps].links.map(([x, y]) => `edge(${x},${y}).`).join('\n'),
  );
  return filename;
}
function getDataJSON(nodes, multiplier, reps) {
  const filename = `${tmp}/multiplier-${nodes}-${multiplier}-${reps}.json`;
  const variant = data[`${nodes}/${multiplier}`];
  writeFileSync(
    filename,
    JSON.stringify(
      [{ name: 'start', args: [variant.variants[reps].start] }].concat(
        variant.variants[reps].links.map((args) => ({ name: 'edge', args })),
      ),
    ),
  );
  return filename;
}

PRINT_COMMANDS_TO_STDERR.current = true;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');
let i = 0;
for (const [_, { nodes, multiplier, variants }] of [...Object.entries(data)].sort(([_a, a], [_b, b]) => a.nodes - b.nodes)) {
  for (const [reps] of variants.entries()) {
    i++;
    const seed = 0xcafe + 0xbeef * i;
    const lpFilename = getDataLP(nodes, multiplier, reps);
    const jsonFilename = getDataJSON(nodes, multiplier, reps);

    {
      const { solutions, result, time } = await testDusa('reachability', jsonFilename, 'reachable', 10);
      console.log(`reachability,pure-asp,dusa-${DUSA_VERSION},${multiplier},${nodes},${reps},${time},${solutions},${result}`);
    }
  }
}
