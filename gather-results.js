import { readFileSync, readdirSync, writeFileSync } from 'fs';

const today = new Date().toISOString().slice(0, 10);
const dir = 'results/';

const HEADER = 'Problem,Dialect,System,Problem variant,Problem size,Rep,Time,Solutions,Output\n';

let segments = [HEADER.trim()];
for (const file of readdirSync(dir)) {
  if (file.endsWith('.csv') && file.split('-').length === 2) {
    const contents = readFileSync(dir + file, 'utf-8');
    if (!contents.startsWith(HEADER)) {
      throw new Error('bad header for ' + dir + file + ': ' + contents.split('\n')[0]);
    }
    segments.push(contents.slice(HEADER.length).trim());
  }
}

writeFileSync(`${dir}all-tests-${today}.csv`, segments.join('\n'));
