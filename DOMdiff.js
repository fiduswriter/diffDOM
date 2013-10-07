/**
 * DOM diff AMD module (Requirejs etc.)
 */
define(["Utils", "markSubTrees", "DiffTracker", "findAttrDiff", "getFirstDiff", "resolveDiff"],
function(utils, markSubTrees, DiffTracker, findAttrDiff, getFirstDiff, resolveDiff) {

  // safety valve for diffing.
  var debug = true,
      diffCount = 0,
      diffCap = 1000,
      diffTracker = new DiffTracker();

  /**
   * Determine the diff between two trees, based on gaps
   * between stable subtree mappings.
   */
  var findDiff = function findDiff(t1, t2, route) {

    if(debug && diffCount++ > diffCap) {
      throw new Error("diff cap reached");
    }

    // if 'route' is undefined, this is a top-level findDiff call,
    // and we should can initialise our route and diff trackers.
    if (!route) {
      route = [];
      diffTracker.reset();
    }

    // find the stable subset
    var stable = markSubTrees(t1, t2);

    if (stable.length === 0) {
      if(t1.childNodes.length > 0 || t2.childNodes.length > 0) {
//        console.log("something happened here, between " + t1.nodeName + " and " + t2.nodeName);
//        console.log(t1);
//        console.log(t2);
        var diff = { action: "modified", nodeNumber: "unknown", route: route, unknown: true };
        resolveDiff(diff, t1, t2, stable, diffTracker);
        // presumably, this is a leaf node, but honestly i have no idea.
      }
      return;
    }

    var subset = stable[0],
        outerdiff = findAttrDiff(t1, t2, route, diffTracker);

    // special case: no direct child differences: check each child for differences.
    if (stable.length === 1 && subset["old"] === 0  && subset["new"] === 0 &&  subset.length === t1.childNodes.length) {
      for(var i=0, last=t1.childNodes.length; i<last; i++) {
        //console.log("checking " + (route.length>0 ? route.join(",") + "," : '') + i);
        findDiff(t1.childNodes[i], t2.childNodes[i], utils.grow(route, i));
      }
      return;
    }

    // ...
    var gapInformation = utils.getGapInformation(t1, t2, stable),
        diff = getFirstDiff(t1, t2, gapInformation);

    // ...
    if(diff === false) {
      throw new Error("more than 1 mapped subtree ("+stable.length+"), but no diff could be found...");
    }

    // determine what must be done to resolve this diff, adding that
    // information to the diff tracker, and then moving on to the next
    // difference between t1 and t2.
    diff.route = route;
    var t1prime = resolveDiff(diff, t1, t2, stable, diffTracker);
    findDiff(t1prime, t2, route);
  }

  // object retun
  return { findDiff: findDiff, diffTracker: diffTracker };
});
