  const ADD_ATTRIBUTE = "add attribute",
        MODIFY_ATTRIBUTE = "modify attribute",
        REMOVE_ATTRIBUTE = "remove attribute",
        MODIFY_TEXT_ELEMENT = "modify text element",
        RELOCATE_GROUP = "relocate group",
        REMOVE_ELEMENT = "remove element",
        ADD_ELEMENT = "add element",
        REMOVE_TEXT_ELEMENT = "remove text element",
        ADD_TEXT_ELEMENT = "add text element",
        REPLACE_ELEMENT = "replace element";

  var Diff = function(options) {
    var diff = this;
    Object.keys(options).forEach(function(option) {
      diff[option] = options[option];
    });
  }
  Diff.prototype = {
    toString: function() {
      return JSON.stringify(this);
    }
  };

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

  var roughlyEqual = function roughlyEqual(e1, e2, preventRecursion) {
    if (!e1 || !e2) return false;
    if (e1.nodeType !== e2.nodeType) return false;
    if (e1.nodeType === 3) {
      if (e2.nodeType !==3) return false;
      // Note that we initially don't care what the text content of a node is,
      // the mere fact that it's the same tag and "has text" means it's roughly
      // equal, and then we can find out the true text difference later.
      return preventRecursion ? true : e1.data === e2.data;
    }
    if (e1.nodeName !== e2.nodeName) return false;
    if (e1.childNodes.length !== e2.childNodes.length) return false;
    var thesame = true;
    for (var i=e1.childNodes.length-1; i >= 0; i--) {
      if (preventRecursion) {
        thesame = thesame && (e1.childNodes[i].nodeName === e2.childNodes[i].nodeName);
      } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        //       was not set, we must explicitly force it to true for child iterations.
        thesame = thesame && roughlyEqual(e1.childNodes[i], e2.childNodes[i], true);
      }
    }
    return thesame;
  };

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
    if(lcsSize === 0) { return false; }
    var origin = [index[0] - lcsSize, index[1] - lcsSize];
    var ret = new SubsetMapping(origin[0], origin[1]);
    ret.length = lcsSize;
    return ret;
  };

  /**
   * This should really be a predefined function in Array...
   */
  var makeArray = function(n, v) {
    var deepcopy = function(v) {
      v.slice();
      for(var i=0, last=v.length; i<last; i++){
        if(v[i] instanceof Array) {
          v[i] = deepcopy(v[i]); }}};
    if(v instanceof Array) { v = deepcopy(v); }
    var set = function() { return v; };
    return (new Array(n)).join('.').split('.').map(set);
  };

  /**
   * Generate arrays that indicate which node belongs to which subset,
   * or whether it's actually an orphan node, existing in only one
   * of the two trees, rather than somewhere in both.
   */
  var getGapInformation = function(t1, t2, stable) {
    // [true, true, ...] arrays
    var set = function(v) { return function() { return v; }},
        gaps1 = this.makeArray(t1.childNodes.length, true),
        gaps2 = this.makeArray(t2.childNodes.length, true),
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
   * Find all matching subsets, based on immediate child differences only.
   */
  var markSubTrees = function(oldTree, newTree) {
    oldTree = oldTree.cloneNode(true);
    newTree = newTree.cloneNode(true);
    // note: the child lists are views, and so update as we update old/newTree
    var oldChildren = oldTree.childNodes,
        newChildren = newTree.childNodes,
        marked1 = makeArray(oldChildren.length, false),
        marked2 = makeArray(newChildren.length, false),
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

  var findFirstInnerDiff = function(t1, t2, subtrees, route) {
    if(subtrees.length === 0) return false;

    var gapInformation = getGapInformation(t1, t2, subtrees),
        gaps1 = gapInformation.gaps1,
        gl1 = gaps1.length,
        gaps2 = gapInformation.gaps2,
        gl2 = gaps1.length,
        i,
        last = gl1 < gl2 ? gl1 : gl2;

    // Check for correct submap sequencing (irrespective of gaps) first:
    var sequence = 0,
        group, node,
        shortest = gl1<gl2 ? gaps1 : gaps2;

    // group relocation
    for(i=0, last = shortest.length; i<last; i++) {
      if(gaps1[i] === true) {
        node = t1.childNodes[i];
        if(node.nodeType === 3) {
          return new Diff({
            action: REMOVE_TEXT_ELEMENT,
            route: route.concat(i),
            element: node.data
          });
        }
        return new Diff({
          action: REMOVE_ELEMENT,
          route: route.concat(i),
          element: node.outerHTML
        });
      }
      if(gaps2[i] === true) {
        node = t2.childNodes[i];
        if(node.nodeType === 3) {
          return new Diff({
            action: ADD_TEXT_ELEMENT,
            route: route.concat(i),
            element: node.data
          });
        }
        return new Diff({
          action: ADD_ELEMENT,
          route: route.concat(i),
          element: node.outerHTML
        });
      }
      if(gaps1[i] != gaps2[i]) {
        group = subtrees[gaps1[i]];
        return new Diff({
          action: RELOCATE_GROUP,
          group: group,
          from: i,
          to: group["new"],
          route: route
        });
      }
    }
    return false;
  };

(function() {

  function swap(obj, p1, p2) {
    (function(_) { obj[p1] = obj[p2]; obj[p2] = _; } (obj[p1]));
  };


  var DiffTracker = function() {
    this.list = [];
  };
  DiffTracker.prototype = {
    list: false,
    add: function(difflist) {
      var list = this.list;
      difflist.forEach(function(diff) {
        list.push(diff);
      });
    },
    forEach: function(fn) {
      this.list.forEach(fn);
    }
  };



  var debug = true,
      diffcap = 500,
      diffcount;

  var DOMdiff = function() {};
  DOMdiff.prototype = {

    // ===== Create a diff =====

    diff: function(t1, t2) {
      diffcount = 0;
      t1 = t1.cloneNode(true); 
      this.tracker = new DiffTracker();
      return this.findDiffs(t1, t2);
    },
    findDiffs: function(t1, t2) {
      var diff;
      do {
        if(debug) {
          diffcount++;
          if(diffcount > diffcap) {
            throw new Error("surpassed diffcap");
          }
        }

        difflist = this.findFirstDiff(t1, t2, []);
        if(difflist) {
          if(!difflist.length) { difflist = [difflist]; }
          this.tracker.add(difflist);
          this.apply(t1, difflist);
        }
      } while (difflist);
      return this.tracker.list;
    },
    findFirstDiff: function(t1, t2, route) {
      // outer differences?
      var difflist = this.findOuterDiff(t1, t2, route);
      if(difflist.length > 0) { return difflist; }
      // inner differences?
      var diff = this.findInnerDiff(t1, t2, route);
      if(diff) { 
        if(typeof diff.length === "undefined") { diff = [diff]; }
        if (diff.length > 0) {
          return diff;
        } 
      }
      // no differences
      return false;
    },
    findOuterDiff: function(t1, t2, route) {
      var slice = Array.prototype.slice,
          byName = function(a, b) { return a.name > b.name; },
          attr1 = slice.call(t1.attributes).sort(byName),
          attr2 = slice.call(t2.attributes).sort(byName),
          find = function(attr, list) {
            for(var i=0, last=list.length; i<last; i++) {
              if(list[i].name === attr.name)
                return i;
            }
            return -1;
          },
          diffs = [];
          
      if (t1.nodeName != t2.nodeName) {
          return [new Diff({
              action: REPLACE_ELEMENT,
              oldValue: t1.outerHTML,
              newValue: t2.outerHTML,
              route: route
        })];
      }
      attr1.forEach(function(attr) {
        var pos = find(attr, attr2);
        if(pos === -1) {
          diffs.push(new Diff({
            action: REMOVE_ATTRIBUTE,
            attribute: {
              name: attr.name,
              value: attr.nodeValue
            },
            route: route
          }));
          return diffs;
        }
        var a2 = attr2.splice(pos, 1)[0];
        if(attr.nodeValue !== a2.nodeValue) {
          diffs.push(new Diff({
            action: MODIFY_ATTRIBUTE,
            attribute: {
              name: attr.name,
              oldValue: attr.nodeValue,
              newValue: a2.nodeValue
            },
            route: route
          }));
        }
      });
      attr2.forEach(function(attr) {
        diffs.push(new Diff({
          action: ADD_ATTRIBUTE,
          attribute: {
            name: attr.name,
            value: attr.nodeValue
          },
          route: route
        }));
      });
      return diffs;
    },
    findInnerDiff: function(t1, t2, route) {
      var subtrees = markSubTrees(t1, t2);
      var mappings = subtrees.length;
      // no correspondence whatsoever
      // if t1 or t2 contain differences that are not text nodes, return a diff. 

      // two text nodes with differences
      if(mappings === 0) {
        if (t1.nodeType === 3 && t2.nodeType === 3 && t1.data != t2.data) {
          return new Diff({
            action: MODIFY_TEXT_ELEMENT,
            oldValue: t1.data,
            newValue: t2.data,
            route: route
          });
        }
      }
      // possibly identical content: verify
      if(mappings < 2) {
        var diff, difflist, i, last, e1, e2;
        for(i=0, last=Math.max(t1.childNodes.length,t2.childNodes.length); i<last; i++) {
          e1 = t1.childNodes[i];
          e2 = t2.childNodes[i];
          // TODO: this is a similar code path to the one
          //       in findFirstInnerDiff. Can we unify these?
          if(e1 && !e2) {
            if(e1.nodeType === 3) {
              return new Diff({
                action: REMOVE_TEXT_ELEMENT,
                route: route.concat(i),
                element: e1.data
              });
            }
            return new Diff({
              action: REMOVE_ELEMENT,
              route: route.concat(i),
              element: e1.outerHTML
            });
          }
          if(e2 && !e1) {
            if(e2.nodeType === 3) {
              return new Diff({
                action: ADD_TEXT_ELEMENT,
                route: route.concat(i),
                element: e2.data
              });
            }
            return new Diff({
              action: ADD_ELEMENT,
              route: route.concat(i),
              element: e2.outerHTML
            });
          }
          if (e1.nodeType != 3 && e2.nodeType != 3) {
            difflist = this.findOuterDiff(e1, e2, route.concat(i));
            if(difflist.length > 0) {
              return difflist;
            }
          }
          diff = this.findInnerDiff(e1, e2, route.concat(i));
          if(diff) {
            return diff;
          }
        }
      }

      // one or more differences: find first diff
      return this.findFirstInnerDiff(t1, t2, subtrees, route);
    },

    // imported
    findFirstInnerDiff: findFirstInnerDiff,

    // ===== Apply a diff =====

    apply: function(tree, diffs) {
      var dobj = this;
      if(typeof diffs.length === "undefined") { diffs = [diffs]; }
      if(diffs.length === 0) { return; }
      diffs.forEach(function(diff) {
        dobj.applyDiff(tree, diff);
      });
    },
    getFromRoute: function(tree, route) {
      route = route.slice();
      var c, node = tree;
      while(route.length > 0) {
        c = route.splice(0,1)[0];
        node = node.childNodes[c];
      }
      return node;
    },
    // diffing text elements can be overwritten for use with diff_match_patch and alike
    textDiff: function(currentValue, expectedValue, newValue) {
      return newValue;
    },
    applyDiff: function(tree, diff) {
      var node = this.getFromRoute(tree, diff.route);
      if(diff.action === ADD_ATTRIBUTE) {
        node.setAttribute(diff.attribute.name, diff.attribute.value);
      }
      else if(diff.action === MODIFY_ATTRIBUTE) {
        node.setAttribute(diff.attribute.name, diff.attribute.newValue);
      }
      else if(diff.action === REMOVE_ATTRIBUTE) {
        node.removeAttribute(diff.attribute.name);
      }
      else if(diff.action === MODIFY_TEXT_ELEMENT) {
        node.data = this.textDiff(node.data, diff.oldValue, diff.newValue);
      }
      else if(diff.action === REPLACE_ELEMENT) {
        var outerNode = document.createElement('div');
        outerNode.innerHTML = diff.newValue;
        var newNode = outerNode.firstChild;
        node.parentNode.replaceChild(newNode, node);
      }
      else if(diff.action === RELOCATE_GROUP) {
        var group = diff.group,
            from = diff.from,
            to = diff.to,
            child, reference;

        // slide elements down
        if(from > to ) {
          for(var i=0; i<group.length; i++) {
            child = node.childNodes[from + i];
            reference = node.childNodes[to + i];
            node.insertBefore(child, reference);
          }
          return;
        }

        // slide elements up
        for(var i=group.length-1; i>=0; i--) {
          child = node.childNodes[from + i];
          reference = node.childNodes[to + 1 + i];
          node.insertBefore(child, reference);
        }
      }
      else if(diff.action === REMOVE_ELEMENT) {
        node.parentNode.removeChild(node);
      }
      else if(diff.action === REMOVE_TEXT_ELEMENT) {
        node.parentNode.removeChild(node);
      }
      else if(diff.action === ADD_ELEMENT) {
        var route =  diff.route.slice(),
            c = route.splice(route.length-1,1)[0],
            d = document.createElement("div");
        node = this.getFromRoute(tree, route);
        d.innerHTML = diff.element;
        var newNode = d.childNodes[0];
        if(c>=node.childNodes.length) {
          node.appendChild(newNode);
        } else {
          var reference = node.childNodes[c];
          node.insertBefore(newNode, reference);
        }
      }
      else if(diff.action === ADD_TEXT_ELEMENT) {
        var route =  diff.route.slice(),
            c = route.splice(route.length-1,1)[0],
            newNode = document.createTextNode(diff.element);
        node = this.getFromRoute(tree, route);
        if(c>=node.childNodes.length) {
          node.appendChild(newNode);
        } else {
          var reference = node.childNodes[c];
          node.insertBefore(newNode, reference);
        }
      }
    },

    // ===== Undo a diff =====

    undo: function(tree, diffs) {
      diffs = diffs.slice();
      var dobj = this;
      if(!diffs.length) { diffs = [diffs]; }
      diffs.reverse();
      diffs.forEach(function(diff) {
        dobj.undoDiff(tree, diff);
      });
    },
    undoDiff: function(tree, diff) {
      if(diff.action === ADD_ATTRIBUTE) {
        diff.action = REMOVE_ATTRIBUTE;
        this.applyDiff(tree, diff);
      }
      else if(diff.action === MODIFY_ATTRIBUTE) {
        swap(diff.attribute, "oldValue", "newValue");
        this.applyDiff(tree, diff);
      }
      else if(diff.action === REMOVE_ATTRIBUTE) {
        diff.action = ADD_ATTRIBUTE;
        this.applyDiff(tree, diff);
      }
      else if(diff.action === MODIFY_TEXT_ELEMENT) {
        swap(diff, "oldValue", "newValue");
        this.applyDiff(tree, diff);
      }
      else if(diff.action === REPLACE_ELEMENT) {
        swap(diff, "oldValue", "newValue");
        this.applyDiff(tree, diff);
      }      
      else if(diff.action === RELOCATE_GROUP) {
        swap(diff, "from", "to");
        this.applyDiff(tree, diff);
      }
      else if(diff.action === REMOVE_ELEMENT) {
        diff.action = ADD_ELEMENT;
        this.applyDiff(tree, diff);;
      }
      else if(diff.action === ADD_ELEMENT) {
        diff.action = REMOVE_ELEMENT;
        this.applyDiff(tree, diff);;
      }
      else if(diff.action === REMOVE_TEXT_ELEMENT) {
        diff.action = ADD_TEXT_ELEMENT;
        this.applyDiff(tree, diff);;
      }
      else if(diff.action === ADD_TEXT_ELEMENT) {
        diff.action = REMOVE_TEXT_ELEMENT;
        this.applyDiff(tree, diff);;
      }
    },
  };



  window.DOMdiff = DOMdiff;
}());