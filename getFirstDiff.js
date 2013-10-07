define(["markSubTrees", "Utils"], function(markSubTrees, utils) {

  /**
   * Find the first gap difference between the two trees,
   * and tell us what needs to happen to resolve it.
   */
  var getFirstDiff = function(t1, t2, gapInformation) {
    // text nodes are a shortcut.
    if(t1.nodeType === 3 && t2.nodeType === 3) {
      if(t1.data !== t2.data) {
        return { action: "replace", content: t2.data };
      }
      return false;
    }

    // nodes trees need more work.
    var gaps1 = gapInformation.gaps1,
        gl1 = gaps1.length,
        gaps2 = gapInformation.gaps2,
        gl2 = gaps1.length,
        i,
        last = gl1 < gl2 ? gl1 : gl2;

    // Check for correct submap sequencing (irrespective of gaps) first:
    var sequence = 0,
        group,
        filter = function(e) { return e!==true;},
        // filter out the gaps, they don't matter for sequence correction
        fgaps1 = gaps1.filter(filter),
        fgl1 = fgaps1.length,
        fgaps2 = gaps2.filter(filter),
        fgl2 = fgaps2.length;

/*
    console.log("subtree mapping");
    console.log("1: " + gaps1.join(","));
    console.log("2: " + gaps2.join(","));
    console.log("group sequences");
    console.log("1: " + fgaps1.join(","));
    console.log("2: " + fgaps2.join(","));
*/

    for(var i=0; i<fgl2; i++) {
      group = fgaps2[i];
      if (group !== sequence) {
        // out of sequence jump: this group needs to be moved down in t1 to match t2
        if (group !== sequence + 1) {
          console.log("node group "+group+" moved");
          return { action: "move", group: group };
        }
        // in sequence: keep checking
        else { sequence = group; }
      }
    }

    //console.log("groups are aligned");

    // if the groups are all in-sequence, do any insert/modify/removal checks
    var  group1, group2, c1 ,c2;
    for(var i=0; i<last; i++) {
      group1 = gaps1[i];
      group2 = gaps2[i];

      // any gaps between t1 and t2?
      if (group1 === true) {
        if (group2 === true) {
          c1 = t1.childNodes[i];
          c2 = t2.childNodes[i];
          // console.log("node difference at " + i + " between ", c1, " and" , c2);
          var stable = markSubTrees(c1, c2);
          var gapInformation = utils.getGapInformation(c1, c2, stable);
          var diff = getFirstDiff(c1, c2, gapInformation);

          // if we do not indicate the base nodeNumber, the
          // 'nodeNumber' property is actually for the wrong
          // depth level
          diff.baseNodeNumber = i;

          return diff;
        } else {
          console.log("node removed at " + i);
          return { action: "remove", nodeNumber: i };
        }
      }
      else if (group2 === true) {
        console.log("node inserted at " + i);
        return { action: "insert", nodeNumber: i };
      }
    }

    // if we get here, there's no difference between t1 and t2
    return false;
  }

  return getFirstDiff;
});
