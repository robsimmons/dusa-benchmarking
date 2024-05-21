edge(Y,X) :- edge(X,Y).

% Any node may be its own representative
{representative(X,X)} :- node(X).

% Connected nodes must have the same representative
representative(Y,Rep) :-
    edge(X,Y),
    representative(X,Rep).

% Representatives must be unique
% Every node must have a representative
:- node(X), not 1{representative(X,R) : node(R)}1.
