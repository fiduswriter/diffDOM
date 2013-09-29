require.config({ baseUrl: "../"} );

define(function (require) {

  function make(tag, content) {
    var e = document.createElement(tag);
    e.innerHTML = content;
    return e;
  }

  var markSubTrees = require("markSubTrees");

  // Define the QUnit module and lifecycle.
  QUnit.module("markSubTree tests");

  /* ================================================= */
  /* =               tests start here                = */
  /* ================================================= */

  /*****
    check:

      <div>
        <p>test</p>
        <p>test2</p>
        <ol>
          <li>test</li>
        </ol>
      </div>

    against:

      <div>
        <p>test</p>
        <p>test2</p>
        <ol>
          <li>test 2</li>
        </ol>
      </div>

    There is a difference in the div.ol.li
  ******/
  QUnit.test("markSubtrees for deep textnode difference", function() {

    var t1, t2, mappings;

    t1 = make("div", "\n  <p>test</p>\n  <p>test 2</p>\n  <ol>\n    <li>test</li>\n  </ol>\n");
    t2 = make("div", "\n  <p>test</p>\n  <p>test 2</p>\n  <ol>\n    <li>test 2</li>\n  </ol>\n");
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 1, "first depth maps: 1");

    if (mappings.length === 1) {
      var mapping = mappings[0];
      ok(mapping.length === 7, "seven elements in map");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");
    }

    t1 = t1.childNodes[5];
    t2 = t2.childNodes[5];
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 1, "second depth maps: 1");

    if (mappings.length === 1) {
      mapping = mappings[0];
      ok(mapping.length === 3, "three elements in map");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");
    }

    t1 = t1.childNodes[1];
    t2 = t2.childNodes[1];
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 0, "third depth maps: 0");
  });



  /*****
    check:

      <div>
        <p style="display:none;" class="cow">test</p>
      </div>

    against:

      <div>
        <p class="cow" data-tooltip="moo">test</p>
      </div>

    There is a difference in the div.ol.li
  ******/
  QUnit.test("markSubtrees for shallow attribute differences", function() {
    var t1, t2, mappings;

    t1 = make("div", '\n  <p style="display:none;" class="cow">test</p>\n');
    t2 = make("div", '\n  <p class="cow" data-tooltip="moo">test</p>\n');
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 1, "first depth maps: 1");

    if (mappings.length === 1) {
      var mapping = mappings[0];
      ok(mapping.length === 3, "three elements in map");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");
    }

    t1 = t1.childNodes[1];
    t2 = t2.childNodes[1];
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 1, "second depth maps: 1");

    if (mappings.length === 1) {
      mapping = mappings[0];
      ok(mapping.length === 1, "one elements in map");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");
    }
  });

});