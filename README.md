# DOM-diff - A JavaScript diffing algorith for DOM elements

This library allows the abstraction of differences between DOM
elements as a "diff" object, representing the sequence of modifications
that must be applied to one element in order to turn it into the other
element. This diff is non-destructive, meaning that relocations of
DOM nodes are preferred over remove-insert operations.

**NOTE:** this library is current under revision, and the master branch
is not in working state at the moment.

QUnit tests: http://pomax.github.io/DOM-diff/tests/
