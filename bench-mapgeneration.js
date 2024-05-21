import { tmpdir } from 'os';
import {
  CLINGO_VERSION,
  DUSA_VERSION,
  NUMBER_OF_REPS,
  PRINT_COMMANDS_TO_STDERR,
  testDusa,
  testClingo,
  ALPHA_EXISTS,
  testAlpha,
} from './util.js';
import { writeFileSync } from 'fs';

const NUMBER_OF_MAPS = 5;
const sizes = [5, 6, 7, 8, 10, 13, 18, 26, 39, 60, 70, 80, 90];

const tmp = tmpdir();
function getSizeJSON(size) {
  const filename = `${tmp}/size-${size}.json`;
  writeFileSync(
    filename,
    JSON.stringify([
      { name: 'width', args: [], value: size },
      { name: 'length', args: [], value: size * 2 + 1 },
    ]),
  );
  return filename;
}
function getDataLP(size) {
  const filename = `${tmp}/size-${size}.lp`;
  writeFileSync(filename, `width(${size}).\nlength(${size * 2 + 1}).`);
  return filename;
}

PRINT_COMMANDS_TO_STDERR.current = true;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');

for (let reps = 1; reps <= NUMBER_OF_REPS; reps++) {
  for (const size of sizes) {
    const jsonFilename = getSizeJSON(size);
    const lpFilename = getDataLP(size);
    const seed = 0xcafe + 0xbeef * reps;

    if (CLINGO_VERSION) {
      const { solutions, result, time } = await testClingo('map-generation', lpFilename, 'reachable_edge/2', seed, NUMBER_OF_MAPS);
      console.log(`map-generation,pure-asp,clingo-${CLINGO_VERSION},mapgen,${size},${reps},${time},${solutions},${result}`);
    }

    if (ALPHA_EXISTS) {
      const { solutions, result, time } = await testAlpha('map-generation', lpFilename, 'reachable_edge', seed, NUMBER_OF_MAPS);
      console.log(`map-generation,pure-asp,alpha,mapgen,${size},${reps},${time},${solutions},${result}`);
    }

    {
      const { solutions, result, time } = await testDusa('map-generation', jsonFilename, 'reachable_edge', NUMBER_OF_MAPS);
      console.log(`map-generation,fclp,dusa-${DUSA_VERSION},mapgen,${size},${reps},${time},${solutions},${result}`);
    }
  }
}
