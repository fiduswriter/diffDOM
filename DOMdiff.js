/**
 * DOM diff AMD module (Requirejs etc.)
 */
define(["Utils", "markSubTrees", "DiffTracker", "findAttrDiff", "getFirstDiff", "resolveOuterDiff", "resolveDiff", "applyDiff"],
function(utils, markSubTrees, DiffTracker, findAttrDiff, getFirstDiff, resolveOuterDiff, resolveDiff, applyDiff) {

  // safety valve for diffing.
  var debug = true,
      diffCap = 10,
      diffTracker = new DiffTracker();

  /**
   * Determine the diff between two trees, based on gaps
   * between stable subtree mappings.
   */
  var findDiff = function findDiff(t1, t2, route) {
    if(debug && diffTracker.diffInformation.length > diffCap) {
      throw new Error("diff cap reached");
    }

    // if 'route' is undefined, this is a top-level findDiff call,
    // and we should can initialise our route and diff trackers.
    if (!route) {
      route = [];
      diffTracker.reset();
    }

    // step 1: find differences in the tag, rather than the element content
    var outerdiff = findAttrDiff(t1, t2, route, diffTracker);
    t1 = resolveOuterDiff(t1, outerdiff);

    // step 2: find differences in the element content
    var subtreeMappings = markSubTrees(t1, t2),
        diff;


    // If there are no subtree mappings,
    // the content between these two trees
    // is 100% different. We need
    if (subtreeMappings.length === 0) {
      diff = {
        action: "replace innerHTML",
        route: route
      };
      t1 = resolveDiff(diff, t1, t2, false, diffTracker);
    }


    else {
      var firstSubset = subtreeMappings[0],
          isStartSet = firstSubset["old"] === 0  && firstSubset["new"] === 0,
          isFullSubset = firstSubset.length === t1.childNodes.length;

      // If there is only one correspondence mapping, check whether it covers
      // all elements. If it does, there is no difference between the trees here.
      if (subtreeMappings.length === 1 && isStartSet && isFullSubset) {
        for(var i=0, last=t1.childNodes.length; i<last; i++) {
          findDiff(t1.childNodes[i], t2.childNodes[i], utils.grow(route, i));
        }
        return;
      }

      // If there are one or more correspondence mappings, then there are differences
      // that need to be resolved. Find the ordering and gaps in the correspondence,
      // and use that information to find the first difference; resolve that, and then
      // perform another finddiff iteration
      var gapInformation = utils.getGapInformation(t1, t2, subtreeMappings);
      diff = getFirstDiff(t1, t2, gapInformation);

      if(diff === false) {
        throw new Error("more than 1 mapped subtree ("+subtreeMappings.length+") found, but no diff could be found...");
      }

      diff.route = route.concat(diff.route);
      t1 = resolveDiff(diff, t1, t2, subtreeMappings, diffTracker);
    }

    findDiff(t1, t2, route);
  }

  // DOMdiff return object - this defines the public API for our users
  return {
    findDiff: findDiff,
    applyDiff: applyDiff,
    // The following object represents
    // the diff as found during the
    // last-called findDiff() call:
    diffTracker: diffTracker
  };

});
