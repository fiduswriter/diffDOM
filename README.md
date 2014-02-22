# diffDOM - A JavaScript diffing algorithm for DOM elements

This library allows the abstraction of differences between DOM
elements as a "diff" object, representing the sequence of modifications
that must be applied to one element in order to turn it into the other
element. This diff is non-destructive, meaning that relocations of
DOM nodes are preferred over remove-insert operations.

This project is licensed under the LGPL v. 3. For details see LICENSE.txt.

Check the index.html file for tests.

