dim(1..W) :- width(W).
{ solid(X,Y) :dim(X), dim(Y) }.

start(1,1).
finish(W,W) :- width(W).
step(0,-1).
step(0,1).
step(1,0).
step(-1,0).

reachable(X,Y) :-
    start(X,Y),
    solid(X,Y).
reachable(NX,NY) :-
    reachable(X,Y),
    step(DX,DY),
    NX = X + DX,
    NY = Y + DY,
    solid(NX,NY).

complete :- finish(X,Y), reachable(X,Y).
:- not complete.

at(X,Y, 0) :- start(X,Y), solid(X,Y).
at(NX,NY, T+1) :-
    at(X,Y,T),
    length(Len),
    T < Len,
    step(DX,DY),
    NX = X + DX,
    NY = Y + DY,
    solid(NX,NY).

speedrun :- finish(X,Y), at(X,Y,T).
:- speedrun.

reachable_edge(X,Y) :- width(X), reachable(X, Y).
reachable_edge(X,Y) :- width(Y), reachable(X, Y).