
edge(X,Y) :- edge(Y,X).

% Exactly one root
node(X) :- edge(X,Y).
notRoot(X) :- node(X), not root(X).
root(X) :- node(X), not notRoot(X).
:- root(X), root(Y), X != Y.
someRoot :- root(X).
:- not someRoot.
parent(X,X) :- root(X).

% If P is in the tree and X-P is an edge, P can be a parent
inTree(P) :- parent(P,_).
parentYesNo(X,P) :- edge(X,P), inTree(P), parent(P,P2).
parent(X,P) :- parentYesNo(X,P), not notParent(X,P).
notParent(X,P) :- parentYesNo(X,P), not parent(X,P).

% A node can have no more than 1 parent
:- parent(X,P1), parent(X,P2), P1 != P2.

% If connected to a tree node, you must be in the tree
:- edge(X,Y), inTree(X), not inTree(Y).
