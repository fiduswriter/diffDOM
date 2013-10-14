define(["markSubTrees", "getFirstDiff", "Utils"], function(markSubTrees, getFirstDiff, utils) {

  /**
   * resolve a diff between t1 and t2 to t1,
   * recording which operation is required to bring
   * t1 one step closer to being t2, and generating
   * the "one step closer" node as a result.
   */
  var resolveDiff = function(diff, t1, t2, groups, tracker) {
    tracker = tracker || { track: function(){}, last: false };

    var applied = t1.cloneNode(true),
        route = diff.route,
        base = (typeof diff.baseNodeNumber === "number") ? applied.childNodes[diff.baseNodeNumber] : applied;
        refbase = (typeof diff.baseNodeNumber === "number") ? t2.childNodes[diff.baseNodeNumber] : t2;

    /**
     * To go from t1 to t2, we first need to do a text replacement
     */
    if(diff.action === "replace") {
      var pos = diff.route[diff.route.length-1];
      node = base.childNodes[pos];
      node.data = diff.newValue;
      console.log(node);
      tracker.track({
        action: "text modification",
        route: utils.grow(route, pos),
        oldData: diff.oldValue,
        newData: diff.newValue
      });
    }

    else if (diff.action === "node to text") {
      tracker.track({
        action: "node to text",
        route: route,
        oldData: diff.oldValue,
        newData: diff.newValue
      });
      base.innerHTML = diff.newValue;
    }

    else if (diff.action === "text to node") {
      tracker.track({
        action: "text to node",
        route: route,
        oldData: diff.oldValue,
        newData: diff.newValue
      });
      base.innerHTML = diff.newValue;
    }

    /**
     * To go from t1 to t2, we first need to remove a node
     */
    else if(diff.action === "remove") {
      var child = base.childNodes[diff.nodeNumber];
      base.removeChild(child);
      tracker.track({
        action: "remove element",
        route: utils.grow(route, (diff.baseNodeNumber ? [diff.baseNodeNumber, diff.nodeNumber] : diff.nodeNumber))
      });
    }

    /**
     * To go from t1 to t2, we first need to insert a node
     */
    else if(diff.action === "insert") {
      var next = diff.nodeNumber+1,
          newNode = refbase.childNodes[diff.nodeNumber].cloneNode(true);

      if (next >= base.childNodes.length) {
        tracker.track({
          action: "append element",
          route: utils.grow(route, (diff.baseNodeNumber ? [diff.baseNodeNumber, diff.nodeNumber] : diff.nodeNumber)),
          element: utils.toHTML(newNode)
        });
        base.appendChild(newNode);
      }

      else {
        var reference = base.childNodes[diff.nodeNumber];
        var diff = {
          action: "insert element",
          route: utils.grow(route, (diff.baseNodeNumber ? [diff.baseNodeNumber, diff.nodeNumber] : diff.nodeNumber)),
          element: utils.toHTML(newNode)
        };
        tracker.track(diff);
        console.log(diff);
        base.insertBefore(newNode, reference);
      }
    }

    /**
     * To go from t1 to t2, we first need to modify a node
     */
    else if(diff.action === "modified") {
      var oldNode = base.childNodes[diff.nodeNumber],
          newNode = refbase.childNodes[diff.nodeNumber];

      /**
       * This first clause is genuinely odd, and really shouldn't exist.
       */
      if(diff.unknown) {
        // unknown diff between two nodes.
        tracker.track({
          action: "inner modification",
          oldData: base.innerHTML,
          newData: refbase.innerHTML,
          nodeNumber: route.slice(), //diff.nodeNumber,
          route: diff.route
        })
      }

      else if (oldNode.nodeType === 3 & newNode.nodeType === 3) {
        tracker.track({
          action: "text modification",
          route: utils.grow(route, diff.nodeNumber),
          oldData: oldNode.data,
          newData: newNode.data
        });

        oldNode.data = newNode.data;
      }

      else {
        console.log(oldNode);
        console.log(newNode);

        tracker.track({
          action: "unknown modification",
          oldNode: oldNode,
          newNode: newNode,
          route: utils.grow(route, diff.nodeNumber)
        });

        // FIXME: implement the resolution rules here.

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

      tracker.track({
        action: "move elements",
        route: route,
        from: from,
        to: to,
        length: group.length
      });

      // slide elements down
      if(from > to ) {
        for(var i=0; i<group.length; i++) {
          child = applied.childNodes[from + i];
          reference = applied.childNodes[to + i];
          applied.insertBefore(child, reference);
        }
      }

      // slide elements up
      else {
        for(var i=group.length-1; i>=0; i--) {
          child = applied.childNodes[from + i];
          reference = applied.childNodes[to + 1 + i];
          applied.insertBefore(child, reference);
        }
      }
    }

    // the "applied" tree is now t1, one step closer to being t2.
    return applied;
  }

  return resolveDiff;
});