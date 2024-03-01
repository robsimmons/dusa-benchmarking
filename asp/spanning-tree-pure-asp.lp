
edge(X,Y) :- edge(Y,X).

% Exactly one root
{root(X)} :- node(X).
:- root(X), root(Y), X != Y.
someRoot :- root(X).
:- not someRoot.

% The root has itself as a parent
parent(X,X) :- root(X).

% If P is in the tree and X-P is an edge, P can be a parent
inTree(P) :- parent(P,_).
{parent(X,P)} :- edge(X,P), inTree(P).

% A node can have no more than 1 parent
:- parent(X,P1), parent(X,P2), P1 != P2.

% If connected to a tree node, you must be in the tree
:- edge(X,Y), inTree(X), not inTree(Y).

% Count the nodes in the selected spanning tree
treecount(N) :- N = #count{X : inTree(X)}.
