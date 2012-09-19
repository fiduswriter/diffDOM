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

  var routes = getDiff(d1,d2), route, iroute,
      d, lastRoute = routes.length, v,
      textAreaContent="";
  for(d = 0; d < lastRoute; d++) {

    // shortcuts
    if (routes[d] === 0) { textAreaContent += "no difference\n\n"; }
    else if (routes[d] === -1) { textAreaContent += "top level difference\n\n"; }

    // real work
    else {
      // follow the route to the elements
      route = arrayCopy(routes[d]),
      iroute = arrayCopy(routes[d]);
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
          for(pos=last-1; pos>=0; pos--) {
          //for(pos=0; pos<last; pos++) {
            entry = complexDiff.removals[pos];
            textAreaContent += "    right["+entry[0]+"] ("+serialise(entry[1])+")\n";

            // IFRAME UPDATING
            if(doUpdate) {
              /**
                A problem is that by applying complex diffs,
                we are changing subsequent routes. For now,
                as a hack, we're going to apply one diff,
                and then immediately return "-1", so that
                a new diff is computed between the desired
                result, and the intermediate update

                FIXME: The real solution to this is to track
                nodeset changes while applying the diff. This
                should happen in the Frame object, in the
                update(diff) function.
              **/
              var element = frame.find(iroute).childNodes[entry[0]];
              element.parentNode.removeChild(element);
              t2.value = frame.body.innerHTML;
              return -1;
            }
            // IFRAME UPDATING
          }
        }

        // check for node insertions
        last = complexDiff.insertions.length;
        if(last>0) {
          textAreaContent += "  insertions: \n";
          for(pos=0; pos<last; pos++) {
            entry = complexDiff.insertions[pos];
            textAreaContent += "    left["+entry[0]+"] ("+serialise(entry[1])+")\n";

            // IFRAME UPDATING
            if(doUpdate) {
              /**
                A problem is that by applying complex diffs,
                we are changing subsequent routes. For now,
                as a hack, we're going to apply one diff,
                and then immediately return "-1", so that
                a new diff is computed between the desired
                result, and the intermediate update

                FIXME: The real solution to this is to track
                nodeset changes while applying the diff. This
                should happen in the Frame object, in the
                update(diff) function.
              **/
              var element = frame.find(iroute);
              element.insertBefore(entry[1], element.childNodes[entry[0]]);
              t2.value = frame.body.innerHTML;
              return -1;
            }
            // IFRAME UPDATING
          }
        }

        // check for node rearrangements
        last=complexDiff.positions.length;
        if(last>0) {
          textAreaContent += "  repositioning: \n";
          var s1, s2;
          for(pos=0; pos<last; pos++) {
            entry = complexDiff.positions[pos];
            textAreaContent += "    right["+entry[1]+"]->left["+entry[0]+"] ("+serialise(e1.childNodes[entry[0]])+")\n";

            // IFRAME UPDATING
            if(doUpdate) {
              // ... code comes later ...
            }
            // IFRAME UPDATING
          }
        }

        textAreaContent += "\n";
      }
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
  log("(1) parsing...");
  while (
    parse(frame, true) 
   === -1) {}
};

parse();