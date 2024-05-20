import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { randomUUID } from 'crypto';
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
  const command = `node run-dusa.js test-programs/${dusaProgram}.dusa ${jsonFilename} ${relation} ${solutionsToCount}`;
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: ${command}\n`);
  }
  const [solutions, result] = await new Promise((resolve) => {
    exec(command, { timeout: timeout + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
      const matches = [...stdout.matchAll(/\(([0-9]*)\)/g)];
      if (!stdout.trim().endsWith('DONE')) {
        resolve([-1, 0]);
        return;
      }
      let sum = 0;
      for (const match of matches) {
        sum += parseInt(match[1]);
      }
      resolve([matches.length, sum]);
    });
  });
  const end = performance.now();
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}

export async function testClingo(clingoProgram, dataFilename, relation, seed, solutionsToCount = 1, timeout = TIMEOUT) {
  const showFilename = `${tmpdir()}/show-${relation}.lp`;
  writeFileSync(showFilename, `#show ${relation}/1.`);
  const start = performance.now();
  const command = `clingo -n${solutionsToCount} -V0 --rand-freq=1 --seed=${seed} test-programs/${clingoProgram}.lp ${dataFilename} ${showFilename}`;
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: ${command}\n`);
  }
  const [solutions, result] = await new Promise((resolve) => {
    exec(command, { timeout: timeout + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
      const matches = [...stdout.matchAll(/\(([0-9]*)\)/g)];
      if (!stdout.trim().endsWith('SATISFIABLE')) {
        resolve([-1, 0]);
        return;
      }
      let sum = 0;
      for (const match of matches) {
        sum += parseInt(match[1]);
      }
      resolve([matches.length, sum]);
    });
  });
  const end = performance.now();
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}

export async function testAlpha(alphaProgram, dataFilename, relation, seed, solutionsToCount = 1, timeout = TIMEOUT) {
  const start = performance.now();
  const command = `java -jar alpha.jar -n${solutionsToCount} -dni -i test-programs/${alphaProgram}.lp -i ${dataFilename} -f${relation} -e${seed}`;
  if (PRINT_COMMANDS_TO_STDERR.current) {
    process.stderr.write(`exec: ${command}\n`);
  }
  const [solutions, result] = await new Promise((resolve) => {
    exec(command, { timeout: TIMEOUT + TIMEOUT_EPSILON }, (_error, stdout, _stderr) => {
      const matches = [...stdout.matchAll(/\(([0-9]*)\)/g)];
      if (!stdout.trim().endsWith('SATISFIABLE')) {
        resolve([-1, 0]);
        return;
      }
      let sum = 0;
      for (const match of matches) {
        sum += parseInt(match[1]);
      }
      resolve([matches.length, sum]);
    });
  });
  const end = performance.now();
  return end - start > timeout ? { solutions: -2, result: 0, time: timeout } : { solutions, result, time: end - start };
}
