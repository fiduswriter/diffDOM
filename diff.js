// Moo
var find = function(s) { return document.querySelector(s); },
    make = function(t,c) { var d = document.createElement(t); if(c) d.innerHTML = c; return d; },
    t1 = find("#one"),
    t2 = find("#two"),
    t3 = find("#three");

/**
 * What to do when someone types in either of the source code textareas
 */
var parse = function() {
  // validate using slowparse
  var ret = Slowparse.HTML(document, t1.value);
  if(ret.error) {
    t1.style.background = "rgba(255,0,0,0.1)";
    return;
  } else { t1.style.background = "inherit"; }
  ret = Slowparse.HTML(document, t2.value);
  if(ret.error) {
    t2.style.background = "rgba(255,0,0,0.1)";
    return;
  } else { t2.style.background = "inherit"; }

  // form DOM trees
  var d1 = make("div", t1.value),
      d2 = make("div", t2.value);

  var routes = getDiff(d1,d2), route,
      d, lastRoute = routes.length, v,
      textAreaContent="";
  for(d = 0; d < lastRoute; d++) {

    // shortcuts
    if (routes[d] === 0) { textAreaContent += "no difference\n\n"; }
    else if (routes[d] === -1) { textAreaContent += "top level difference\n\n"; }

    // real work
    else {
      // follow the route to the elements
      route = arrayCopy(routes[d]);
      var diffRoute = "difference route: " + route,
          e1 = d1, e2 = d2, e;
      while(route.length>0 && route[0]!==-1) {
        e = route.splice(0,1);
        e1 = e1.childNodes[e];
        e2 = e2.childNodes[e]; }

      // text node update? simples!
      if(e1.nodeType===3 && e2.nodeType===3) {
        textAreaContent += diffRoute + "\n" +
                           "e1: " + (e1? serialise(e1) : "<missing>") + "\n" +
                           "e2: " + (e2? serialise(e2) : "<missing>") + "\n" +
                           "\n";
      }

      // childnode diff... Not so simple.
      else {
        var complexDiff = innerEquality(e1,e2), outerDiff; // from DOM-diff.js
        textAreaContent += "complex " + diffRoute + "\n";

        var pos, last, entry, outerDiff;

        // check for attribute differences
        outerDiff = outerEquality(e1,e2); // from DOM-diff.js
        if(outerDiff.length>0) {
          textAreaContent += "  outerHTML changes: \n";
          last = outerDiff.length;
          for(pos=0; pos<last; pos++) {
            entry = outerDiff[pos];
            textAreaContent += "    attribute: '"+entry[0]+"', left: '"+entry[1]+"', right: '"+entry[2]+"'\n";
          }
        }

        // Shortcut on "no complex diffs found". This
        // basically implies we did find an outer diff.
        if(!complexDiff) {
          textAreaContent += "\n";
          continue;
        }

        // check for node rearrangements
        last=complexDiff.positions.length;
        if(last>0) {
          textAreaContent += "  repositioning: \n";
          console.log(e1);
          console.log(e2);
          var s1, s2;
          for(pos=0; pos<last; pos++) {
            entry = complexDiff.positions[pos];
            textAreaContent += "    right["+entry[1]+"]->left["+entry[0]+"] ("+serialise(e1.childNodes[entry[0]])+")\n";
          }
        }

        // check for node insertions
        last = complexDiff.insertions.length;
        if(last>0) {
          textAreaContent += "  insertions: \n";
          for(pos=0; pos<last; pos++) {
            entry = complexDiff.insertions[pos];
            textAreaContent += "    left["+entry[0]+"] ("+serialise(entry[1])+")\n";
          }
        }

        // check for node removals
        last = complexDiff.removals.length;
        if(last>0) {
          textAreaContent += "  removals: \n";
          for(pos=0; pos<last; pos++) {
            entry = complexDiff.removals[pos];
            textAreaContent += "    right["+entry[0]+"] ("+serialise(entry[1])+")\n";
          }
        }
        textAreaContent += "\n";
      }
    }
  }

  t3.value = textAreaContent;
};

// bind event handling and parse
t1.onkeyup = function() { log("(1) parsing..."); parse(); };
t2.onkeyup = function() { log("(2) parsing..."); parse(); };
parse();