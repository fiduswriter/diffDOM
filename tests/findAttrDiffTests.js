require.config({ baseUrl: "../"} );

define(function (require) {

  /**
   * Creates a DOM element with or without 
   * inner HTML, an attribute, and an attribute value.
   */
  function makeWithAttr(tag, content, attr, value) {
    var e = document.createElement(tag);
    if (attr && value) e.setAttribute(attr, value);
    else if (attr) e.setAttribute(attr);
    if (content) e.innerHTML = content;
    return e;
  }
  
  var findAttrDiff = require("findAttrDiff");
  var diffTracker = require("DiffTracker");
  var attrDiffTracker = new diffTracker();

  QUnit.module("findAttrDiff tests");

  /**
   * Tests whether or not specific attributes have been removed or not.
   */
  QUnit.test("findAttrDiff to check for removed attributes", function() {
    var t1, t2, attrDiffs;

    t1 = makeWithAttr('div', '', 'style', 'margin:0');
    t2 = makeWithAttr('div');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].action === "removed attribute", "attribute has been removed");
    ok(attrDiffs[0].attribute.name === "style", "attribute was 'style'");
    ok(attrDiffs[0].attribute.value === "margin:0", "attribute's value was 'margin:0'");

    t1 = makeWithAttr('div', "<div id='a'></div>", 'class');
    t2 = makeWithAttr('div', "<div></div>", 'class');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs.length === 0, "no attributes removed for parent element");

    t1 = makeWithAttr('div', '', 'id');
    t2 = makeWithAttr('div', '', 'id');
    t1.setAttribute('class');

    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].action === "removed attribute", "attribute has been removed");
    ok(attrDiffs[0].attribute.name === "class", "attribute is 'class'");

  });
  
  /**
   * Tests whether specific attributes have been modified or not.
   */
  QUnit.test("findAttrDiff to check for modified attributes", function() {
    var t1, t2, attrDiffs;

    t1 = makeWithAttr('div', '', 'id', 'a');
    t2 = makeWithAttr('div', '', 'id', 'a');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs.length === 0, "attribute has not been modfied");

  	t1 = makeWithAttr('div', '', 'id', 'a');
    t2 = makeWithAttr('div', '', 'id', 'b');
  	
  	attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
  	ok(attrDiffs[0].action === "modified attribute", "attribute value has been modified");
    ok(attrDiffs[0].attribute.newValue === "b", "attribute value modified to 'b'");
  	ok(attrDiffs[0].attribute.name === t1.attributes[0].name, "attribute 'id' has not been modified");

    t1 = makeWithAttr('div', '', 'class', 'b');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].attribute.value === attrDiffs[0].attribute.value, "the attribute value has not been modified");

    t1 = makeWithAttr('div', "<div id='a'></div>", 'class');
    t2 = makeWithAttr('div', "<div id='b'></div>", 'class');

    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs.length === 0, "no attributes modified for parent element");
	
  });

  /**
   * Tests whether specific attrbutes have been added or not.
   */
  QUnit.test("findAttrDiff to check for added attributes", function() {
    var t1, t2, attrDiffs;

    t1 = makeWithAttr('div');
    t2 = makeWithAttr('div', '', 'class', 'apple');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].action === "added attribute", "attribute has been added");
    ok(attrDiffs[0].attribute.name === "class", "attribute is 'class'");
    ok(attrDiffs[0].attribute.value === "apple", "attribute value is 'apple'");

    t1 = makeWithAttr('div', '', 'id', 'banana');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].action === "removed attribute", "attribute has been removed");
    ok(attrDiffs[0].attribute.name === "id", "attribute was 'id'");
    ok(attrDiffs[1].action === "added attribute", "attribute has been added");
    ok(attrDiffs[1].attribute.name === "class", "attribute is 'class'");

    t1 = makeWithAttr('div', '', 'class');
    t2 = makeWithAttr('div', "<div id='a'></div>", 'class');

    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs.length === 0, "no attributes added for parent element");

    t1 = makeWithAttr('div', "<div id='a'></div>", 'class');
    t2.setAttribute('id');
    
    attrDiffs = findAttrDiff(t1, t2, [], attrDiffTracker);
    ok(attrDiffs[0].action === "added attribute", "attribute has been added");
    ok(attrDiffs[0].attribute.name === "id", "attribute is 'id'");

  });

});
