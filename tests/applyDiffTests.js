require.config({ baseUrl: "../"} );

define(function (require) {

  function make(tag, content) {
    var e = document.createElement(tag);
    e.innerHTML = content;
    return e;
  }
var applicator = require("applyDiff");

//attribute diffs
QUnit.module("applyDiff tests");

QUnit.test("applyDiff for attribute removal, modification, and addition", function() {

    var t1;

    //remove the id="test" attribute from <li> element
    t1 = make("ul", "<li id=\"test\">test 1</li><li>test 2</li>");
    applicator.applyDiff([{action: "removed attribute", attribute: {name: "id"}, route:[0]}], t1);
    equal(t1.childNodes[0].getAttributeNode("id"), null, "id attribute has been removed from <li id='test'>test 1</li>");

    //change the id="old" attribute to id="new"
    t1 = make("ul", "<li id='old'>test 1</li><li>test 2</li>");

    applicator.applyDiff([{action: "modified attribute", attribute: {name: "id", newValue: "new", oldValue: "old"}, route:[0]}], t1);
    equal(t1.childNodes[0].getAttributeNode("id").value, "new", "id attribute has been changed from 'old' to 'new' in <li id='old'>");

    //added an addtribute to <li id='test'>...</li>
    t1 = make("ul", "<li id='test'>test 1</li><li>test 2</li>");

    applicator.applyDiff([{action: "added attribute", attribute: {name: "style", value: "color:blue"}, route:[0]}], t1);
    equal(t1.childNodes[0].getAttributeNode("style").value, "color:blue", "style attribute has been added to <li>test 1</li><li>test 2</li>");

  });
//element diffs
QUnit.test("applyDiff for element removal, appending, insertion, and movement", function() {

    var t1, t2;

    t1 = make("ul", "<li>test 1</li><li>test 2</li>");
    t2 = make("ul", "<li>test 1</li><li>test 2</li>");
    //remove first child element from <ul> t1
    applicator.applyDiff([{action: "remove element", route:[0]}], t1);
    //remove second child element from <ul> t2
    applicator.applyDiff([{action: "remove element", route:[1]}], t2);
    
    equal(t1.childNodes[0].textContent, "test 2", "<li>test 1</li> has been removed from <ul> element")
    equal(t2.childNodes[0].textContent, "test 1", "<li>test 2</li> has been removed from <ul> element")

    //append an element to a list of items
    t1 = make("ul", "<li>test 1</li><li>test 2</li>");

    applicator.applyDiff([{action: "append element", element: "<li>test 3</li>", route:[0]}], t1);
    equal(t1.innerHTML, "<li>test 1</li><li>test 2</li><li>test 3</li>", "<li>test 3</li> was appended to the list");

    //insert an element into to a list of items 2 positions from the first element, tested by route:[x], x being the position
    t1 = make("ul", "<li>test 1</li><li>test 2</li><li>test 4</li>");

    applicator.applyDiff([{action: "insert element", element: "<li>test 3</li>", route:[1]}], t1);
    equal(t1.innerHTML, "<li>test 1</li><li>test 2</li><li>test 3</li><li>test 4</li>", "<li>test 3</li> was appended to the list");

    //move an element from one position to another
    t1 = make("ul", "<li>test 1</li><li>test 3</li><li>test 2</li>");

    applicator.applyDiff([{action: "move elements", from: 2, to: 1, length: 1, route:[]}], t1);
    equal(t1.innerHTML, "<li>test 1</li><li>test 2</li><li>test 3</li>", "<li>test 2</li> was moved in the list to the correct position");

  });

//text modification
  QUnit.test("applyDiff for text modification, text to node, and node to text", function() {
    
    var t1;
    //modify the two list item's text
    t1 = make("ul", "<li>test 5</li><li>test 8</li>");

    applicator.applyDiff([{action: "text modification", newData: "test 1", route:[0]}], t1.childNodes[0]);
    applicator.applyDiff([{action: "text modification", newData: "test 2", route:[0]}], t1.childNodes[1]);
    equal(t1.innerHTML, "<li>test 1</li><li>test 2</li>", "The text was modified successfully for the two list items");

    //modify the text inside the list item into another element
    t1 = make("ul", "<li>test 1</li>");

    applicator.applyDiff([{action: "text to node", newData: "<ul><li>inner test 1</li></ul>", route:[0]}], t1);
    equal(t1.innerHTML, "<li><ul><li>inner test 1</li></ul></li>", "The text was replaced with an element successfully");

    t1 = make("ul", "<li><ul><li>inner test 1</li></ul></li>");

    applicator.applyDiff([{action: "node to text", newData: "test 1", route:[0]}], t1);
    equal(t1.innerHTML, "<li>test 1</li>", "The element was replaced with text successfully.");


  });

  QUnit.test("applyDiff for combined modifications", function() {
    
    var t1;

    t1 = make("ul", "<li id=\"test\">test 1</li><li>test 2</li>");
    
    var operations = [

    {action: "append element", element: "<li>in between</li>", route:[0]},
    {action: "remove element", route:[0]},
    {action: "insert element", element: "<li>test 4</li>", route:[0]},
    {action: "move elements", from: 2, to: 1, length: 1, route:[]},
    {action: "text to node", newData: "<ul><li>inside</li></ul>", route:[0]},
    {action: "text to node", newData: "<ul><li>inside</li></ul>", route:[2]},
    {action: "node to text", newData: "this used to be a node", route:[0]},
    {action: "removed attribute", attribute: {name: "id"}, route:[0]},
    {action: "added attribute", attribute: {name: "id", value: "testing"}, route:[0]},
    {action: "modified attribute", attribute: {name: "id", newValue: "new", oldValue: "testing"}, route:[0]},
    
    ];

    applicator.applyDiff(operations, t1);
    equal(t1.innerHTML, "<li id=\"new\">this used to be a node</li><li>in between</li><li><ul><li>inside</li></ul></li>", "Combined modifications made successfully");
  });

  QUnit.test("new test", function() {
  var t1;

    t1 = make("ul", "<li>test 2</li><li>test 2</li>");

    var operation = 
    [
                    {action: "text modification", newData: "test 1", route:[0, 0]}
    ];
    applicator.applyDiff(operation, t1);

    console.log(t1);
    equal(t1.innerHTML, "<li>test 1</li><li>test 2</li>", "The text was modified successfully for the two list items");
  });

});
