import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exec, execFile } from 'child_process';
import { tmpdir } from 'os';

export const PRINT_COMMANDS_TO_STDERR = { current: false };

export const DUSA_VERSION = JSON.parse(readFileSync('package-lock.json')).packages['node_modules/dusa'].version;

export const CLINGO_VERSION = await new Promise((resolve) => {
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

export const ALPHA_EXISTS = await new Promise((resolve) => {
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

export const NUMBER_OF_REPS = 3;
const TIMEOUT_IN_SECONDS = 100;
export const TIMEOUT = TIMEOUT_IN_SECONDS * 1000;
export const TIMEOUT_EPSILON = 500;

export async function testDusa(dusaProgram, jsonFilename, relation, solutionsToCount = 1, timeout = TIMEOUT) {
  const start = performance.now();
  const args = [`run-dusa.js`, `test-programs/${dusaProgram}.dusa`, `${jsonFilename}`, `${relation}`, `${solutionsToCount}`];
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: node ${args.join(' ')}\n`);
  }
  const [end, solutions, result] = await new Promise((resolve) => {
    const proc = execFile(
      'node',
      args,
      { timeout: timeout + TIMEOUT_EPSILON, maxBuffer: 256 * 1024 * 1024, killSignal: 9 },
      (_error, stdout, _stderr) => {
        const end = performance.now();
        const matches = [...stdout.matchAll(/\(([0-9]*)\)/g)];
        if (!stdout.trim().endsWith('DONE')) {
          resolve([end, -1, 0]);
          return;
        }
        let sum = 0;
        for (const match of matches) {
          sum += parseInt(match[1]);
        }
        resolve([end, matches.length, sum]);
      },
    );
  });
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}

export async function testClingo(clingoProgram, dataFilename, relation, seed, solutionsToCount = 1, timeout = TIMEOUT) {
  if (relation.indexOf('/') === -1) throw new Error('Relation must have arity');
  const showFilename = `${tmpdir()}/show-${relation.slice(0, relation.indexOf('/'))}.lp`;
  writeFileSync(showFilename, `#show ${relation}.`);
  const start = performance.now();
  const args = [
    `-n${solutionsToCount}`,
    `-V0`,
    `--rand-freq=1`,
    `--seed=${seed}`,
    `test-programs/${clingoProgram}.lp`,
    `${dataFilename}`,
    `${showFilename}`,
  ];
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: clingo ${args.join(' ')}\n`);
  }
  const [end, solutions, result] = await new Promise((resolve) => {
    const proc = execFile(
      'clingo',
      args,
      { timeout: timeout + TIMEOUT_EPSILON, maxBuffer: 256 * 1024 * 1024, killSignal: 9 },
      (_error, stdout, _stderr) => {
        const end = performance.now();
        if (!stdout.trimEnd().endsWith('SATISFIABLE')) {
          resolve([end, -1, 0]);
          return;
        }
        const lines = stdout.trimEnd().split('\n');
        const solutions = lines.slice(0, lines.length - 1);
        let sum = 0;
        for (const solution of solutions) {
          sum += (solution.match(/\(/g) || []).length;
        }
        resolve([end, solutions.length, sum]);
      },
    );
  });
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}

export async function testAlpha(alphaProgram, dataFilename, relation, seed, solutionsToCount = 1, timeout = TIMEOUT) {
  const start = performance.now();
  const args = [
    `-jar`,
    `alpha.jar`,
    `-n${solutionsToCount}`,
    `-dni`,
    `-i`,
    `test-programs/${alphaProgram}.lp`,
    `-i`,
    `${dataFilename}`,
    `-f${relation}`,
    `-e${seed}`,
  ];
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: java ${args.join(' ')}\n`);
  }
  const [end, solutions, result] = await new Promise((resolve) => {
    const proc = execFile(
      'java',
      args,
      { timeout: TIMEOUT + TIMEOUT_EPSILON, maxBuffer: 256 * 1024 * 1024, killSignal: 9 },
      (_error, stdout, _stderr) => {
        const end = performance.now();
        if (!stdout.trim().endsWith('SATISFIABLE')) {
          resolve([end, -1, 0]);
          return;
        }
        const solutions = stdout
          .trimEnd()
          .split('\n')
          .filter((line) => line.startsWith('{'));
        let sum = 0;
        for (const solution of solutions) {
          sum += (solution.match(/\(/g) || []).length;
        }
        resolve([end, solutions.length, sum]);
      },
    );
  });
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}
