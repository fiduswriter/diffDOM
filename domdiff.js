/**
 * This should really be a predefined function in Array...
 */
var makeArray = function(n, v) {
  var set = function() { return v; };
  return (new Array(n)).join('.').split('.').map(set);
};

/**
 * HTML serialization
 */
var toHTML = function(element) {
  var div = document.createElement("div");
  div.appendChild(element.cloneNode(true));
  return div.innerHTML;
}

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


// The diff information container
var diffResult = [];

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

  // Check all differences based on the attributes in t1.
  attr1.forEach(function(attr) {
    var pos = find(attr, attr2);
    if(pos === -1) {
      console.log("attribute removed", attr.name, route);
      diffResult.push({
        action: "removed attribute",
        route: route,
        name: attr.name
      });
      return;
    }
    // attribute found both: get the attribute (removing it from the
    // 'to process from t2' list), and compare the values between the two.
    var a2 = attr2.splice(pos,1)[0];
    if(attr.nodeValue !== a2.nodeValue) {
      console.log("attribute changed", attr.nodeValue, a2.nodeValue, route);
      diffResult.push({
        action: "modified attribute",
        route: route,
        attribute: {
          name: attr.name,
          oldValue: attr.nodeValue,
          newValue: a2.nodeValue
        }
      });
    }
  });

  // Anything left in attr2 was not in attr1, and is a new attribute
  attr2.forEach(function(attr) {
    console.log("attribute added", attr.name, attr.nodeValue, route);
    diffResult.push({
      action: "added attribute",
      route: route,
      attribute: {
        name: attr.name,
        value: attr.nodeValue
      }
    });
  });
}

/**
 * Generate arrays that indicate which node belongs to which subset,
 * or whether it's actually an orphan node, existing in only one
 * of the two trees, rather than somewhere in both.
 */
var getGapInformation = function(t1, t2, stable) {
  // [true, true, ...] arrays
  var set = function(v) { return function() { return v; }},
      gaps1 = makeArray(t1.childNodes.length, true),
      gaps2 = makeArray(t2.childNodes.length, true),
      group = 0;

  // give elements from the same subset the same group number
  stable.forEach(function(subset) {
    var i, end;
    for(i = subset["old"], end = i + subset.length; i < end; i++) {
      gaps1[i] = group;
    }
    for(i = subset["new"], end = i + subset.length; i < end; i++) {
      gaps2[i] = group;
    }
    group++;
  });

  return { gaps1: gaps1, gaps2: gaps2 };
};

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

  console.log("subtree mapping");
  console.log("1: " + gaps1.join(","));
  console.log("2: " + gaps2.join(","));
  console.log("group sequences");
  console.log("1: " + fgaps1.join(","));
  console.log("2: " + fgaps2.join(","));

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

  console.log("groups are aligned");

  // if the groups are all in-sequence, do any insert/modify/removal checks
  var  group1, group2, c1 ,c2;
  for(var i=0; i<last; i++) {
    group1 = gaps1[i];
    group2 = gaps2[i];

    // any gaps between t1 and t2?
    if (group1 === true) {
      if (group2 === true) {

        // FIXME: shouldn't we already know what that difference is at this point?
        c1 = t1.childNodes[i];
        c2 = t2.childNodes[i];
        console.log("node difference at " + i + " between ", c1, " and" , c2);
        return { action: "modified", nodeNumber: i };

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

/**
 * Apply a diff to a tree, generating a new tree.
 */
var resolveDiff = function(diff, t1, t2, groups) {
  var applied = t1.cloneNode(true),
      route = diff.route;

  /**
   * To go from t1 to t2, we first need to remove a node
   */
  if(diff.action === "remove") {
    var child = applied.childNodes[diff.nodeNumber];
    applied.removeChild(child);
    diffResult.push({
      action: "removal",
      routes: grow(route, diff.nodeNumber)
    });
  }

  /**
   * To go from t1 to t2, we first need to insert a node
   */
  else if(diff.action === "insert") {
    var next = diff.nodeNumber+1,
        newNode = t2.childNodes[diff.nodeNumber].cloneNode(true);
    if (next > applied.childNodes.length) {
      diffResult.push({
        action: "append",
        routes: grow(route),
        element: toHTML(newNode)
      });
      applied.appendChild(newNode);
    } else {
      var reference = applied.childNodes[diff.nodeNumber];
      diffResult.push({
        action: "insert",
        routes: grow(route, diff.nodeNumber),
        element: toHTML(newNode)
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
      diffResult.push({
        action: "text modified",
        routes: grow(route, diff.nodeNumber),
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

        diffResult.push({
          action: "insert",
          routes: grow(route, diff.nodeNumber),
          element: toHTML(child)
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

        diffResult.push({
          action: "insert",
          routes: grow(route, diff.nodeNumber),
          element: toHTML(child)
        });

        applied.insertBefore(child, reference);
      }
    }
  }

  // the "applied" tree is now t1, one step closer to being t2.
  return applied;
}

// safety valve for diffing.
var debug = true,
    diffCount = 0,
    diffCap = 1000;

/**
 * Determine the diff between two trees, based on gaps
 * between stable subtree mappings.
 */
var findDiff = function findDiff(t1, t2, route) {
  if(debug && diffCount++ > diffCap) {
    throw new Error("diff cap reached");
  }

  if (!route) {
    route = [];
    diffResult = [];
  }

  // find the stable subset
  var stable = markSubTrees(t1, t2);

  if (stable.length === 0) {
    if(t1.childNodes.length > 0 || t2.childNodes.length > 0) {
      console.log("something happened here");
    }
    return;
  }

  var subset = stable[0],
      outerdiff = findAttrDiff(t1, t2, route);

  // special case: no direct child differences: check each child for differences.
  if (stable.length === 1 && subset["old"] === 0  && subset["new"] === 0 &&  subset.length === t1.childNodes.length) {
    for(var i=0, last=t1.childNodes.length; i<last; i++) {
      console.log("checking " + (route.length>0 ? route.join(",") + "," : '') + i);
      findDiff(t1.childNodes[i], t2.childNodes[i], grow(route, i));
    }
    return;
  }

  //
  var gapInformation = getGapInformation(t1, t2, stable),
      diff = getFirstDiff(t1, t2, gapInformation);

  if(diff === false) {
    throw new Error("more than 1 mapped subtree ("+stable.length+"), but no diff could be found...");
  }

  diff.route = route;
  var t1prime = resolveDiff(diff, t1, t2, stable);
  findDiff(t1prime, t2, route);
}
