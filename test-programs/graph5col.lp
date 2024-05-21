% Guess colours.
chosenColour(N,C) :- node(N), colour(C), not notChosenColour(N,C).
notChosenColour(N,C) :- node(N), colour(C), not chosenColour(N,C).
% At least one color per node.
:- node(X), not colored(X).
colored(X) :- chosenColour(X,Fv1).
% Only one color per node.
:- node(N), chosenColour(N,C1), chosenColour(N,C2), C1!=C2.
% No two adjacent nodes have the same colour. 
:- link(X,Y), node(X), node(Y), X<Y, chosenColour(X,C), chosenColour(Y,C).
colour(red0).
colour(green0).
colour(blue0).
colour(yellow0).
colour(cyan0).
:- node(X), not chosenColour(X,red0), not chosenColour(X,blue0), not chosenColour(X,yellow0), not chosenColour(X,green0), not chosenColour(X,cyan0).

isRed(X) :- chosenColour(X,red0).