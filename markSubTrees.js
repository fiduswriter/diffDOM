define(["SubsetMapping", "roughlyEqual", "Utils"], function(SubsetMapping, roughlyEqual, utils) {

  /**
   * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
   */
  var findCommonSubsets = function(c1, c2, marked1, marked2) {
    var lcsSize = 0,
        index = [],
        len1 = c1.length,
        len2 = c2.length;

    // set up the matching table
    var matches = [], a, i, j;
    for (a = 0; a < len1+1; a++) { matches[a] = []; }

    // fill the matches with distance values
    for (i = 0; i < len1; i++) {
      for (j = 0; j < len2; j++) {
        if (!marked1[i] && !marked2[j] && roughlyEqual(c1[i], c2[j])) {
          matches[i+1][j+1] = (matches[i][j] ? matches[i][j] + 1 : 1);
          if (matches[i+1][j+1] > lcsSize) {
            lcsSize = matches[i+1][j+1];
            index = [i+1, j+1];
          }
        } else { matches[i+1][j+1] = 0; }
      }
    }

    if(lcsSize === 0) {
      return false;
    }

    var origin = [index[0] - lcsSize, index[1] - lcsSize];
    var ret = new SubsetMapping(origin[0], origin[1]);
    ret.length = lcsSize;
    return ret;
  };


  /**
   * Find all matching subsets, based on immediate child differences only.
   */
  var markSubTrees = function markSubTrees(oldTree, newTree) {
    oldTree = oldTree.cloneNode(true);
    newTree = newTree.cloneNode(true);

    // note: the child lists are views, and so update as we update old/newTree
    var oldChildren = oldTree.childNodes,
        newChildren = newTree.childNodes,
        marked1 = utils.makeArray(oldChildren.length, false),
        marked2 = utils.makeArray(newChildren.length, false),
        subsets = [], subset = true, i;

    while (subset) {
      subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
      if(subset) {
        subsets.push(subset);
        for(i=0; i<subset.length; i++) { marked1[subset.old+i] = true; }
        for(i=0; i<subset.length; i++) { marked2[subset.new+i] = true; }
      }
    }

    return subsets;
  };

  // export a function, not an object
  return markSubTrees;

});