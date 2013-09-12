/**
 * Perform a difference check between two DOM elements
 *
 * This code is in the public domain.
 */
(function() {


  /**
   * Hate HTML APIs so very much. SO VERY MUCH!
   */
  (function(functions, prototypes) {
    var p;
    prototypes.forEach(function(p) {
      functions.forEach(function(f) {
        p[f] = Array.prototype[f];
      });
    });
  }(["forEach", "indexOf", "slice"], [NodeList.prototype, HTMLCollection.prototype]));


  /**
   * existential function
   */
  function exists(e) {
    return (e !== null && e !== undefined);
  }

  /**
   * Take a snapshot of anything that pretends to be an
   * array but lacks all the normal array functions (like
   * NodeList, HTMLCollection, etc)
   */
  function snapshot(list) {
    return Array.prototype.slice.call(list);
  }

  /**
   * A JavaScript implementation of the Java hashCode() method.
   */
  function hashCode(str) {
    if (str === null || str === undefined) return 0;
    var hashCode = 0, i, last = str.length;
    for (i = 0; i < last; ++i) {
      hashCode = (hashCode * 31 + str.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hashCode;
  }

  /**
   * Form a hash code for elements.
   * Note that this function not only returns the
   * hash code, but also binds it to the element
   * it belongs to, because caching helps the other code.
   *
   * @return a numerical digest hash code
   */
  function hashAll(element) {
    var child,
        last = exists(element.childNodes) ? element.childNodes.length : 0,
        hash = 0,
        hashString = element.nodeName;

    // hash attributes, if they exist
    if(element.attributes) {
      var attr,
          a,
          attributes = element.attributes,
          len = attributes.length;
      for (a=0; a<len; a++) {
        attr = attributes[a];
        hashString += attr.nodeName + ":" + attr.nodeValue;
      }
    }

    // update the hash
    hash = hashCode((hashString + element.textContent).replace(/\s+/g,''));

    // if there are children, work in their hash, too.
    for(child = last-1; child >=0; child--) {
      hash = (hash * 31 + hashAll(element.childNodes[child])) & 0xFFFFFFFF;
    }

    // okay, we're done. Set and return
    element.hashCode = hash;
    return hash;
  }

  /**
   * Do these elements agree on their HTML attributes?
   *
   * @return array of [differing attribute, value in e1, value in e2] triplets
   */
  function outerEquality(e1, e2) {
    var diff = [];

    // do the tags agree?
    if(e1.nodeType===1 && e2.nodeType===1) {
      if(e1.nodeName !== e2.nodeName) {
        diff.push(["nodeName",e1.nodeName,e2.nodeName]);
      }
    }

    // do the attributes agree?
    if(e1.attributes && e2.attributes) {
      var attributes = e1.attributes,
          len = attributes.length,
          a, a1, a2, attr;

      // attribute insertion/modification diff
      for (a=0; a<len; a++) {
        attr = attributes[a].nodeName;
        a1 = e1.getAttribute(attr);
        a2 = e2.getAttribute(attr);
        if(a1==a2) continue;
        diff.push([attr,a1,a2]);
      }

      // attribute removal diff
      attributes = e2.attributes;
      len = attributes.length;
      for (a=0; a<len; a++) {
        attr = attributes[a].nodeName;
        a1 = e1.getAttribute(attr);
        a2 = e2.getAttribute(attr);
        if(a1==a2) continue;
        diff.push([attr,a1,a2]);
      }
    }
    return diff;
  };


  /**
   * Do these elements agree on their content,
   * based on the .childNodes NodeSet?
   *
   * @return a diff tree between the two elements
   */
  var innerEquality = function(e1, e2) {
    hashAll(e1);
    hashAll(e2);
    c1 = snapshot(e1.childNodes);
    c2 = snapshot(e2.childNodes);
    var localdiff = childDiff(c1,c2);
    return (localdiff.length > 0 ?  localdiff : false);
  };


  /**
   * Does a nodeset snapshot of an element's
   * .childNodes contain an element that has
   * <hash> as hashing number?
   *
   * @return -1 if not contained, or the
   *         position in the snapshot if
   *         it is contained.
   */
  function getPositions(list, reference) {
    var hash = reference.hashCode,
        c, last = list.length, child,
        tn, rn
        result = [];
    for(c=0; c<last; c++) {
      child = list[c];
      if(reference.nodeType === 3) {
        if(child.nodeType === 3 && child.data == reference.data) {
          result.push(c);
        }
      } else if(child.hashCode === hash) {
        result.push(c);
      }
    }

    return result;
  }

  /**
   * Get the child-position based path to this element
   */
  function getPath(element, top) {
    var path = [], pos;
    while(element !== top) {
      pos = Array.prototype.indexOf.call(element.parentNode.childNodes, element);
      path = [pos].concat(path);
      element = element.parentNode;
    }
    return path;
  }

  /**
   * Create a diff between .childNode
   * snapshots c1 and c2.
   *
   * @return a local content diff
   */
  function childDiff(c1, c2) {
    c1 = snapshot(c1);
    c2 = snapshot(c2);

    var ops = [];

    // First, find all elements that have
    // either not changed, or were simply
    // moved around rather than changed.
    var c, last=c1.length, child, positions, pos, ioffset = 0;
    for(c=0; c<last; c++) {
      child = c1[c];
      positions = getPositions(c2, child);

      console.log("positions", c, positions);

      // not found in list c2
      if(positions.length===0) {
        ops.push({type: "insert", pos : c, element: child});
        ioffset++;
        continue;
      }

      // found more than once in list c2
      if(positions.length>1) {
        // these ambiguous elements are the worst.
        for(var p=0; p<positions.length; p++) {
          pos = positions[p];
          if(!c2[pos]["marked"]) {
            c2[pos]["marked"] = true;
            break;
          }
        }
        continue;
      }

      // same position (corrected for insertion offset) - don't bother these elements
      pos = positions[0];
      if(c===pos+ioffset) {
        c2[pos]["marked"] = true;
        continue;
      }

      // This element might have been moved. (move to before pos ...)
      ops.push({type: "move", pos: c+1, oldpos: pos+ioffset});
      c2[pos]["marked"] = true;
    }

    // Then we check all removals, based on unmarked c2 elements
    last = c2.length;
    for(c=0; c<last; c++) {
      child = c2[c];
      if(!child["marked"]) {
        ops.push({type: "remove", pos: c});
        ioffset--;
      }
    }

    // return transformation
    return ops;
  }


  /**
   * DOM element comparator.
   *
   * The fact that JavaScript doesn't have this
   * built into the DOM API is lamentable.
   *
   * return -1 if "plain" not equal,
   *         0 if equal,
   *        or a <number>[] representing the
   *        route in this element to a diff.
   *
   * FIXME: as long as the tagname stays the same, outerchange (class, etc) should be a modification, not top diff.
   *
   */
  function equal(e1, e2, after) {

    // first: if this element is a previous route's problem
    // point, we're going to TOTALLY ignore it and pretend it's
    // fine, so that we can find further problems.
    var soffset = (after && after.length!==0 ? after.splice(0,1)[0] : 0);
    if(soffset === -1) {
      return 0;
    }

    // different element (1)?
    if (e1.nodeType !== e2.nodeType) {
      return -1;
    }

    // shortcut handling for text?
    if (e1.nodeType === 3 && e2.nodeType === 3) {
      if(e1.data !== e2.data) {
        return -1;
      }
      return 0;
    }

    // different element (2)?
    if(e1.nodeName !== e2.nodeName) {
      return -1;
    }

    // different content?
    if(e1.childNodes.length !== e2.childNodes.length) {
      return -1;
    }

    // Different child node list?
    // Find where the first difference is
    var i, last = e1.childNodes.length, eq, ret;
    for(i=soffset; i<last; i++) {
      // recurse to see if these children differ
      eq = equal(e1.childNodes[i], e2.childNodes[i], after);
      if(eq !== 0)
      {
        // (first) difference found. "eq" will indicate
        // which childNodes position the diff is found at.
        return [i].concat(eq);
      }
    }

    // different attributes?
    var attrs = ["id",     // ids MUST be identical, nice and simple
                 "style",  // this one's tricky, and I don't want to write a full CSS parser right now. FIXME: later
                 "class",  // this one's less tricky, but still requires split/sort comparison. FIXME: later
                 "type",
                 "value",
                 "href",
                 "src",
                 "rel",
                 "__more__attributes__here__"],
        a, last = attrs.length,
        attr, a1, a2;

    for(a=0; a<last; a++) {
      attr = attrs[a];
      a1 = e1.getAttribute(attr);
      a2 = e2.getAttribute(attr);
      if(a1==a2 || (!a1 && a2=="") || (!a2 && a1=="")) continue;
      return -1;
    }

    // nothing left to fail on - consider these two elements equal.
    return 0;
  }


  /**
   * Generate an annotated diff between two DOM fragments. Particularly
   * useful for live render updating.
   *
   * "after" indicates a route that is already known to fail, causing
   * equal() to check only elements that come after this route.
   */
  function getDiff(e1, e2) {
    var route = equal(e1,e2),
        routes = [route],
        newRoute;

    while(typeof route === "object") {
      newRoute = equal(e1,e2,route.slice());
      routes.push(newRoute);
      route = newRoute;
    }

    // Remove "0" from routes if length > 1, since
    // the last attempt will find no differences, but
    // will do so because it's "deemed safe".
    if(routes.length>1) { routes.splice(routes.indexOf(0), 1); }
    return routes;
  }

  /**
   * find an element in a DOM tree
   */
  function find(element, route) {
    var route = route.slice(),
        pos = route.splice(0,1)[0];
    while(pos!==-1) {
      element = element.childNodes[pos];
      pos = route.splice(0,1)[0];
    }
    return element;
  }

  /**
   * Convert a diff between two elements into an operation set.
   */
  function convertDiff(routes, d1, d2) {
    routes = routes.slice();
    var route,
        iroute,
        d,
        lastRoute = routes.length,
        v,
        operations = [],
        e, e1, e2;

    // If nothing changed, don't bother with the rest
    // of the code. It won't do anything.
    if(lastRoute === 1 && routes[0] === 0) { return; }

    // If we do have change routes, apply them.
    for(d = 0; d < lastRoute; d++) {

      // shortcut for empty operation routes
      if (routes[d] === 0) { continue; }

      // rewrite so we do can resolve the top-level diff
      if (routes[d] === -1) { routes[d] = [-1]; }

      // follow the route to the elements
      route = routes[d].slice();
      iroute = routes[d].slice();

      e = route.splice(0,1)[0];
      e1 = d1;
      e2 = d2;

      while (e !== -1) {
        e1 = e1.childNodes[e];
        e2 = e2.childNodes[e];
        e = route.splice(0,1)[0];
      }

      // text node updates are simple
      if (e1.nodeType === 3 && e2.nodeType === 3) {
        operations.push(function updateText(top, target, replacement) {
          var updateText = function updateText() {
            target.data = replacement;
          };
          updateText.toString = function toString() {
            return JSON.stringify({
              type: "updateText",
              path: getPath(target, top),
              text: replacement
            });
          };
          return updateText;
        }(d2, e2, e1.data));
        continue;
      }

      // childnode differences are more work.
      var complexDiff = innerEquality(e1, e2),
          pos,
          last,
          entry,
          outerDiff = outerEquality(e1,e2);

      // operations based on differences in the outerHTML
      if (outerDiff.length > 0) {
        last = outerDiff.length;
        for (pos = 0; pos < last; pos++) {
          entry = outerDiff[pos];

          // different node name
          if(entry[0] === "nodeName") {
            operations.push(function changeNodeName(top, element, newElement) {
              var changeNodeName = function changeNodeName() {
                // copy children over
                while(element.childNodes.length>0) {
                  newElement.appendChild(element.childNodes[0]);
                }
                // copy element attributes over
                newElement.attributes = element.attributes;
                // and replace!
                element.parentNode.replaceChild(newElement, element);
              };
              changeNodeName.toString = function toString() {
                return JSON.stringify({
                  type: "changeNodeName",
                  path: getPath(element, top),
                  nodename: newElement.nodeName
                });
              };
              return changeNodeName;
            }(d2, find(d2, iroute), document.createElement(entry[1])));
          }

          // attribute differences
          else {
            operations.push(function changeAttributeValue(top, element, attribute, value) {
              var changeAttributeValue = function changeAttributeValue() {
                if(exists(value)) { element.setAttribute(attribute, value); }
                else { element.removeAttribute(attribute); }
              };
              changeAttributeValue.toString = function toString() {
                return JSON.stringify({
                  type: "changeAttributeValue",
                  path: getPath(element, top),
                  attribute: attribute,
                  value: value
                });
              };
              return changeAttributeValue;
            }(d2, find(d2, iroute), entry[0], entry[1]));
          }
        }
      }

      // Shortcut on "no complex diffs found". This
      // basically implies we did find an outer diff.
      if (!complexDiff) {
        continue;
      }

      // first handle inserts and relocations
      var roffset = 0;
      complexDiff.forEach(function(entry) {
        var parent = find(d2, iroute);

        if (entry.type === "insert") {
          operations.push(function insertElement(top, parent, insertion, pos) {
            var reference = parent.childNodes[pos];
            var insertElement = function insertElement() {
              console.log("insertion");
              if(reference) {
                console.log("at>"+pos, parent.childNodes, ": inserting", insertion, "before", reference);
                parent.insertBefore(insertion, reference);
              } else {
                console.log("at>"+pos, parent.childNodes, ": appending", insertion);
                parent.appendChild(insertion);
                console.log(parent.childNodes);
              }
            };
            insertElement.toString = function toString() {
              return JSON.stringify({
                type: "insertElement",
                path: getPath(reference, top),
                nodetype: insertion.nodeType,
                data: (insertion.nodeType === 3 ? insertion.textValue : insertion.outerHTML)
              });
            };
            return insertElement;
          }(d2, parent, entry.element, entry.pos));
        }

        if (entry.type === "move") {
          operations.push(function moveElement(parent, oldpos, pos) {
            var moveElement = function moveElement() {
              console.log("relocation");
              var element = parent.childNodes[oldpos];
              var reference = parent.childNodes[pos];
              console.log(oldpos+">"+pos, parent.childNodes, ": moving", element, "to before", reference);
              parent.insertBefore(element, reference);
            };
            moveElement.toString = function toString() {
              return JSON.stringify({
                type: "moveElement",
                oldpos: oldpos,
                pos: pos
              });
            };
            return moveElement;
          }(parent, entry.oldpos, entry.pos));
        }

        if (entry.type === "remove") {
          operations.push(function removeElement(top, parent, pos) {
            var removeElement = function removeElement() {
              console.log("removal");
              console.log(">"+(pos- roffset), parent.childNodes);
              parent.removeChild(parent.childNodes[pos - roffset]);
              roffset++;
            };
            removeElement.toString = function toString() {
              return JSON.stringify({
                type: "removeElement",
                path: getPath(parent, top),
                pos: pos
              });
            };
            return removeElement;
          }(d2, parent, entry.pos));
        }
      });
    }

    return operations;
  };

  // our diffing object.
  var diffObject = {
    outerEquality: outerEquality,
    innerEquality: innerEquality,
    getDiff: getDiff,
    applyDiff: function(diff, d1, d2) {
      var transforms = convertDiff(diff, d1, d2);
      if(transforms) {
        transforms.forEach(function(fn) {
          fn();
        });
      }
    }
  };

  // Can we register ourselves as an AMD module?
  if (window.define) {
    define(function() {
      return diffObject;
    });
  }

  // We cannot. Bind as a global object, instead.
  else { window.DOMdiff = diffObject; }
}());
