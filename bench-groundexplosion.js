import { tmpdir } from 'os';
import {
  ALPHA_EXISTS,
  CLINGO_VERSION,
  DUSA_VERSION,
  NUMBER_OF_REPS,
  testAlpha,
  testClingo,
  testDusa,
  PRINT_COMMANDS_TO_STDERR,
} from './util.js';
import { writeFileSync } from 'fs';

const TIMEOUT = 100 * 1000;
const sizes = [1, 2, 3, 4, 6, 8, 12, 16, 17, 18, 19, 20, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1000];

const tmp = tmpdir();

function getDimJSON(size) {
  const filename = `${tmp}/dom-${size}.json`;
  writeFileSync(filename, JSON.stringify([{ name: 'dom', args: [size] }]));
  return filename;
}

function getDimLP(size) {
  const filename = `${tmp}/dom-${size}.lp`;
  writeFileSync(filename, `dom(${size}).`);
  return filename;
}

PRINT_COMMANDS_TO_STDERR.current = true;
let reps = 0;
console.log('Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output');
for (let reps = 1; reps <= NUMBER_OF_REPS; reps++) {
  for (const size of sizes) {
    const expected_solutions = 10;
    const jsonFilename = getDimJSON(size);
    const lpFilename = getDimLP(size);
    const seed = 0xcafe + 0xbeef * reps; // Whimsy

    {
      const { solutions, result, time } = await testDusa('groundexplosion', jsonFilename, 'p', 1);
      console.log(`groundexplosion,fclp,dusa-${DUSA_VERSION},return-1,${size},${reps},${time},${solutions},${result}`);
    }

    {
      const { solutions, result, time } = await testDusa('groundexplosion', jsonFilename, 'p', expected_solutions);
      console.log(`groundexplosion,fclp,dusa-${DUSA_VERSION},return-10,${size},${reps},${time},${solutions},${result}`);
    }

    if (CLINGO_VERSION) {
      const { solutions, result, time } = await testClingo('groundexplosion', lpFilename, 'numselected', seed, 1);
      console.log(`groundexplosion,pure-asp,clingo-${CLINGO_VERSION},return-1,${size},${reps},${time},${solutions},${result}`);
    }

    if (CLINGO_VERSION) {
      const { solutions, result, time } = await testClingo('groundexplosion', lpFilename, 'numselected', seed, expected_solutions);
      console.log(`groundexplosion,pure-asp,clingo-${CLINGO_VERSION},return-10,${size},${reps},${time},${solutions},${result}`);
    }

    if (ALPHA_EXISTS) {
      const { solutions, result, time } = await testAlpha('groundexplosion', lpFilename, 'numselected', seed, 1);
      console.log(`groundexplosion,pure-asp,alpha,return-1,${size},${reps},${time},${solutions},${result}`);
    }

    if (ALPHA_EXISTS) {
      const { solutions, result, time } = await testAlpha('groundexplosion', lpFilename, 'numselected', seed, expected_solutions);
      console.log(`groundexplosion,pure-asp,alpha,return-10,${size},${reps},${time},${solutions},${result}`);
    }
  }
}
