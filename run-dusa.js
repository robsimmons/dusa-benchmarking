import { Dusa } from 'dusa';
import { readFileSync } from 'fs';

const progfile = readFileSync(process.argv[2]).toString('utf-8');
const data = JSON.parse(readFileSync(process.argv[3]));
const predToCount = process.argv[4];
const solutionsToCount = parseInt(process.argv[5]);

const dusa = new Dusa(progfile);
for (const fact of data) {
  dusa.assert(fact);
}

const solutions = dusa.solutions;
for (let i = 0; i < solutionsToCount; i++) {
  const solution = solutions.next();
  // console.log([...solution.value.facts]);
  if (!solution.value) break;
  console.log(`(${[...solution.value.lookup(predToCount)].length})`);
}
console.log('DONE');
