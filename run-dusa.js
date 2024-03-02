import { Dusa } from 'dusa';
import { readFileSync } from 'fs';

const progfile = readFileSync(process.argv[2]).toString('utf-8');
const data = JSON.parse(readFileSync(process.argv[3]));
const predToCount = process.argv[4];

const dusa = new Dusa(progfile);
for (const fact of data) {
  dusa.assert(fact);
}

console.log([...dusa.sample().lookup(predToCount)].length);
