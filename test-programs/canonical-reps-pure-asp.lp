edge(Y,X) :- edge(X,Y).

% Any node may be its own representative
{representative(X,X)} :- node(X).

% Connected nodes must have the same representative
representative(Y,Rep) :-
    edge(X,Y),
    representative(X,Rep).

% Representatives must be unique
:- representative(X,R1), representative(X,R2), R1 != R2.

% Every node must have a representative
hasRep(X) :- representative(X,_).
:- node(X), not hasRep(X).

isRep(X) :- representative(_,X).