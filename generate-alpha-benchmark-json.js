import { writeFileSync, readdirSync, readFileSync } from 'fs';

const dir = './instances/graph5col/instances/';
const graph5colset = {};
for (const file of readdirSync(dir)) {
  if (file.startsWith('instance')) {
    const [nodes, edges, num] = file
      .slice(8)
      .split('_')
      .map((x) => parseInt(x));

    const links = readFileSync(dir + file, 'utf-8')
      .split('\n')
      .filter((line) => line.startsWith('link('))
      .map((line) =>
        line
          .slice(5)
          .split(',')
          .map((x) => parseInt(x)),
      );

    const name = `${nodes}/${edges}`;
    if (!graph5colset[name]) {
      graph5colset[name] = { nodes, edges, variants: [] };
    }

    graph5colset[name].variants[num - 1] = links;
  }
}
writeFileSync(`data/test-graph5col.json`, JSON.stringify(graph5colset, undefined, 4));
