define(["SubsetMapping", "roughlyEqual"], function(SubsetMapping, roughlyEqual) {

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
        subsets = [], subset;

    // check against oldChildren
    var abstractNodeMapping = function abstractNodeMapping(c1, c2, inverted) {
      var mapped = [], i, j, last, pos, startPos=0, child, child1, child2;
      for (i = 0, last = c1.length; i < last; i++) {
        child = c1[i];
        pos = findChild(c2, child, startPos);
        if (pos !== false && !mapped[pos]) {

          // we can no longer map to this element in subsequent checks
          mapped[pos] = true;

          var mapping = (inverted ? new SubsetMapping(pos,i) : new SubsetMapping(i,pos));

          if (pos < startPos) {
            mapping.outOfOrder = true;
          }

          subset = [mapping];

          // start of match found, try for next siblings.
          for (j = 1; i + j < last; j++) {
            child1 = c1[i+j];
            child2 = c2[pos+j];
            // non-recursive equality based on immediate children only
            if (roughlyEqual(child1, child2, true)) {
              subset.push(inverted? new SubsetMapping(pos+j, i+j) : new SubsetMapping(i+j, pos+j));
            }
            else { break; }
          }
          subsets.push(subset);
          i = i + j - 1;  // compensate for i++
          startPos = pos + j;
        }
      }
    };

    abstractNodeMapping(oldChildren, newChildren);
//    abstractNodeMapping(newChildren, oldChildren, true);

//    console.log(JSON.stringify(subsets,true));
//    throw "whoiefwoiefew";

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