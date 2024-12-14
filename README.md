# Performance tests for Dusa

Collects performance testing for the [Dusa language](https://dusa.rocks/docs).

### Directories

- `asp/` contains any answer set programming code
- `data/` contains JSON blobs representing test data
- `results/` contains CSV outputs of automated tests

### Data

`data/test-graphs-$N-to-$M-edges.json` was generated by running `node generate-test-graphs-json.js`. Random graphs are generated by calculating the probability of an edge existing that makes getting exactly the right number of edges most likely... and then generating graphs until one has exactly the right number of edges.

- `dense-near-complete` has _almost_ every edge, but it breaks out of the for loop enumerating edges early when exactly the desired number of edges shows up, unless there exists an integer number of vertices v such that v(v - 1)/ 2
- `dense-random` has each edge existing with probability 0.25
- `mid-random` has |V|^1.25 = |E|
- `sparse-cycles` has two connected components shaped like eights
- `sparse-linear` has every edge [n,n+1] except for one in the middle
- `sparse-random` has |V| = 0.5|E|
- `verysparse-random` has |V| = 1.3|E|
- `verysparse-islands` has |V| = 1.2|E|

The following ere generated by running `node generate-alpha-benchmark-json.js` with the set of benchmarks available from http://www.kr.tuwien.ac.at/research/systems/alpha/benchmarks.html downloaded is present as a subfolder `instances` of this directory:

- `data/test-graph5col.json` containing all the data from the graph-5-colorability tests in `instances/graph5col`
- `data/test-cutedge.json` containing all the data from the "cutedge" tests in `instances/cutedge`
- `data/test-reachability.json` containing all the data from the "reachability" tests in `instances/reachability`

### Commands

- `node bench-graph.js > results/graph-tests.csv` - tests Dusa, Clingo, and Alpha on the creation of spanning trees and the appointment of canonical representatives
- `node bench-queens.js > results/queens-tests.csv` - tests Dusa and Clingo on a few variants of the n-queens problem
- `node bench-groundexplosion.js > results/groundexplosion-tests.csv` - Alpha ground explosion benchmark
- `node bench-graph5col.js > results/graph5col-tests.csv` - Alpha 5-coloring benchmark
- `node bench-cutedge.js > results/cutedge-tests.csv` - Alpha "cutedge" edge-deletion benchmark
- `node bench-reachability.js > results/reachability-tests.csv` - Alpha graph reachability benchmark
- `node bench-mapgeneration.js > results/mapgeneration-tests.csv` - Scaled version of Adam Smith's Map Generation Speedrun, adapted from https://eis-blog.soe.ucsc.edu/2011/10/map-generation-speedrun/

The `node graph-tests.js` benchmarker will grab Clingo data if `clingo` is on your path, and will grab Alpha data if `java` is on your path and a file `alpha.jar` (as suggested [here](https://github.com/alpha-asp/Alpha?tab=readme-ov-file#getting-started)) exists in the same directory as this README file.

## License

Contents of the `test-programs/` and `data/` directories and subdirectories are licensed under the BSD 2-Clause license. All other code, including the Dusa implementation itself, is licensed under the GNU General Public License v3.0 (see LICENSE). The contents of the `test-programs/` directory includes work by Antonius Weinzierl, Lorenz Leutgeb, Torsten Schaub, and Adam Smith.

## Setting up from scratch

Tested on AWS m7g.xlarge with 64-bit (Arm) "Ubuntu Server 24.04 LTS (HVM), SSD Volume Type". The following commands set up a fresh install to run any of the benchmark commands ("`node bench-...`") aboce.

```
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install gringo default-jre git nodejs npm
rm -rf dusa-benchmarking && git clone https://github.com/robsimmons/dusa-benchmarking.git
cd dusa-benchmarking
npm install
curl -L https://github.com/alpha-asp/Alpha/releases/download/0.7.0/alpha-cli-app-0.7.0-bundled.jar > alpha.jar
echo "" | sudo tee -a /etc/security/limits.conf
echo "ubuntu hard as 10000000" | sudo tee -a /etc/security/limits.conf
```
