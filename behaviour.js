// iframe modeling object
var Frame = function(iframe) {
  this.window = iframe.contentWindow;
  this.document = iframe.contentDocument;
  this.head = this.document.head;
  this.body = this.document.body;
}

Frame.prototype = {
/*
  // script loading inside the frame
  loadIntoHead: function(element) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    if(element.getAttribute("src")) { script.src = element.getAttribute("src"); }
    else { script.innerHTML = element.innerHTML; }
    this.head.appendChild(script);
  },
*/

  // find an element in the DOM tree
  find: function(treeRoute) {
    var e = this.body,
        route = snapshot(treeRoute),
        pos = route.splice(0,1)[0];
    while(pos!==-1) {
      e = e.childNodes[pos];
      pos = route.splice(0,1)[0];
    }
    return e;
  },

  // does this frame contain this element?
  contains: function(element) {
    var set = snapshot(this.body.children),
        s, last=set.length;
    for(s=0; s<last; s++) {
      if(equal(element,set[s])===0) {
        this.mark(set[s]);
        return true; }}
    return false;
  },

  // does this frame already contain this
  // script (in the head)?
  containsScript: function(script) {
    var set = snapshot(this.head.children),
        s, last=set.length;
    for(s=0; s<last; s++) {
      if(equal(script,set[s])===0) {
        this.mark(set[s]);
        return true; }}
    return false;
  },

  // replace one DOM node with another
  replace: function(n1,n2) {
    this.body.replaceChild(n2,n1);
  },

  // Update the DOM, based on a snapshot
  // of a DOM NodeSet, and a diff that
  // indicates what should happen.
  update: function(elements, diff) {
    // ... code comes later ...
  },

  // update the head's script set. This
  // basically set up script mirrors
  // in the head for any <script> element
  // that has been found in the body.
  updateScripts: function(elements) {
    var s, last = elements.length, script;
    for(s=0; s<last; s++) {
      script = elements[s];
      if(this.containsScript(script)) { continue; }
      else { this.loadIntoHead(script); }
    }
  },

  // set the DOM content.
  set: function(elementContainer) {
    this.body.innerHTML = "";
    var children = elementContainer.childNodes;
    while(children.length>0) {
      this.body.appendChild(children[0]);
    }
  }
};

/**
 * What to do when someone types in either of the source code textareas
 */
var parse = function(frame, doUpdate) {


  // validate using slowparse
  var ret = Slowparse.HTML(document, t1.value);
  if(ret.error) {
    t1.style.background = "rgba(255,0,0,0.1)";
    return;
  } else { t1.style.background = "inherit"; }
  // end of validation - if we get here, we can update.


  // form DOM trees
  var d1 = make("div", t1.value),
      d2 = make("div", t2.value);

  var routes = DOMdiff.getDiff(d1,d2), route, iroute,
      d, lastRoute = routes.length, v,
      textAreaContent="";

  for(d = 0; d < lastRoute; d++) {

    // shortcut
    if (routes[d] === 0) {
      textAreaContent += "no difference\n\n";
      continue;
    }

    // rewrite so we do can resolve the top-level diff
    if (routes[d] === -1) {
      textAreaContent += "top level difference\n\n";
      routes[d] = [-1];
    }

    // follow the route to the elements
    route = arrayCopy(routes[d]),
    iroute = arrayCopy(routes[d]);
    var diffRoute = "difference route: " + route,
        e1 = d1, e2 = d2,
        e = route.splice(0,1)[0];
    while (e !== -1) {
      e1 = e1.childNodes[e];
      e2 = e2.childNodes[e];
      e = route.splice(0,1)[0]; }

    // text node update? simples!
    if(e1.nodeType===3 && e2.nodeType===3) {
      textAreaContent += diffRoute + "\n" +
                         "e1: " + (e1? serialise(e1) : "<missing>") + "\n" +
                         "e2: " + (e2? serialise(e2) : "<missing>") + "\n" +
                         "\n";

      // IFRAME UPDATING
      if(doUpdate) {
        var element = frame.find(iroute),
            parent = element.parentNode;
        parent.replaceChild(e1,element);
      }
      // IFRAME UPDATING
    }

    // childnode diff... Not so simple.
    else {
      var complexDiff = DOMdiff.innerEquality(e1,e2),
          pos, last, entry;

      textAreaContent += "complex " + diffRoute + "\n";

      // check for attribute differences
      var outerDiff = DOMdiff.outerEquality(e1,e2);
      if(outerDiff.length>0) {
        textAreaContent += "  outerHTML changes: \n";
        last = outerDiff.length;
        for(pos=0; pos<last; pos++) {
          entry = outerDiff[pos];
          textAreaContent += "    attribute: '"+entry[0]+"', left: '"+entry[1]+"', right: '"+entry[2]+"'\n";

          // IFRAME UPDATING
          if(doUpdate) {
            var element = frame.find(iroute);
            element.setAttribute(entry[0], entry[1]);
          }
          // IFRAME UPDATING
        }
      }

      // Shortcut on "no complex diffs found". This
      // basically implies we did find an outer diff.
      if(!complexDiff) {
        textAreaContent += "\n";
        continue;
      }

      // check for node removals
      last = complexDiff.removals.length;
      if(last>0) {
        textAreaContent += "  removals: \n";
        // NOTE: remove elements from tail to head
        for(pos=last-1; pos>=0; pos--) {
          entry = complexDiff.removals[pos];
          textAreaContent += "    right["+entry[0]+"] ("+serialise(entry[1])+")\n";

          // IFRAME UPDATING
          if(doUpdate) {
            var element = frame.find(iroute).childNodes[entry[0]],
                parent = element.parentNode;
            parent.removeChild(element);
            t2.value = frame.body.innerHTML;
            
            // update the relocations, because by removing X,
            // any relocation of the type left[a]->right[b] 
            // where b is X or higher, should now be
            // left[a] -> right[b-1] -- Note that the following
            // code is POC, and still needs cleaning up.

            // FIXME: clean up this code
            for(var i=0; i<complexDiff.relocations.length; i++) {
              var relocation = complexDiff.relocations[i];
              if(relocation[1] >= entry[0]) {
                relocation[1]--;
              }
            }

          }
          // IFRAME UPDATING
        }
      }

      // check for node insertions
      last = complexDiff.insertions.length;
      if(last>0) {
        textAreaContent += "  insertions: \n";
        // NOTE: insert elements from head to tail
        for(pos=0; pos<last; pos++) {
          entry = complexDiff.insertions[pos];
          textAreaContent += "    left["+entry[0]+"] ("+serialise(entry[1])+")\n";

          // IFRAME UPDATING
          if(doUpdate) {
            var element = frame.find(iroute);
            element.insertBefore(entry[1], element.childNodes[entry[0]]);
            t2.value = frame.body.innerHTML;

            // update the relocations, because by inserting X,
            // any relocation of the type left[a]->right[b] 
            // where b is X or higher, should now be
            // left[a] -> right[b+1] -- Note that the following
            // code is POC, and still needs cleaning up.

            // FIXME: clean up this code
            for(var i=0; i<complexDiff.relocations.length; i++) {
              var relocation = complexDiff.relocations[i];
              if(relocation[1] >= entry[0]) {
                relocation[1]++;
              }
            }

          }
          // IFRAME UPDATING
        }
      }

      // preform just-moved-around updates
      last = complexDiff.relocations.length;
      if(last>0) {
        textAreaContent += "  relocations: \n";

        var element, nodes, nlen,
            child, next,
            oldPos, newPos;

        // NOTE: relocate elements from tail to head
        for(pos=last-1; pos>=0; pos--) {
          element = frame.find(iroute);
          nodes = element.childNodes;
          entry = complexDiff.relocations[pos];
          textAreaContent += "    left["+entry[0]+"] <-> right["+entry[1]+"]\n";// ("+serialise(nodes[entry[1]])+")\n";

          // IFRAME UPDATING
          if(false && doUpdate) {
            nlen = nodes.length;
            oldPos = entry[1];
            child = element.childNodes[oldPos];
            newPos = entry[0];
            next = (newPos<nlen ? element.childNodes[newPos] : child);

            // end of the list relocation
            if(child===next) {
              element.appendChild(child);
            }

            // mid-list relocation
            else {
              element.insertBefore(child, next);
            }

            t2.value = frame.body.innerHTML;
          }
          // IFRAME UPDATING
        }

        // this is a security measure, more than anything.
        return -1;
      }

      textAreaContent += "\n";
    }
  }

  // show report, and update textarea if we updated the iframe
  t3.value = (doUpdate? "[diff used in update]\n\n" : '') + textAreaContent;
  if(doUpdate) { t2.value = t1.value; }
};

// quick find/make, and the text areas
var find = function(s) { return document.querySelector(s); },
    make = function(t,c) { var d = document.createElement(t); if(c) d.innerHTML = c; return d; },
    t1 = find("#one"),
    t2 = find("#two"),
    t3 = find("#three"),
    frame = new Frame(find("iframe"));


// set frame content
t2.value = t1.value;
frame.set(make("div",t2.value));


// bind event handling and parse
t1.onkeyup = function() {
  //console.log("(1) parsing...");
  var safetyLimit = 100;
  while (--safetyLimit>0 && parse(frame, true) === -1) {}
  if(safetyLimit===0) {
    if(console && console.log) {
      console.log("parsing safety limit reached. Save this diff as a test case!");
      console.log("left:");
      console.log(t1.value);
      console.log("right:");
      console.log(t2.value);
    } else {
      alert("console.log doesn't exist; parsing safety limit reached. Save this diff as a test case!");
    }
  }
};

parse();