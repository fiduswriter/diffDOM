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
        <div></div>
        <hr>
      </div>

    against:

      <div>
        <hr>
        <div></div>
      </div>

    There is a three-set correspondence {#text1, div}, {#text1, hr}, {#text2}
  ******/
  QUnit.test("markSubtrees for simple swap", function() {

    var t1, t2, mappings;

    t1 = make("div", "\n  <div></div>\n  <hr>\n");
    t2 = make("div", "\n  <hr>\n  <div></div>\n");
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 3, "depth maps: 3");

    if (mappings.length === 3) {
      var mapping = mappings[0];
      ok(mapping.length === 2, "two elements in map 1");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 2, "start at 2 in t2");

      mapping = mappings[1];
      ok(mapping.length === 2, "two elements in map 2");
      ok(mapping.old === 2, "start at 2 in t1");
      ok(mapping.new === 0, "start at 0 in t2");

      mapping = mappings[2];
      ok(mapping.length === 1, "one elements in map 3");
      ok(mapping.old === 4, "sits at 4 in t1");
      ok(mapping.new === 4, "sits at 4 in t2");
    }
  });

  /*****
    check:

      <div>
        <hr>
        <div>a</div>
        <div>b</div>
      </div>

    against:

      <div>
        <div>a</div>
        <div>b</div>
        <hr>
      </div>

    There is a three-set correspondence {#text1, hr}, {#text1, div_a, #text1, div_b}, {#text2}
  ******/
  QUnit.test("markSubtrees for larger swap", function() {

    var t1, t2, mappings;

    t1 = make("div", "\n  <hr>\n  <div>a</div>\n  <div>b</div>\n");
    t2 = make("div", "\n  <div>a</div>\n  <div>b</div>\n  <hr>\n");
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 3, "depth maps: 3");

    if (mappings.length === 3) {
      var mapping = mappings[0];
      ok(mapping.length === 4, "four elements in map 1");
      ok(mapping.old === 2, "start at 2 in t1");
      ok(mapping.new === 0, "start at 0 in t2");

      mapping = mappings[1];
      ok(mapping.length === 2, "two elements in map 2");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 4, "start at 4 in t2");

      mapping = mappings[2];
      ok(mapping.length === 1, "one elements in map 3");
      ok(mapping.old === 6, "sits at 6 in t1");
      ok(mapping.new === 6, "sits at 6 in t2");
    }
  });

  /*****
    check:

      <div>
        <p>test</p>
      </div>

    against:

      <div>
        <p><i>test</i></p>
      </div>

    The <p> text node gets replaced with an element node
  ******/
  QUnit.test("markSubtrees text=>node difference", function() {
    var t1, t2, mappings;

    t1 = make("div", "\n  <p>test</p>\n");
    t2 = make("div", "\n  <p><i>test</i></p>\n");
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 2, "first depth maps: 2");

    if (mappings.length === 2) {
      var mapping = mappings[0];
      ok(mapping.length === 1, "one elements in map 1");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");

      mapping = mappings[1];
      ok(mapping.length === 1, "one elements in map 2");
      ok(mapping.old === 2, "start at 2 in t1");
      ok(mapping.new === 2, "start at 2 in t2");
    }

    t1 = t1.childNodes[1];
    t2 = t2.childNodes[1];
    mappings = markSubTrees(t1, t2);
    ok(mappings.length === 0, "second depth maps: 0");
  });

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
    ok(mappings.length === 2, "second depth maps: 2");

    if (mappings.length === 2) {
      mapping = mappings[0];
      ok(mapping.length === 1, "one elements in map");
      ok(mapping.old === 0, "start at 0 in t1");
      ok(mapping.new === 0, "start at 0 in t2");

      mapping = mappings[1];
      ok(mapping.length === 1, "one elements in map");
      ok(mapping.old === 2, "start at 2 in t1");
      ok(mapping.new === 2, "start at 2 in t2");
    }
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

    There are attribute differences, but no content differences
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