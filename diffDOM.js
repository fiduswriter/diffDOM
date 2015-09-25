(function() {
    "use strict";

    var diffcount,
        ADD_ATTRIBUTE = 0,
        MODIFY_ATTRIBUTE = 1,
        REMOVE_ATTRIBUTE = 2,
        MODIFY_TEXT_ELEMENT = 3,
        RELOCATE_GROUP = 4,
        REMOVE_ELEMENT = 5,
        ADD_ELEMENT = 6,
        REMOVE_TEXT_ELEMENT = 7,
        ADD_TEXT_ELEMENT = 8,
        REPLACE_ELEMENT = 9,
        MODIFY_VALUE = 10,
        MODIFY_CHECKED = 11,
        MODIFY_SELECTED = 12,
        MODIFY_DATA = 13,
        ACTION = 14,
        ROUTE = 15,
        OLD_VALUE = 16,
        NEW_VALUE = 17,
        ELEMENT = 18,
        GROUP = 19,
        FROM = 20,
        TO = 21,
        NAME = 22,
        VALUE = 23,
        DATA = 24,
        ATTRIBUTES = 25,
        NODE_NAME = 26,
        NODE_TYPE = 27,
        CHILD_NODES = 28,
        CHECKED = 29,
        SELECTED = 30;

    var Diff = function(options) {
        var diff = this;
        Object.keys(options).forEach(function(option) {
            diff[option] = options[option];
        });
    };

    Diff.prototype = {
        toString: function() {
            return JSON.stringify(this);
        }
    };

    var SubsetMapping = function SubsetMapping(a, b) {
        this.old = a;
        this.new = b;
    };

    SubsetMapping.prototype = {
        contains: function contains(subset) {
            if (subset.length < this.length) {
                return subset.new >= this.new && subset.new < this.new + this.length;
            }
            return false;
        },
        toString: function toString() {
            return this.length + " element subset, first mapping: old " + this.old + " → new " + this.new;
        }
    };

    var elementDescriptors = function(el) {
        var output = [];
        if (el.nodeType === 1) {
            output.push(el.tagName);
            if (typeof(el.className) === 'string') {
                output.push(el.tagName + '.' + el.className.replace(/ /g, '.'));
            }
            if (el.id) {
                output.push(el.tagName + '#' + el.id);
            }
        }
        return output;
    };

    var findUniqueDescriptors = function(li) {
        var uniqueDescriptors = {},
            duplicateDescriptors = {},
            liArray = Array.prototype.slice.call(li),
            descriptors, inUnique, inDupes;

        liArray.forEach(function(node) {
            descriptors = elementDescriptors(node);
            descriptors.forEach(function(descriptor) {
                inUnique = descriptor in uniqueDescriptors;
                inDupes = descriptor in duplicateDescriptors;
                if (!inUnique && !inDupes) {
                    uniqueDescriptors[descriptor] = true;
                } else if (inUnique) {
                    delete uniqueDescriptors[descriptor];
                    duplicateDescriptors[descriptor] = true;
                }
            });

        });

        return uniqueDescriptors;
    };

    var uniqueInBoth = function(l1, l2) {
        var l1Unique = findUniqueDescriptors(l1),
            l2Unique = findUniqueDescriptors(l2),
            inBoth = {},
            key;

        Object.keys(l1Unique).forEach(function() {
            if (l2Unique[key]) {
                inBoth[key] = true;
            }
        });

        return inBoth;
    };

    var roughlyEqual = function roughlyEqual(e1, e2, uniqueDescriptors, sameSiblings, preventRecursion) {
        var childUniqueDescriptors, nodeList1, nodeList2;

        if (!e1 || !e2) {
            return false;
        }
        if (e1[NODE_TYPE] !== e2[NODE_TYPE]) {
            return false;
        }
        if (e1[NODE_TYPE] === 3) {
            if (e2[NODE_TYPE] !== 3) {
                return false;
            }
            // Note that we initially don't care what the text content of a node is,
            // the mere fact that it's the same tag and "has text" means it's roughly
            // equal, and then we can find out the true text difference later.
            return preventRecursion ? true : e1[DATA] === e2[DATA];
        }
        if (e1[NODE_NAME] !== e2[NODE_NAME]) {
            return false;
        }
        if (e1[NODE_NAME] === e2[NODE_NAME]) {
            if (e1[NODE_NAME] in uniqueDescriptors) {
                return true;
            }
            if (e1[ATTRIBUTES] && e2[ATTRIBUTES]) {
                if (e1[ATTRIBUTES].id && e1[ATTRIBUTES].id === e2[ATTRIBUTES].id) {
                    var idDescriptor = e1[NODE_NAME] + '#' + e1[ATTRIBUTES].id;
                    if (idDescriptor in uniqueDescriptors) {
                        return true;
                    }
                }
                if (e1[ATTRIBUTES].class && e1[ATTRIBUTES].class === e2[ATTRIBUTES].class) {
                    var classDescriptor = e1[NODE_NAME] + '.' + e1[ATTRIBUTES].class.replace(/ /g, '.');
                    if (classDescriptor in uniqueDescriptors) {
                        return true;
                    }
                }
            }

            if (sameSiblings) {
                return true;
            }
        }

        nodeList1 = e1[CHILD_NODES] ? Array.prototype.slice.call(e1[CHILD_NODES]).reverse() : [];
        nodeList2 = e2[CHILD_NODES] ? Array.prototype.slice.call(e2[CHILD_NODES]).reverse() : [];

        if (nodeList1.length !== nodeList2.length) {
            return false;
        }

        if (preventRecursion) {
            return nodeList1.every(function(element, index) {
                return element[NODE_NAME] === nodeList2[index][NODE_NAME];
            });
        } else {
            // note: we only allow one level of recursion at any depth. If 'preventRecursion'
            // was not set, we must explicitly force it to true for child iterations.
            childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2);
            return nodeList1.every(function(element, index) {
                return roughlyEqual(element, nodeList2[index], childUniqueDescriptors, true, true);
            });
        }
    };

    var cloneObj = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    var nodeToObj = function(node) {
        var objNode = {};
        objNode[NODE_TYPE] = node.nodeType;
        if (node.nodeType === 3 || node.nodeType === 8) {
            objNode[DATA] = node.data;
        } else {
            objNode[NODE_NAME] = node.nodeName;
            if (node.attributes && node.attributes.length > 0) {
                objNode[ATTRIBUTES] = {};
                Array.prototype.slice.call(node.attributes).forEach(
                    function(attribute) {
                        objNode[ATTRIBUTES][attribute.name] = attribute.value;
                    }
                );
            }
            if (node.childNodes && node.childNodes.length > 0) {
                objNode[CHILD_NODES] = [];
                Array.prototype.slice.call(node.childNodes).forEach(
                    function(childNode) {
                        objNode[CHILD_NODES].push(nodeToObj(childNode));
                    }
                );
            }
            if (node.value) {
                objNode[VALUE] = node.value;
            }
            if (node.checked) {
                objNode[CHECKED] = node.checked;
            }
            if (node.selected) {
                objNode[SELECTED] = node.selected;
            }
        }

        return objNode;
    };


    var objToNode = function(objNode, insideSvg) {
        var node, attribute;
        if (objNode[NODE_TYPE] === 3) {
            //    console.log(objNode);
            node = objNode[DATA] ? document.createTextNode(objNode[DATA]) : document.createTextNode('');

        } else if (objNode[NODE_TYPE] === 8) {
            node = objNode[DATA] ? document.createComment(objNode[DATA]) : document.createComment('');
        } else {
            if (objNode[NODE_NAME] === 'svg' || insideSvg) {
                node = document.createElementNS('http://www.w3.org/2000/svg', objNode[NODE_NAME]);
                insideSvg = true;
            } else {
                node = document.createElement(objNode[NODE_NAME]);
            }
            if (objNode[ATTRIBUTES]) {
                for (attribute in objNode[ATTRIBUTES]) {
                    node.setAttribute(attribute, objNode[ATTRIBUTES][attribute]);
                }
            }
            if (objNode[CHILD_NODES]) {
                objNode[CHILD_NODES].forEach(function(childNode) {
                    node.appendChild(objToNode(childNode, insideSvg));
                });
            }
            if (objNode[VALUE]) {
                node.value = objNode[VALUE];
            }
            if (objNode[CHECKED]) {
                node.checked = objNode[CHECKED];
            }
            if (objNode[SELECTED]) {
                node.selected = objNode[SELECTED];
            }
        }
        return node;
    };



    /**
     * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
     */
    var findCommonSubsets = function(c1, c2, marked1, marked2) {
        var lcsSize = 0,
            index = [],
            c1Array = Array.prototype.slice.call(c1),
            c2Array = Array.prototype.slice.call(c2),
            matches = Array.apply(null, new Array(c1.length + 1)).map(function() {
                return [];
            }), // set up the matching table
            uniqueDescriptors = uniqueInBoth(c1, c2),
            // If all of the elements are the same tag, id and class, then we can
            // consider them roughly the same even if they have a different number of
            // children. This will reduce removing and re-adding similar elements.
            subsetsSame = c1.length === c2.length,
            origin, ret;

        if (subsetsSame) {

            c1Array.some(function(element, i) {
                var c1Desc = elementDescriptors(element),
                    c2Desc = elementDescriptors(c2[i]);
                if (c1Desc.length !== c2Desc.length) {
                    subsetsSame = false;
                    return true;
                }
                c1Desc.some(function(description, i) {
                    if (description !== c2Desc[i]) {
                        subsetsSame = false;
                        return true;
                    }
                });
                if (!subsetsSame) {
                    return true;
                }

            });
        }

        // fill the matches with distance values
        c1Array.forEach(function(c1Element, c1Index) {
            c2Array.forEach(function(c2Element, c2Index) {
                if (!marked1[c1Index] && !marked2[c2Index] && roughlyEqual(c1Element, c2Element, uniqueDescriptors, subsetsSame)) {
                    matches[c1Index + 1][c2Index + 1] = (matches[c1Index][c2Index] ? matches[c1Index][c2Index] + 1 : 1);
                    if (matches[c1Index + 1][c2Index + 1] > lcsSize) {
                        lcsSize = matches[c1Index + 1][c2Index + 1];
                        index = [c1Index + 1, c2Index + 1];
                    }
                } else {
                    matches[c1Index + 1][c2Index + 1] = 0;
                }
            });
        });

        if (lcsSize === 0) {
            return false;
        }
        origin = [index[0] - lcsSize, index[1] - lcsSize];
        ret = new SubsetMapping(origin[0], origin[1]);
        ret.length = lcsSize;
        return ret;
    };

    /**
     * This should really be a predefined function in Array...
     */
    var makeArray = function(n, v) {
        return Array.apply(null, new Array(n)).map(function() {
            return v;
        });
    };

    /**
     * Generate arrays that indicate which node belongs to which subset,
     * or whether it's actually an orphan node, existing in only one
     * of the two trees, rather than somewhere in both.
     */
    var getGapInformation = function(t1, t2, stable) {

        var gaps1 = t1[CHILD_NODES] ? makeArray(t1[CHILD_NODES].length, true) : [],
            gaps2 = t2[CHILD_NODES] ? makeArray(t2[CHILD_NODES].length, true) : [],
            group = 0;

        // give elements from the same subset the same group number
        stable.forEach(function(subset) {
            var i, endOld = subset.old + subset.length,
                endNew = subset.new + subset.length;
            for (i = subset.old; i < endOld; i += 1) {
                gaps1[i] = group;
            }
            for (i = subset.new; i < endNew; i += 1) {
                gaps2[i] = group;
            }
            group += 1;
        });

        return {
            gaps1: gaps1,
            gaps2: gaps2
        };
    };

    /**
     * Find all matching subsets, based on immediate child differences only.
     */
    var markSubTrees = function(oldTree, newTree) {
        // note: the child lists are views, and so update as we update old/newTree
        var oldChildren = oldTree[CHILD_NODES] ? oldTree[CHILD_NODES] : [],
            newChildren = newTree[CHILD_NODES] ? newTree[CHILD_NODES] : [],
            marked1 = makeArray(oldChildren.length, false),
            marked2 = makeArray(newChildren.length, false),
            subsets = [],
            subset = true,
            returnIndex = function() {
                return arguments[1];
            },
            markBoth = function(i) {
                marked1[subset.old + i] = true;
                marked2[subset.new + i] = true;
            };

        while (subset) {
            subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
            if (subset) {
                subsets.push(subset);

                Array.apply(null, new Array(subset.length)).map(returnIndex).forEach(markBoth);

            }
        }
        return subsets;
    };


    function swap(obj, p1, p2) {
        (function(_) {
            obj[p1] = obj[p2];
            obj[p2] = _;
        }(obj[p1]));
    }


    var DiffTracker = function() {
        this.list = [];
    };

    DiffTracker.prototype = {
        list: false,
        add: function(diffs) {
            var list = this.list;
            diffs.forEach(function(diff) {
                list.push(diff);
            });
        },
        forEach: function(fn) {
            this.list.forEach(fn);
        }
    };

    var diffDOM = function(options) {

        var defaults = {
                debug: false,
                diffcap: 10,
                valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
                // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
                textDiff: function() {
                    arguments[0].data = arguments[3];
                    return;
                }
            },
            i;

        if (typeof options == "undefined") {
            options = {};
        }

        for (i in defaults) {
            if (typeof options[i] == "undefined") {
                this[i] = defaults[i];
            } else {
                this[i] = options[i];
            }
        }

        if (this.debug) {
            ADD_ATTRIBUTE = "add attribute";
            MODIFY_ATTRIBUTE = "modify attribute";
            REMOVE_ATTRIBUTE = "remove attribute";
            MODIFY_TEXT_ELEMENT = "modify text element";
            RELOCATE_GROUP = "relocate group";
            REMOVE_ELEMENT = "remove element";
            ADD_ELEMENT = "add element";
            REMOVE_TEXT_ELEMENT = "remove text element";
            ADD_TEXT_ELEMENT = "add text element";
            REPLACE_ELEMENT = "replace element";
            MODIFY_VALUE = "modify value";
            MODIFY_CHECKED = "modify checked";
            MODIFY_SELECTED = "modify selected";
            ACTION = "action";
            ROUTE = "route";
            OLD_VALUE = "oldValue";
            NEW_VALUE = "newValue";
            ELEMENT = "element";
            GROUP = "group";
            FROM = "from";
            TO = "to";
            NAME = "name";
            VALUE = "value";
            DATA = "data";
            ATTRIBUTES = "attributes";
            NODE_NAME = "nodeName";
            NODE_TYPE = "nodeType";
            CHILD_NODES = "childNodes";
            CHECKED = "checked";
            SELECTED = "selected";
        }

    };
    diffDOM.prototype = {

        // ===== Create a diff =====

        diff: function(t1Node, t2Node) {

            var t1 = nodeToObj(t1Node),
                t2 = nodeToObj(t2Node);

            diffcount = 0;

            if (this.debug) {
                this.t1Orig = nodeToObj(t1Node);
                this.t2Orig = nodeToObj(t2Node);
            }

            this.tracker = new DiffTracker();
            return this.findDiffs(t1, t2);
        },
        findDiffs: function(t1, t2) {
            var diffs;
            do {
                if (this.debug) {
                    diffcount += 1;
                    if (diffcount > this.diffcap) {
                        console.log(diffs);
                        window.diffError = [this.t1Orig, this.t2Orig];
                        throw new Error("surpassed diffcap:" + JSON.stringify(this.t1Orig) + " -> " + JSON.stringify(this.t2Orig));
                    }
                }
                diffs = this.findFirstDiff(t1, t2, []);
                if (diffs.length > 0) {
                    this.tracker.add(diffs);
                    this.applyVirtual(t1, diffs);
                }
            } while (diffs);
            return this.tracker.list;
        },
        findFirstDiff: function(t1, t2, route) {
            var diffs;

            // outer differences?
            if (!t1.outer_done) {
                diffs = this.findOuterDiff(t1, t2, route);
                if (diffs.length > 0) {
                    return diffs;
                } else {
                    t1.outer_done = true;
                }
            }
            // inner differences?
            if (!t1.inner_done) {
                diffs = this.findInnerDiff(t1, t2, route);
                if (diffs.length > 0) {
                    return diffs;
                } else {
                    t1.inner_done = true;
                }
            }

            if (this.valueDiffing && !t1.value_done) {
                // value differences?
                diffs = this.findValueDiff(t1, t2, route);

                if (diffs.length > 0) {
                    return diffs;
                } else {
                    t1.value_done = true;
                }
            }

            // no differences
            return false;
        },
        findOuterDiff: function(t1, t2, route) {

            var k, diffs = [];

            if (t1[NODE_NAME] !== t2[NODE_NAME]) {
                k = {};
                k[ACTION] = REPLACE_ELEMENT;
                k[OLD_VALUE] = cloneObj(t1); //nodeToObj(t1);
                k[NEW_VALUE] = cloneObj(t2); //nodeToObj(t2);
                k[ROUTE] = route;
                return [new Diff(k)];
            }


            var attr1 = t1[ATTRIBUTES] ? Object.keys(t1[ATTRIBUTES]).sort() : [],
                attr2 = t2[ATTRIBUTES] ? Object.keys(t2[ATTRIBUTES]).sort() : [],
                find = function(attr, list) {
                    var j, last = list.length;
                    for (j = 0; j < last; j += 1) {
                        if (list[j] === attr) {
                            return j;
                        }
                    }
                    return -1;
                };

            attr1.forEach(function(attr) {
                var pos = find(attr, attr2),
                    l;
                if (pos === -1) {
                    l = {};
                    l[ACTION] = REMOVE_ATTRIBUTE;
                    l[ROUTE] = route;
                    l[NAME] = attr;
                    l[VALUE] = t1[ATTRIBUTES][attr];
                    diffs.push(new Diff(l));
                    return diffs;
                }
                attr2.splice(pos, 1)[0];
                if (t1[ATTRIBUTES][attr] !== t2[ATTRIBUTES][attr]) {
                    l = {};
                    l[ACTION] = MODIFY_ATTRIBUTE;
                    l[ROUTE] = route;
                    l[NAME] = attr;
                    l[OLD_VALUE] = t1[ATTRIBUTES][attr];
                    l[NEW_VALUE] = t2[ATTRIBUTES][attr];

                    diffs.push(new Diff(l));
                }
            });
            if (!t1[ATTRIBUTES] && t1[DATA] !== t2[DATA]) {
                k = {};
                k[ACTION] = MODIFY_DATA;
                k[ROUTE] = route;
                k[OLD_VALUE] = t1[DATA];
                k[NEW_VALUE] = t2[DATA];
                diffs.push(new Diff(k));
            }
            if (diffs.length > 0) {
                return diffs;
            }
            attr2.forEach(function(attr) {
                var l;
                l = {};
                l[ACTION] = ADD_ATTRIBUTE;
                l[ROUTE] = route;
                l[NAME] = attr;
                l[VALUE] = t2[ATTRIBUTES][attr];
                diffs.push(new Diff(l));

            });

            return diffs;
        },
        findInnerDiff: function(t1, t2, route) {

            var subtrees = markSubTrees(t1, t2),
                mappings = subtrees.length,
                t1_child_nodes = t1[CHILD_NODES] ? t1[CHILD_NODES] : [],
                t2_child_nodes = t2[CHILD_NODES] ? t2[CHILD_NODES] : [],
                diff, diffs, i, last, e1, e2,
                k;

            // no correspondence whatsoever
            // if t1 or t2 contain differences that are not text nodes, return a diff.

            // two text nodes with differences
            if (mappings === 0) {
                if (t1[NODE_TYPE] === 3 && t2[NODE_TYPE] === 3 && t1[DATA] !== t2[DATA]) {
                    k = {};
                    k[ACTION] = MODIFY_TEXT_ELEMENT;
                    k[OLD_VALUE] = t1[DATA];
                    k[NEW_VALUE] = t2[DATA];
                    k[ROUTE] = route;
                    diff = new Diff(k);
                    return [diff];
                }
            }
            // possibly identical content: verify
            if (mappings < 2) {
                last = Math.max(t1_child_nodes.length, t2_child_nodes.length);
                for (i = 0; i < last; i += 1) {
                    e1 = t1_child_nodes[i];
                    e2 = t2_child_nodes[i];
                    // This is a similar code path to the one
                    //       in findFirstInnerDiff. Can we unify these?
                    if (e1 && !e2) {
                        if (e1[NODE_TYPE] === 3) {
                            k = {};
                            k[ACTION] = REMOVE_TEXT_ELEMENT;
                            k[ROUTE] = route.concat(i);
                            k[VALUE] = e1[DATA];
                            diff = new Diff(k);
                            return [diff];
                        }
                        k = {};
                        k[ACTION] = REMOVE_ELEMENT;
                        k[ROUTE] = route.concat(i);
                        k[ELEMENT] = cloneObj(e1); //nodeToObj(e1);
                        diff = new Diff(k);
                        return [diff];
                    }
                    if (e2 && !e1) {
                        if (e2[NODE_TYPE] === 3) {
                            k = {};
                            k[ACTION] = ADD_TEXT_ELEMENT;
                            k[ROUTE] = route.concat(i);
                            k[VALUE] = e2[DATA];
                            diff = new Diff(k);
                            return [diff];
                        }
                        k = {};
                        k[ACTION] = ADD_ELEMENT;
                        k[ROUTE] = route.concat(i);
                        k[ELEMENT] = cloneObj(e2); //nodeToObj(e2);
                        diff = new Diff(k);
                        return [diff];
                    }
                    if (e1[NODE_TYPE] !== 3 || e2[NODE_TYPE] !== 3) {
                        if (!t1_child_nodes[i].outer_done) {
                            diffs = this.findOuterDiff(e1, e2, route.concat(i));
                            if (diffs.length > 0) {
                                return diffs;
                            } else {
                                t1_child_nodes[i].outer_done = true;
                            }
                        }
                    }
                    if (!t1_child_nodes[i].inner_done) {
                        diffs = this.findInnerDiff(e1, e2, route.concat(i));

                        if (diffs.length > 0) {
                            return diffs;
                        } else {
                            t1_child_nodes[i].inner_done = true;
                        }
                    }




                    if (this.valueDiffing && !t1_child_nodes[i].value_done) {
                        diffs = this.findValueDiff(e1, e2, route.concat(i));
                        if (diffs.length > 0) {
                            return diffs;
                        } else {
                            t1_child_nodes[i].value_done = true;
                        }
                    }
                }
            }

            // one or more differences: find first diff
            return this.findFirstInnerDiff(t1, t2, subtrees, route);
        },

        findValueDiff: function(t1, t2, route) {
            // Differences of value. Only useful if the value/selection/checked value
            // differs from what is represented in the DOM. For example in the case
            // of filled out forms, etc.
            var diffs = [],
                k;

            if (t1[SELECTED] !== t2[SELECTED]) {
                k = {};
                k[ACTION] = MODIFY_SELECTED;
                k[OLD_VALUE] = t1[SELECTED];
                k[NEW_VALUE] = t2[SELECTED];
                k[ROUTE] = route;
                diffs.push(new Diff(k));
            }

            if ((t1[VALUE] || t2[VALUE]) && t1[VALUE] !== t2[VALUE] && t1[NODE_NAME] !== 'OPTION') {
                k = {};
                k[ACTION] = MODIFY_VALUE;
                k[OLD_VALUE] = t1[VALUE];
                k[NEW_VALUE] = t2[VALUE];
                k[ROUTE] = route;
                diffs.push(new Diff(k));
            }
            if (t1[CHECKED] !== t2[CHECKED]) {
                k = {};
                k[ACTION] = MODIFY_CHECKED;
                k[OLD_VALUE] = t1[CHECKED];
                k[NEW_VALUE] = t2[CHECKED];
                k[ROUTE] = route;
                diffs.push(new Diff(k));
            }

            return diffs;
        },


        findFirstInnerDiff: function(t1, t2, subtrees, route) {
            if (subtrees.length === 0) {
                return [];
            }

            var gapInformation = getGapInformation(t1, t2, subtrees),
                gaps1 = gapInformation.gaps1,
                gl1 = gaps1.length,
                gaps2 = gapInformation.gaps2,
                gl2 = gaps1.length,
                destinationDifferent, toGroup,
                diff, i, j, k;

            // Check for correct submap sequencing (irrespective of gaps) first:
            var group, node, similarNode, testI, shortest = gl1 < gl2 ? gaps1 : gaps2;

            // group relocation
            for (i = 0; i < shortest.length; i += 1) {
                if (gaps1[i] === true) {
                    node = t1[CHILD_NODES][i];
                    if (node[NODE_TYPE] === 3) {
                        if (t2[CHILD_NODES][i][NODE_TYPE] === 3 && node[DATA] !== t2[CHILD_NODES][i][DATA]) {
                            testI = i;
                            while (t1[CHILD_NODES].length > testI + 1 && t1[CHILD_NODES][testI + 1][NODE_TYPE] === 3) {
                                testI += 1;
                                if (t2[CHILD_NODES][i][DATA] === t1[CHILD_NODES][testI][DATA]) {
                                    similarNode = true;
                                    break;
                                }
                            }
                            if (!similarNode) {
                                k = {};
                                k[ACTION] = MODIFY_TEXT_ELEMENT;
                                k[ROUTE] = route.concat(i);
                                k[OLD_VALUE] = node[DATA];
                                k[NEW_VALUE] = t2[CHILD_NODES][i][DATA];
                                diff = new Diff(k);
                                return [diff];
                            }
                        }
                        k = {};
                        k[ACTION] = REMOVE_TEXT_ELEMENT;
                        k[ROUTE] = route.concat(i);
                        k[VALUE] = node[DATA];
                        diff = new Diff(k);
                        return [diff];
                    }
                    k = {};
                    k[ACTION] = REMOVE_ELEMENT;
                    k[ROUTE] = route.concat(i);
                    k[ELEMENT] = cloneObj(node); // nodeToObj(node);
                    diff = new Diff(k);
                    return [diff];
                }
                if (gaps2[i] === true) {
                    node = t2[CHILD_NODES][i];
                    if (node[NODE_TYPE] === 3) {
                        k = {};
                        k[ACTION] = ADD_TEXT_ELEMENT;
                        k[ROUTE] = route.concat(i);
                        k[VALUE] = node[DATA];
                        diff = new Diff(k);
                        return [diff];
                    }
                    k = {};
                    k[ACTION] = ADD_ELEMENT;
                    k[ROUTE] = route.concat(i);
                    k[ELEMENT] = cloneObj(node); //nodeToObj(node);
                    diff = new Diff(k);
                    return [diff];
                }
                if (gaps1[i] !== gaps2[i]) {
                    group = subtrees[gaps1[i]];
                    toGroup = Math.min(group.new, (t1[CHILD_NODES].length - group.length));
                    if (toGroup !== i) {
                        // Check whether destination nodes are different than originating ones.
                        destinationDifferent = false;
                        for (j = 0; j < group.length; j += 1) {
                            // OBS! Comparison using JSON.stringify may miss cases that are equal as the order of attributes may be different.
                            if (JSON.stringify(t1[CHILD_NODES][toGroup + j]) !== JSON.stringify(t1[CHILD_NODES][i + j])) {

                                destinationDifferent = true;
                            }

                        }
                        if (destinationDifferent) {
                            k = {};
                            k[ACTION] = RELOCATE_GROUP;
                            k[GROUP] = group;
                            k[FROM] = i;
                            k[TO] = toGroup;
                            k[ROUTE] = route;
                            diff = new Diff(k);
                            return [diff];
                        }
                    }
                }
            }
            return [];
        },
        // ===== Apply a virtual diff =====

        applyVirtual: function(tree, diffs) {
            var dobj = this;
            if (diffs.length === 0) {
                return true;
            }
            diffs.forEach(function(diff) {
                if (!dobj.applyVirtualDiff(tree, diff)) {
                    return false;
                }
            });
            return true;
        },
        getFromVirtualRoute: function(tree, route) {
            route = route.slice();
            var c, node = tree,
                parentNode, nodeIndex;
            while (route.length > 0) {
                if (!node[CHILD_NODES]) {
                    return false;
                }
                c = route.splice(0, 1)[0];
                parentNode = node;
                node = node[CHILD_NODES][c];
                nodeIndex = c;
            }
            return {
                node: node,
                parentNode: parentNode,
                nodeIndex: nodeIndex
            };
        },
        applyVirtualDiff: function(tree, diff) {
            var routeInfo = this.getFromVirtualRoute(tree, diff[ROUTE]),
                node = routeInfo.node,
                parentNode = routeInfo.parentNode,
                nodeIndex = routeInfo.nodeIndex,
                newNode, route, group, from, to, c, i;

            switch (diff[ACTION]) {
                case ADD_ATTRIBUTE:
                    if (!node[ATTRIBUTES]) {
                        node[ATTRIBUTES] = {};
                    }

                    node[ATTRIBUTES][diff[NAME]] = diff[VALUE];

                    if (diff[NAME] === 'checked') {
                        node[CHECKED] = true;
                        //    console.log(node)
                    } else if (diff[NAME] === 'selected') {
                        node[SELECTED] = true;
                    } else if (node[NODE_NAME] === 'INPUT' && diff[NAME] === 'value') {
                        node[VALUE] = diff[VALUE];
                    }

                    break;
                case MODIFY_ATTRIBUTE:
                    node[ATTRIBUTES][diff[NAME]] = diff[NEW_VALUE];
                    if (node[NODE_NAME] === 'INPUT' && diff[NAME] === 'value') {
                        node[VALUE] = diff[VALUE];
                    }
                    break;
                case REMOVE_ATTRIBUTE:

                    delete node[ATTRIBUTES][diff[NAME]];

                    if (diff[NAME] === 'checked') {
                        delete node[CHECKED];
                    } else if (diff[NAME] === 'selected') {
                        delete node[SELECTED];
                    } else if (node[NODE_NAME] === 'INPUT' && diff[NAME] === 'value') {
                        delete node[VALUE];
                    }

                    break;
                case MODIFY_TEXT_ELEMENT:
                    node[DATA] = diff[NEW_VALUE];

                    if (parentNode[NODE_NAME] === 'TEXTAREA') {
                        parentNode[VALUE] = diff[NEW_VALUE];
                    }
                    break;
                case MODIFY_VALUE:
                    node[VALUE] = diff[NEW_VALUE];
                    break;
                case MODIFY_DATA:
                    node[DATA] = diff[NEW_VALUE];
                    break;
                case MODIFY_CHECKED:
                    node[CHECKED] = diff[NEW_VALUE];
                    break;
                case MODIFY_SELECTED:
                    node[SELECTED] = diff[NEW_VALUE];
                    break;
                case REPLACE_ELEMENT:
                    parentNode[CHILD_NODES][nodeIndex] = diff[NEW_VALUE];
                    break;
                case RELOCATE_GROUP:

                    group = diff[GROUP];
                    from = diff[FROM];
                    to = diff[TO];
                    console.log(node[CHILD_NODES]);
                    console.log([from, to]);
                    if (from < to) {
                        console.log(JSON.stringify(node[CHILD_NODES][0]));

                        for (i = 0; i < group.length; i += 1) {
                            newNode = node[CHILD_NODES].splice(from, 1)[0];
                            node[CHILD_NODES].splice((to + group.length - 1), 0, newNode);
                        }
                        console.log(JSON.stringify(node[CHILD_NODES][0]));
                    } else {
                        for (i = 0; i < group.length; i += 1) {
                            node[CHILD_NODES].splice((to + i), 0, node[CHILD_NODES].splice((from + i), 1)[0]);
                        }
                    }
                    break;
                case REMOVE_ELEMENT:
                    parentNode[CHILD_NODES].splice(nodeIndex, 1);
                    break;
                case ADD_ELEMENT:
                    route = diff[ROUTE].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    node = this.getFromVirtualRoute(tree, route).node;
                    newNode = diff[ELEMENT]; //objToNode(diff[ELEMENT]);

                    if (!node[CHILD_NODES]) {
                        node[CHILD_NODES] = [];
                    }

                    if (c >= node[CHILD_NODES].length) {
                        node[CHILD_NODES].push(newNode);
                    } else {
                        node[CHILD_NODES].splice(c, 0, newNode);

                    }
                    break;
                case REMOVE_TEXT_ELEMENT:
                    parentNode[CHILD_NODES].splice(nodeIndex, 1);
                    if (parentNode[NODE_NAME] === 'TEXTAREA') {
                        delete parentNode[VALUE];
                    }
                    break;
                case ADD_TEXT_ELEMENT:
                    route = diff[ROUTE].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    newNode = {};
                    newNode[NODE_TYPE] = 3;
                    newNode[DATA] = diff[VALUE];
                    node = this.getFromVirtualRoute(tree, route).node;
                    if (!node[CHILD_NODES]) {
                        node[CHILD_NODES] = [];
                    }

                    if (c >= node[CHILD_NODES].length) {
                        node[CHILD_NODES].push(newNode);
                    } else {
                        node[CHILD_NODES].splice(c, 0, newNode);
                    }
                    if (node[NODE_NAME] === 'TEXTAREA') {
                        node[VALUE] = diff[NEW_VALUE];
                    }
                    break;
                default:
                    console.log('unknown action');
            }

            return true;
        },




        // ===== Apply a diff =====

        apply: function(tree, diffs) {
            var dobj = this;

            if (diffs.length === 0) {
                return true;
            }
            diffs.forEach(function(diff) {
                if (!dobj.applyDiff(tree, diff)) {
                    return false;
                }
            });
            return true;
        },
        getFromRoute: function(tree, route) {
            route = route.slice();
            var c, node = tree;
            while (route.length > 0) {
                if (!node.childNodes) {
                    return false;
                }
                c = route.splice(0, 1)[0];
                node = node.childNodes[c];
            }
            return node;
        },
        applyDiff: function(tree, diff) {
            var node = this.getFromRoute(tree, diff[ROUTE]),
                newNode, reference, route, group, from, to, child, c, i;

            switch (diff[ACTION]) {
                case ADD_ATTRIBUTE:
                    if (!node || !node.setAttribute) {
                        return false;
                    }
                    node.setAttribute(diff[NAME], diff[VALUE]);
                    break;
                case MODIFY_ATTRIBUTE:
                    if (!node || !node.setAttribute) {
                        return false;
                    }
                    node.setAttribute(diff[NAME], diff[NEW_VALUE]);
                    break;
                case REMOVE_ATTRIBUTE:
                    if (!node || !node.removeAttribute) {
                        return false;
                    }
                    node.removeAttribute(diff[NAME]);
                    break;
                case MODIFY_TEXT_ELEMENT:
                    if (!node || node.nodeType !== 3) {
                        return false;
                    }
                    this.textDiff(node, node.data, diff[OLD_VALUE], diff[NEW_VALUE]);
                    break;
                case MODIFY_VALUE:
                    if (!node || typeof node.value === 'undefined') {
                        return false;
                    }
                    node.value = diff[NEW_VALUE];
                    break;
                case MODIFY_DATA:
                    if (!node || typeof node.data === 'undefined') {
                        return false;
                    }
                    node.data = diff[NEW_VALUE];
                    break;
                case MODIFY_CHECKED:
                    if (!node || typeof node.checked === 'undefined') {
                        return false;
                    }
                    node.checked = diff[NEW_VALUE];
                    break;
                case MODIFY_SELECTED:
                    if (!node || typeof node.selected === 'undefined') {
                        return false;
                    }
                    node.selected = diff[NEW_VALUE];
                    break;
                case REPLACE_ELEMENT:
                    newNode = objToNode(diff[NEW_VALUE]);
                    node.parentNode.replaceChild(newNode, node);
                    break;
                case RELOCATE_GROUP:
                    group = diff[GROUP];
                    from = diff[FROM];
                    to = diff[TO];
                    reference = node.childNodes[to + group.length];
                    // slide elements up
                    if (from < to) {
                        for (i = 0; i < group.length; i += 1) {
                            child = node.childNodes[from];
                            node.insertBefore(child, reference);
                        }
                    } else {
                        // slide elements down
                        reference = node.childNodes[to];
                        for (i = 0; i < group.length; i += 1) {
                            child = node.childNodes[from + i];
                            node.insertBefore(child, reference);
                        }
                    }
                    break;
                case REMOVE_ELEMENT:
                    node.parentNode.removeChild(node);
                    break;
                case ADD_ELEMENT:
                    route = diff[ROUTE].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    node = this.getFromRoute(tree, route);
                    newNode = objToNode(diff[ELEMENT]);
                    if (c >= node.childNodes.length) {
                        node.appendChild(newNode);
                    } else {
                        reference = node.childNodes[c];
                        node.insertBefore(newNode, reference);
                    }
                    break;
                case REMOVE_TEXT_ELEMENT:
                    if (!node || node.nodeType !== 3) {
                        return false;
                    }
                    node.parentNode.removeChild(node);
                    break;
                case ADD_TEXT_ELEMENT:
                    route = diff[ROUTE].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    newNode = document.createTextNode(diff[VALUE]);
                    node = this.getFromRoute(tree, route);
                    if (!node || !node.childNodes) {
                        return false;
                    }
                    if (c >= node.childNodes.length) {
                        node.appendChild(newNode);
                    } else {
                        reference = node.childNodes[c];
                        node.insertBefore(newNode, reference);
                    }
                    break;
                default:
                    console.log('unknown action');
            }

            return true;
        },

        // ===== Undo a diff =====

        undo: function(tree, diffs) {
            diffs = diffs.slice();
            var dobj = this;
            if (!diffs.length) {
                diffs = [diffs];
            }
            diffs.reverse();
            diffs.forEach(function(diff) {
                dobj.undoDiff(tree, diff);
            });
        },
        undoDiff: function(tree, diff) {

            switch (diff[ACTION]) {
                case ADD_ATTRIBUTE:
                    diff[ACTION] = REMOVE_ATTRIBUTE;
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_ATTRIBUTE:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case REMOVE_ATTRIBUTE:
                    diff[ACTION] = ADD_ATTRIBUTE;
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_TEXT_ELEMENT:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_VALUE:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_DATA:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_CHECKED:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case MODIFY_SELECTED:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case REPLACE_ELEMENT:
                    swap(diff, OLD_VALUE, NEW_VALUE);
                    this.applyDiff(tree, diff);
                    break;
                case RELOCATE_GROUP:
                    swap(diff, FROM, TO);
                    this.applyDiff(tree, diff);
                    break;
                case REMOVE_ELEMENT:
                    diff[ACTION] = ADD_ELEMENT;
                    this.applyDiff(tree, diff);
                    break;
                case ADD_ELEMENT:
                    diff[ACTION] = REMOVE_ELEMENT;
                    this.applyDiff(tree, diff);
                    break;
                case REMOVE_TEXT_ELEMENT:
                    diff[ACTION] = ADD_TEXT_ELEMENT;
                    this.applyDiff(tree, diff);
                    break;
                case ADD_TEXT_ELEMENT:
                    diff[ACTION] = REMOVE_TEXT_ELEMENT;
                    this.applyDiff(tree, diff);
                    break;
                default:
                    console.log('unknown action');
            }

        }
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = diffDOM;
        }
        exports.diffDOM = diffDOM;
    } else {
        // `window` in the browser, or `exports` on the server
        this.diffDOM = diffDOM;
    }

}.call(this));
