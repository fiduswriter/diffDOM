define(["SubsetMapping"], function(SubsetMapping) {

  /**
   * Rough equality check
   */
  var roughlyEqual = function roughlyEqual(e1, e2, preventRecursion) {
    if (!e1 || !e2) return false;
    if (e1.nodeType !== e2.nodeType) return false;
    if (e1.nodeType === 3) return e1.data === e2.data;
    if (e1.nodeName !== e2.nodeName) return false;
    if (e1.childNodes.length !== e2.childNodes.length) return false;
    var thesame = true;
    for (var i=e1.childNodes.length-1; i >= 0; i--) {
      // note: we only allow one level of recursion
      if (preventRecursion) {
        thesame = thesame && (e1.childNodes[i].nodeName === e2.childNodes[i].nodeName);
      } else {
        thesame = thesame && roughlyEqual(e1.childNodes[i], e2.childNodes[i], true);
      }
    }
    return thesame;
  }

  /**
   * Find a child (based on equality, not identiy) in a list
   */
  var findChild = function findChild(list, child, startPos) {
    // try to find a match at or after the child's true position
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
   * Find all matching subsets, based on immediate child differences only.
   */
  var markSubTrees = function markSubTrees(oldTree, newTree) {
    var oldChildren = oldTree.childNodes,
        newChildren = newTree.childNodes,
        subsets = [], subset, i, j, last,
        startPos = 0, pos, child, c1, c2;

    // check against oldChildren
    var mapped = [];
    for (i = 0, last = oldChildren.length; i < last; i++) {
      child = oldChildren[i];
      pos = findChild(newChildren, child, startPos);
      if (pos !== false && !mapped[pos]) {

        // we can no longer map to this element in subsequent checks
        mapped[pos] = true;

        var mapping = new SubsetMapping(i,pos);

        if (pos < startPos) {
          mapping.outOfOrder = true;
        }

        subset = [mapping];

        // start of match found, try for next siblings.
        for (j = 1; i + j < last; j++) {
          c1 = oldChildren[i+j];
          c2 = newChildren[pos+j];
          // non-recursive equality based on immediate children only
          if (roughlyEqual(c1, c2, true)) {
            subset.push(new SubsetMapping(i+j, pos+j));
          }
          else { break; }
        }
        subsets.push(subset);
        i = i + j - 1;  // compensate for i++
        startPos = pos + j;
      }
    }

    // FIXME: check against tail of newChildren, if new.length>old.length

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

  // export a function, not an object
  return markSubTrees;

});