define(["markSubTrees", "Utils"], function(markSubTrees, utils) {

  /**
   * Find the first gap difference between the two trees,
   * and tell us what needs to happen to resolve it.
   */
  var getFirstDiff = function(t1, t2, gapInformation, route) {

console.log(t1, t2);

    route = route || [];

    // text nodes are a shortcut.
    if(t1.nodeType === 3 && t2.nodeType === 3) {
      if(t1.data !== t2.data) {
        return { action: "replace text", oldValue: t1.data, newValue: t2.data, route: [0] };
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
      console.log("subtree mapping:");
      console.log("1: " + gaps1.join(","));
      console.log("2: " + gaps2.join(","));
      console.log("group sequences:");
      console.log("1: " + fgaps1.join(","));
      console.log("2: " + fgaps2.join(","));
    */

    var shortest = fgl1<fgl2 ? fgaps1 : fgaps2;
    // if the same, there will be no difference
    for(i=0, last = shortest.length; i<last; i++) {
      if(fgaps1[i] != fgaps2[i]) {
        var group = fgaps1[i];
        // console.log("node group " + group + " moved");
        return { action: "move group", route: route, group: group };
      }
    }

    // console.log("groups are aligned");

    // if the groups are all in-sequence, do any insert/modify/removal checks
    var  group1, group2, c1 ,c2;
    // console.log(last);
    for(i=0, last=gl1 < gl2 ? gl1 : gl2; i<last; i++) {
      group1 = gaps1[i];
      group2 = gaps2[i];

      // console.log("gap information at "+i+":", group1, group2)

      // any gaps between t1 and t2?
      if (group1 === true) {
        if (group2 === true) {


          c1 = t1.childNodes[i];
          c2 = t2.childNodes[i];
          // console.log("node difference at " + i + " between ", c1, " and" , c2, "route: ", route);

          if(c1.nodeType === 3 && c2.nodeType === 3) {
            return { action: "replace text", oldValue: c1.data, newValue: c2.data, route: [0] };
          }

          if(c1.nodeType === 3 && c2.nodeType !== 3) {
            return { action: "text to node", oldValue: c1.data, newValue: utils.toHTML(c2), route: route };
          }

          if(c1.nodeType !== 3 && c2.nodeType === 3) {
            return { action: "node to text", oldValue: utils.toHTML(c1), newValue: c2.data, route: route };
          }

          // difference somewhere inside this node.
          var subtreeMappings = markSubTrees(c1, c2);
          var gapInformation = utils.getGapInformation(c1, c2, subtreeMappings);
          var diff = getFirstDiff(c1, c2, gapInformation, route);
          diff.route = [i].concat(diff.route);
          // console.log(c1, c2, diff, diff.route.join(","));
          return diff;

        } else {
          console.log("node removed at " + i);
          return { action: "remove", nodeNumber: i, route: [i] };
        }
      }
      else if (group2 === true) {
        console.log("node inserted at " + i);
        return { action: "insert", nodeNumber: i, route: [i] };
      }
    }

    // if we get here, there's no difference between t1 and t2
    return false;
  }

  return getFirstDiff;
});
