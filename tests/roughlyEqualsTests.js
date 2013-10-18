require.config({ baseUrl: "../"} );

define(function (require) {

  function make(tag, content) {
    var e = document.createElement(tag);
    e.innerHTML = content;
    return e;
  }

  var roughlyEqual = require("roughlyEqual");
  
  QUnit.module("roughlyEqual tests");
  QUnit.test("roughlyEqual to check for differences and equalities", function() {

    var n1, n2;

    //n1 and n2 are undefined, equality should be false
    equal(roughlyEqual(n1, n2), false, "n1 and n2 are both undefined, and not considered roughlyEqual");
    

    //n1 and n2 are different nodeTypes
    n1 = document.createElement("p");
    n2 = document.createTextNode("hello world");  

    equal(roughlyEqual(n1, n2), false, "<p> and #text are not considered roughlyEqual");
    

    //n1 and n2 are the same nodeType and have the same data
    n1 = document.createTextNode("hello world");
    n2 = document.createTextNode("hello world");

    equal(roughlyEqual(n1, n2), true, "n1 and n2 are both {nodeType: 3, data:\"hello world\"}, and are considered roughlyEqual");


    //n1 and n2 are different element tags <p> and <span>
    n1 = document.createElement("p");
    n2 = document.createElement("span");  
    
    equal(roughlyEqual(n1, n2), false, "<p> and <span> are not considered roughlyEqual");

    //n1 and n2 have different childNode length
    n1 = make("div", '<p>test</p>');
    n2 = make("div", '<p></p>');

    equal(roughlyEqual(n1, n2), false, "<div><p></p></div> and <div><p>test</p></div> are not considered roughlyEqual");


    //n1 and n2 have same length of childNodes and same child nodeNames
    n1 = make("div", '<p>dog</p>');
    n2 = make("div", '<p>cat</p>');

    equal(roughlyEqual(n1, n2), true, "<div><p>cat</p></div> and <div><p>dog</p></div> are considered roughlyEqual");

    //n1 nad n2 have same length of childNodes and different types of nodes (I and #text)
    n1 = make("div", '<p><i>dog<i></p>');
    n2 = make("div", '<p>dog</p>');

    equal(roughlyEqual(n1, n2), false, "<div><p>dog</p></div> and <div><p><i>dog<i></p></div> are not considered roughlyEqual");

    //n1 and n2 have the same length of child nodes and different first-level child nodeNames
    n1 = make("div", '<ul><ul><li>test 1</li><li>test 3</li></ul></ul>');
    n2 = make("div", '<ol><ul><li>test 1</li><li>test 3</li></ul></ol>');

    equal(roughlyEqual(n1, n2), false, "<div><ul>...</ul></div> and <div><ol>...</ol></div> are not considered roughlyEqual");


  });

});
