edge(Y, X) :- edge(X, Y).

{representative(X, X)} :- node(X).
representative(Y, Rep) :-
    edge(X,Y),
    representative(X,Rep).

% every node must have exactly 1 rep
isRep(Rep) :- representative(_,Rep).
hasRep(X) :- node(X), representative(X,R).
:- node(X), not 1{representative(X,R) : node(R)}1.

repcount(N) :- N = #count{R:representative(X,R)}.
#show repcount/1.
