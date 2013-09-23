/**
 * Simple mapping object - wrapped in a closure
 */
var SubsetMapping = (function() {

  var SubsetMapping = function SubsetMapping(a, b) {
    this["old"] = a;
    this["new"] = b;
  };

  SubsetMapping.prototype = {
    contains: function contains(subset) {
      if(subset.length < this.length) {
        return subset["new"] >= this["new"] && subset["new"] < this["new"] + this.length;
      }
      return false;
    },
    toString: function toString() {
      return this.length + " element subset, first mapping: old " + this["old"] + " → new " + this["new"];
    }
  };

  return SubsetMapping;
}());

/**
 * Rough equality check
 */
var roughlyEqual = function roughlyEqual(e1, e2) {
  if (!e1 || !e2) return false;
  if (e1.nodeType !== e2.nodeType) return false;
  if (e1.nodeType === 3) return e1.data === e2.data;
  if (e1.nodeName !== e2.nodeName) return false;
  if (e1.childNodes.length !== e2.childNodes.length) return false;
  var thesame = true;
  for (var i=e1.childNodes.length-1; i >= 0; i--) {
    thesame = thesame && roughlyEqual(e1.childNodes[i], e2.childNodes[i]);
  }
  return thesame;
}

/**
 * Find a child (based on equality, not identiy) in a list
 */
var findChild = function findChild(list, child, startPos) {
  for(var i=startPos, last=list.length; i<last; i++) {
    if(roughlyEqual(list[i], child)) return i;
  }

  // could not find after startPos. can we find it out-of-order?
  for(var i=0; i<startPos; i++) {
    if(roughlyEqual(list[i], child)) return i;
  }

  // element not found.
  return false;
}

/**
 * Find all matching subsets
 */
var markSubTrees = function markSubTrees(oldTree, newTree) {
  var oldChildren = oldTree.childNodes,
      newChildren = newTree.childNodes,
      positionForOldInNew = [],
      subsets = [], subset, i, j, last,
      startPos = 0, pos, pos2, child,
      outOfOrder = false;

  for (i = 0, last = oldChildren.length; i < last; i++) {
    child = oldChildren[i];
    pos = findChild(newChildren, child, startPos);
    if (pos !== false) {
      if (pos < startPos) {
        outOfOrder = true;
      }
      subset = [new SubsetMapping(i,pos)];
      // start of match found, try for siblings.
      for (j = 1; i + j < last; j++) {
        if (roughlyEqual(oldChildren[i+j], newChildren[pos+j])) {
          subset.push(new SubsetMapping(i+j, pos+j));
        }
        else { break; }
      }
      subsets.push(subset);
      i = i + j - 1;  // compensate for i++
      startPos = pos + j;
    }
    else { positionForOldInNew[i] = pos; }
  }

  // map to proper set ranges
  var mappings = subsets.map(function(list) {
    var subset = list[0];
    subset.length = list.length;
    return subset;
  });

  // resolve out-of-order mappings
  for (i = 0, last = mappings.length; i < last; i++) {
    subset = mappings[i];
    for (j = 0; j < last; j++) {
      if (j === i) continue;
      if (mappings[j] && mappings[j].contains(subset)) {
        mappings[i] = false;
      }
    }
  }

  // and we're done
  return mappings.filter(function(e) { return e !== false; });
};

/**
 * grow an array by one element, returning a new array
 * representing the union of the array and element. It's
 * really just .push, but as a new array.
 */
var grow = function grow(array, element) {
  array = array.slice();
  array.push(element);
  return array;
};

/**
 * Attribute map difference
 */
var findAttrDiff = function findAttrDiff(t1, t2, route) {
  if (t1.nodeType===3) return;
  var slice = Array.prototype.slice,
      byName = function(a,b) { return a.name > b.name; },
      attr1 = slice.call(t1.attributes).sort(byName),
      attr2 = slice.call(t2.attributes).sort(byName),
      find = function(attr, list) {
        for(var i=0, last=list.length; i<last; i++) {
          if(list[i].name === attr.name)
            return i;
        }
        return -1;
      };

  attr1.forEach(function(attr) {
    var pos = find(attr, attr2);
    if(pos === -1) {
      console.log("attribute removed", attr.name, route);
      return;
    }
    var a2 = attr2.splice(pos,1)[0];
    if(attr.nodeValue !== a2.nodeValue) {
      console.log("attribute changed", attr.nodeValue, a2.nodeValue, route);
    }
  });
  attr2.forEach(function(attr) {
    console.log("attribute added", attr.name, attr.nodeValue, route);
  });
}

/**
 * Determine the diff between two trees, based on gaps
 * between stable subtree mappings.
 */
var findDiff = function findDiff(t1, t2, route) {
  route = route || [];

  // find the stable subset
  var stable = markSubTrees(t1, t2);

  // find outer attribute differences
  findAttrDiff(t1, t2, route);

  if (stable.length === 1) {
    var subset = stable[0];
    if(subset["old"] === 0  && subset["new"] === 0 &&  subset.length === t1.childNodes.length) {
      // there are no child differences at this depth, so check further downstream.
      for(var i=0, last=t1.childNodes.length; i<last; i++) {
        findDiff(t1.childNodes[i], t2.childNodes[i], grow(route, i));
      }
      return;
    }
  }

  var gap1 = (function() { // [true,true,...] with length t1.childNodes.length
        var arr = [];
        for (var i=0, last=t1.childNodes.length; i<last; i++) {
          arr[i] = true;
        }
        return arr;
      }()),
      gap2 = (function() { // [true,true,...] with length t2.childNodes.length
        var arr = [];
        for (var i=0, last=t2.childNodes.length; i<last; i++) {
          arr[i] = true;
        }
        return arr;
      }()),
      group = 1;

  // give elements from the same subset the same group number
  stable.forEach(function(subset) {
    var i, end;
    for(i = subset["old"], end = i + subset.length; i < end; i++) {
      gap1[i] = group;
    }
    for(i = subset["new"], end = i + subset.length; i < end; i++) {
      gap2[i] = group;
    }
    group++;
  });

// FIXME: the following only works for single-edit diffs, rather than changes-in-multiple-places
//        diffs! The actual resolution should be based on "find out how to resolve the first gap,
//        after resolving it, what does markSubTree say?" so that we basically diff and patch our
//        way through the entire tree. The aggregate patch at the end of this process is -conviently!-
//        also the patch as it should be applied to the "old" DOM element to turn it into the "new"
//        DOM element.

  // insert resolution
  if(t1.childNodes.length < t2.childNodes.length) {
    for (var i=0, last=t2.childNodes.length; i<last; i++) {
      if (gap2[i] === true) {
        console.log("insertion", grow(route, i), t2.childNodes[i]);
      }
    }
  }

  // remove resolution
  else if(t1.childNodes.length > t2.childNodes.length) {
    for (var i=0, last=t1.childNodes.length; i<last; i++) {
      if (gap1[i] === true) {
        console.log("removal", grow(route, i));
      }
    }
  }

  // modification/replacement resolution
  else {
    var e1, e2;
    for (var i=0, last=t2.childNodes.length; i<last; i++) {
      if (gap1[i] === true && gap2[i] === true) {
        e1 = t1.childNodes[i];
        e2 = t2.childNodes[i];

        // modified?
        if (e1.nodeType === e2.nodeType) {
          if (e1.nodeType === 3) {
            // difference in text values
            console.log("modified text node", e1.data, ">", e2.data, grow(route, i));
          } else {
            if (e1.nodeName == e2.nodeName) {
              // modification involves a change somewhere downstream
              //console.log("modified <"+e1.nodeName+"> node", grow(route, i));
              findDiff(e1, e2, grow(route, i));
            } else {
              // element node was replacemd by another element node
              console.log("replaced element node", e1, e2, grow(route, i));
            }
          }
        } else {
          // element or text node was replaced by text or element node, respectively
          console.log("replaced node", e1, e2, grow(route, i));
        }
      }
    }
  }
}
