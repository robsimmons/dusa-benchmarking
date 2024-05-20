
{ queen(I,1..N) } == 1 :- size(N), I = 1..N.
{ queen(1..N,J) } == 1 :- size(N), J = 1..N.

 :- size(N), { queen(D-J,J) } >= 2, D = 2..2*N.
 :- size(N), { queen(D+J,J) } >= 2, D = 1-N..N-1.

numqueens(N) :- N = #count{X,Y : queen(X,Y)}.