define(function() {

  /**
   * resolve a diff between t1 and t2 to t1,
   * recording which operation is required to bring
   * t1 one step closer to being t2, and generating
   * the "one step closer" node as a result.
   */
  var resolveDiff = function(diff, t1, t2, groups, tracker) {
    var applied = t1.cloneNode(true),
        route = diff.route;

    /**
     * To go from t1 to t2, we first need to remove a node
     */
    if(diff.action === "remove") {
      var child = applied.childNodes[diff.nodeNumber];
      applied.removeChild(child);
      tracker.track({
        action: "removal",
        routes: utils.grow(route, diff.nodeNumber)
      });
    }

    /**
     * To go from t1 to t2, we first need to insert a node
     */
    else if(diff.action === "insert") {
      var next = diff.nodeNumber+1,
          newNode = t2.childNodes[diff.nodeNumber].cloneNode(true);
      if (next > applied.childNodes.length) {
        tracker.track({
          action: "append",
          routes: utils.grow(route),
          element: utils.toHTML(newNode)
        });
        applied.appendChild(newNode);
      } else {
        var reference = applied.childNodes[diff.nodeNumber];
        tracker.track({
          action: "insert",
          routes: utils.grow(route, diff.nodeNumber),
          element: utils.toHTML(newNode)
        });
        applied.insertBefore(newNode, reference);
      }
    }

    /**
     * To go from t1 to t2, we first need to modify a node
     */
    else if(diff.action === "modified") {
      var oldNode = applied.childNodes[diff.nodeNumber],
          newNode = t2.childNodes[diff.nodeNumber];

      if (oldNode.nodeType === 3 & newNode.nodeType === 3) {
        tracker.track({
          action: "text modified",
          routes: utils.grow(route, diff.nodeNumber),
          oldData: oldNode.data,
          newData: newNode.data
        });

        oldNode.data = newNode.data;
      }

      else {
        console.log(oldNode);
        console.log(newNode);
        // FIXME: implement this.
        throw new Error("modified is unhandled between non-text nodes at the moment");
      }
     }

    /**
     * To go from t1 to t2, we first need to move a group of nodes
     */
    else if(diff.action === "move") {
      var group = groups[diff.group],
          from = group["old"],
          to = group["new"],
          child, reference;

      // slide elements down
      if(from > to ) {
        for(var i=0; i<group.length; i++) {
          //console.log(from, to, i);
          child = applied.childNodes[from + i];
          reference = applied.childNodes[to + i];

          tracker.track({
            action: "insert",
            routes: utils.grow(route, diff.nodeNumber),
            element: utils.toHTML(child)
          });

          applied.insertBefore(child, reference);
        }
      }

      // slide elements up
      else {
        for(var i=group.length-1; i>=0; i--) {
          //console.log(from, to, i);
          child = applied.childNodes[from + i];
          reference = applied.childNodes[to + 1 + i];

          tracker.track({
            action: "insert",
            routes: utils.grow(route, diff.nodeNumber),
            element: utils.toHTML(child)
          });

          applied.insertBefore(child, reference);
        }
      }
    }

    // the "applied" tree is now t1, one step closer to being t2.
    return applied;
  }

  return resolveDiff;
});