reachable(X, Y) :- edge(X, Y).
reachable(S, Y) :- start(S), reachable(S, X), reachable(X, Y).