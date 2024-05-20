{ queen(1..N,1..N) } :- size(N).

:- size(N), not { queen(I,J) } == N.
:- queen(I,J), queen(I,JJ), J != JJ.
:- queen(I,J), queen(II,J), I != II.
:- queen(I,J), queen(II,JJ), (I,J) != (II,JJ), I-J == II-JJ.
:- queen(I,J), queen(II,JJ), (I,J) != (II,JJ), I+J == II+JJ.

numqueens(N) :- N = #count{X,Y : queen(X,Y)}.