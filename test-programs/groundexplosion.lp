dom(X-1) :- dom(X), X != 1.

p(X1,X2,X3,X4,X5,X6) :-
  select(X1),
  select(X2),
  select(X3),
  select(X4),
  select(X5),
  select(X6).

select(X) :- dom(X), not nselect(X).

nselect(X) :- dom(X), not select(X).

 :- not nselect(Y), select(X), dom(Y), X != Y.

q(X) :- p(X,_,_,_,_,_).
q(X-1) :- q(X), X != 1.
