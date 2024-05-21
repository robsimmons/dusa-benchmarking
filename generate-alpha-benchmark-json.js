import { writeFileSync, readdirSync, readFileSync } from 'fs';

{
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
  writeFileSync(`data/test-graph5col.json`, JSON.stringify(graph5colset));
}

{
  const dir = './instances/cutedge/instances/';
  const cutedgeset = {};
  for (const file of readdirSync(dir)) {
    if (file.startsWith('instance')) {
      const [nodes, percentage, num] = file
        .slice(8)
        .split('_')
        .map((x) => parseInt(x));

      const contents = readFileSync(dir + file, 'utf-8');
      const special = parseInt(contents.slice(178, 190));
      const links = contents
        .split('\n')
        .filter((line) => line.startsWith('edge('))
        .map((line) =>
          line
            .slice(5)
            .split(',')
            .map((x) => parseInt(x)),
        );
      const name = `${nodes}/${percentage}`;
      if (!cutedgeset[name]) {
        cutedgeset[name] = { nodes, percentage, variants: [] };
      }
      cutedgeset[name].variants[num - 1] = { special, links };
    }
  }
  writeFileSync(`data/test-cutedge.json`, JSON.stringify(cutedgeset));
}

{
  const dir = './instances/reachability/instances/';
  const reachabilityset = {};
  for (const file of readdirSync(dir)) {
    if (file.startsWith('instance')) {
      const [nodes, multiplier, num] = file
        .slice(8)
        .split('_')
        .map((x) => parseInt(x));

      const contents = readFileSync(dir + file, 'utf-8');
      const start = parseInt(contents.slice(100, 120));
      const links = contents
        .split('\n')
        .filter((line) => line.startsWith('edge('))
        .map((line) =>
          line
            .slice(5)
            .split(',')
            .map((x) => parseInt(x)),
        );

      const name = `${nodes}/${multiplier}`;
      if (!reachabilityset[name]) {
        reachabilityset[name] = { nodes, multiplier, variants: [] };
      }
      reachabilityset[name].variants[num - 1] = { start, links };
    }
  }
  writeFileSync(`data/test-reachability.json`, JSON.stringify(reachabilityset));
}
