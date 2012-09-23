(function(){

  // local global vars
  var find, make, t1,t2,t3, frame;

  /**
   * What to do when someone types in either of the source code textareas
   */
  var parse = function(frame, doUpdate) {
    // validate using slowparse
    var ret = Slowparse.HTML(document, t1.value);
    if(ret.error) {
      t1.style.background = "rgba(255,0,0,0.1)";
      return false;
    } else { t1.style.background = "white"; }

    // form DOM trees
    var d1 = make("div", t1.value),
        d2 = make("div", t2.value);

    var routes = DOMdiff.getDiff(d1,d2), route, iroute,
        d, lastRoute = routes.length, v,
        textAreaContent="";

    // If nothing changed, don't bother with the rest
    // of the code. It won't do anything =)
    if(lastRoute===1 && routes[0]===0) { return false; }

    // If we do have change routes, apply them.
    for(d = 0; d < lastRoute; d++)
    {
      // shortcut
      if (routes[d] === 0) { continue; }

      // rewrite so we do can resolve the top-level diff
      if (routes[d] === -1) { routes[d] = [-1]; }

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
            
            if(entry[0]==="nodeName") {
              textAreaContent += "    tag name difference. left: '"+entry[1]+"', right: '"+entry[2]+"'\n";

              // IFRAME UPDATING
              if(doUpdate) {
                var element = frame.find(iroute),
                    newElement = document.createElement(entry[1]);
                // copy children over
                while(element.childNodes.length>0) {
                  newElement.appendChild(element.childNodes[0]);
                }
                // copy element attributes over
                newElement.attributes = element.attributes;
                // and replace!
                element.parentNode.replaceChild(newElement, element);
              }
              // IFRAME UPDATING
            }
            
            else {
              textAreaContent += "    attribute: '"+entry[0]+"', left: '"+entry[1]+"', right: '"+entry[2]+"'\n";

              // IFRAME UPDATING
              if(doUpdate) {
                var element = frame.find(iroute);
                if(entry[1]==null) { element.removeAttribute(entry[0]); }
                else { element.setAttribute(entry[0], entry[1]); }
              }
              // IFRAME UPDATING
            }
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
        }

        textAreaContent += "\n";
      }
    }

    // show report, and update textarea if we updated the iframe
    t3.value = (doUpdate? "[diff used in update]\n\n" : '') + textAreaContent;
    if(doUpdate) { t2.value = t1.value; }
    return true;
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
    frame.set(make("div",t2.value));

    // bind event handling and parse
    t1.onkeyup = function() { parse(frame, true) };
    parse(frame, true);
  }

  // kickstart on DOM ready
  document.addEventListener("DOMContentLoaded", init, false);

}());