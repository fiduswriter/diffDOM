# diffDOM - A JavaScript diffing algorithm for DOM elements

This library allows the abstraction of differences between DOM
elements as a "diff" object, representing the sequence of modifications
that must be applied to one element in order to turn it into the other
element. This diff is non-destructive, meaning that relocations of
DOM nodes are preferred over remove-insert operations.

## License

This project is licensed under the LGPL v. 3. For details see LICENSE.txt.

## Demo and tests

Check http://fiduswriter.github.io/diffDOM for demo and tests.

## Usage

Include the diffDOM.js file in your HTML like this:
```
<script src="diffDOM.js">
```

Or like this in node/browserify:
```
var diffDOM = require("diffDOM");
```

Then create an instance of diffDOM within the javascript code:
```
dd = new diffDOM();
```

Now you can create a diff to get from dom elementA to dom elementB like this:
```
diff = dd.diff(elementA, elementB);
```

You can now apply this diff like this:
```
dd.apply(elementA, diff);
```
Now elementA will have been changed to be structurally equal to elementB.

### Advanced uses

#### Undo

Continuing on from the previous example, you can also undo a diff, like this:
```
dd.undo(elementA, diff);
```
Now elementA will be what it was like before applying the diff.

#### Remote changes

If you need to move diffs from one machine to another one, you will likely want to send the diffs through a websocket connection or as part of a form submit. In both cases you need to convert the diff to a json string.

To convert a diff to a json string which you can send over the network, do:
```
diffJson = JSON.stringify(diff);
```

On the receiving end you then need to unpack it like this:
```
diff = JSON.parse(diffJson);
```

#### Error handling when patching/applying

Sometimes one may try to patch an elment without knowing whether the patch actually will apply cleanly. This should not be a problem. If diffDOM determines that a patch cannot be executed, it will simple return false. Else it will return true:
```
result = dd.apply(element, diff);

if (result) {
    console.log('no problem!');
} else {
    console.log('diff could not be applied');
}
```
#### Advanced merging of text node changes

diffDOM does not include merging for changes to text nodes. However, it includes hooks so that you can add more advanced handling. Simple overwrite the textDiff function of the diffDOM instance. The functions TEXTDIFF and TEXTPATCH need to be defined in the code:
```
dd = new diffDOM();

dd.textDiff = function (node, currentValue, expectedValue, newValue) {
    if (currentValue===expectedValue) {
        // The text node contains the text we expect it to contain, so we simple change the text of it to the new value.
        node.data = newValue;
    } else {
        // The text node currently does not contain what we expected it to contain, so we need to merge. 
        difference = TEXTDIFF(expectedValue, currentValue);
        node.data = TEXTPATCH(newValue, difference);
    }
    return true;
};
```

#### Debugging

For debugging you might want to set a max number of diff changes between two elements before diffDOM gives up. To allow for a maximum of 500 differences between elements when diffing, initialize diffDOM like this:
```
dd = new diffDOM(true, 500);
```

