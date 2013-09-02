(function(){

  /**
   * What to do when someone types in either of the source code textareas
   */
  var parse = function(frame) {
    // validate using slowparse
    var ret = Slowparse.HTML(document, t1.value);
    if(ret.error) {
      t1.style.background = "rgba(255,0,0,0.1)";
      return false;
    } else { t1.style.background = "white"; }

    // form DOM trees
    var d1 = make("div", t1.value),
        d2 = make("div", t2.value);

    // Get diff
    var routes = DOMdiff.getDiff(d1, d2);

    // Turn diff into pure string for "transport",
    // then reconstitute and use to update second DOM
    var serialized = JSON.stringify(routes);
    var deserialized = JSON.parse(serialized);
    DOMdiff.applyDiff(deserialized, d1, d2);

    // show second DOM's updated source code
    t2.value = d2.innerHTML;

    // update iframe
    frame.update(t1.value);
  };

  /**
   * initialise the global variables,
   * and parse handling.
   */
  function init() {
    document.removeEventListener("DOMContentLoaded", init, false);

    // quick find/make, and the text areas
    find = function(s) { return document.querySelector(s); },
    make = function(t,c) { var d = document.createElement(t); if(c) d.innerHTML = c; return d; },
    t1 = find("#one"),
    t2 = find("#two"),
    t3 = find("#three"),
    frame = new Frame(find("iframe"));

    // set frame content
    t2.value = t1.value;
    frame.set(t1.value);

    // bind event handling and parse
    t1.onkeyup = function() { parse(frame) };
    parse(frame, true);
  }

  // kickstart on DOM ready
  document.addEventListener("DOMContentLoaded", init, false);

}());