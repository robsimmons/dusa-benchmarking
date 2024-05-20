import { tmpdir } from 'os';
import { CLINGO_VERSION, DUSA_VERSION, NUMBER_OF_REPS, PRINT_COMMANDS_TO_STDERR, testDusa, testClingo } from './util.js';
import { writeFileSync } from 'fs';

const sizes = [1, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96];
const NUMBER_OF_QUEEN_SOLUTIONS = 10;

const tmp = tmpdir();
function getSizeJSON(size) {
  const filename = `${tmp}/size-${size}.json`;
  writeFileSync(filename, JSON.stringify([{ name: 'size', args: [], value: size }]));
  return filename;
}
function getDataLP(size) {
  const filename = `${tmp}/size-${size}.lp`;
  writeFileSync(filename, `size(${size}).`);
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
      const { solutions, result, time } = await testClingo('n-queens-0', lpFilename, 'numqueens', seed, NUMBER_OF_QUEEN_SOLUTIONS);
      console.log(`n-queens,pure-asp,dusa-${DUSA_VERSION},clingo-0,${size},${reps},${time},${solutions},${result}`);
    }

    {
      const { solutions, result, time } = await testDusa('n-queens-1', jsonFilename, 'location', NUMBER_OF_QUEEN_SOLUTIONS);
      console.log(`n-queens,fclp,dusa-${DUSA_VERSION},dusa-1,${size},${reps},${time},${solutions},${result}`);
    }

    {
      const { solutions, result, time } = await testDusa('n-queens-2', jsonFilename, 'col', NUMBER_OF_QUEEN_SOLUTIONS);
      console.log(`n-queens,fclp,dusa-${DUSA_VERSION},dusa-2,${size},${reps},${time},${solutions},${result}`);
    }

    {
      const { solutions, result, time } = await testDusa('n-queens-3', jsonFilename, 'rowFor', NUMBER_OF_QUEEN_SOLUTIONS);
      console.log(`n-queens,fclp,dusa-${DUSA_VERSION},dusa-3,${size},${reps},${time},${solutions},${result}`);
    }

    if (CLINGO_VERSION) {
      const { solutions, result, time } = await testClingo('n-queens-4', lpFilename, 'numqueens', seed, NUMBER_OF_QUEEN_SOLUTIONS);
      console.log(`n-queens,clingo-asp,dusa-${DUSA_VERSION},clingo-4,${size},${reps},${time},${solutions},${result}`);
    }
  }
}
