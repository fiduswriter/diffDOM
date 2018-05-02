(function(root, factory) {
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = factory();
        } else {
            exports.diffDOM = factory();
        }
    } else if (typeof define === 'function') {
        // AMD loader
        define(factory);
    } else {
        // `window` in the browser, or `exports` on the server
        root.diffDOM = factory();
    }
})(this, function() {
    "use strict";

    var diffcount, foundAll = false;

    var Diff = function(options) {
        var diff = this;
        if (options) {
            var keys = Object.keys(options),
                length = keys.length,
                i;
            for (i = 0; i < length; i++) {
                diff[keys[i]] = options[keys[i]];
            }
        }

    };

    Diff.prototype = {
        toString: function() {
            return JSON.stringify(this);
        },
        setValue: function(aKey, aValue) {
            this[aKey] = aValue;
            return this;
        }
    };



    var elementDescriptors = function(el) {
        var output = [];
        if (el.nodeName !== '#text' && el.nodeName !== '#comment') {
            output.push(el.nodeName);
            if (el.attributes) {
                if (el.attributes['class']) {
                    output.push(el.nodeName + '.' + el.attributes['class'].replace(/ /g, '.'));
                }
                if (el.attributes.id) {
                    output.push(el.nodeName + '#' + el.attributes.id);
                }
            }

        }
        return output;
    };

    var findUniqueDescriptors = function(li) {
        var uniqueDescriptors = {},
            duplicateDescriptors = {},
            liLength = li.length,
            nodeLength, node, descriptors, descriptor, inUnique, inDupes, i, j;

        for (i = 0; i < liLength; i++) {
            node = li[i];
            nodeLength = node.length;
            descriptors = elementDescriptors(node);
            for (j = 0; j < nodeLength; j++) {
                descriptor = descriptors[j];
                inUnique = descriptor in uniqueDescriptors;
                inDupes = descriptor in duplicateDescriptors;
                if (!inUnique && !inDupes) {
                    uniqueDescriptors[descriptor] = true;
                } else if (inUnique) {
                    delete uniqueDescriptors[descriptor];
                    duplicateDescriptors[descriptor] = true;
                }
            }
        }

        return uniqueDescriptors;
    };

    var uniqueInBoth = function(l1, l2) {
        var l1Unique = findUniqueDescriptors(l1),
            l2Unique = findUniqueDescriptors(l2),
            inBoth = {},
            keys = Object.keys(l1Unique),
            length = keys.length,
            key,
            i;

        for (i = 0; i < length; i++) {
            key = keys[i];
            if (l2Unique[key]) {
                inBoth[key] = true;
            }
        }

        return inBoth;
    };

    var removeDone = function(tree) {
        delete tree.outerDone;
        delete tree.innerDone;
        delete tree.valueDone;
        if (tree.childNodes) {
            return tree.childNodes.every(removeDone);
        } else {
            return true;
        }
    };

    var isEqual = function(e1, e2) {

        var e1Attributes, e2Attributes;

        if (!['nodeName', 'value', 'checked', 'selected', 'data'].every(function(element) {
                if (e1[element] !== e2[element]) {
                    return false;
                }
                return true;
            })) {
            return false;
        }

        if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
            return false;
        }

        if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
            return false;
        }
        if (e1.attributes) {
            e1Attributes = Object.keys(e1.attributes);
            e2Attributes = Object.keys(e2.attributes);

            if (e1Attributes.length !== e2Attributes.length) {
                return false;
            }
            if (!e1Attributes.every(function(attribute) {
                    if (e1.attributes[attribute] !== e2.attributes[attribute]) {
                        return false;
                    }
                    return true;
                })) {
                return false;
            }
        }
        if (e1.childNodes) {
            if (e1.childNodes.length !== e2.childNodes.length) {
                return false;
            }
            if (!e1.childNodes.every(function(childNode, index) {
                    return isEqual(childNode, e2.childNodes[index]);
                })) {

                return false;
            }

        }

        return true;

    };


    var roughlyEqual = function(e1, e2, uniqueDescriptors, sameSiblings, preventRecursion) {
        var childUniqueDescriptors, nodeList1, nodeList2;

        if (!e1 || !e2) {
            return false;
        }

        if (e1.nodeName !== e2.nodeName) {
            return false;
        }

        if (e1.nodeName === '#text') {
            // Note that we initially don't care what the text content of a node is,
            // the mere fact that it's the same tag and "has text" means it's roughly
            // equal, and then we can find out the true text difference later.
            return preventRecursion ? true : e1.data === e2.data;
        }


        if (e1.nodeName in uniqueDescriptors) {
            return true;
        }

        if (e1.attributes && e2.attributes) {

            if (e1.attributes.id) {
                if (e1.attributes.id !== e2.attributes.id) {
                    return false;
                } else {
                    var idDescriptor = e1.nodeName + '#' + e1.attributes.id;
                    if (idDescriptor in uniqueDescriptors) {
                        return true;
                    }
                }
            }
            if (e1.attributes['class'] && e1.attributes['class'] === e2.attributes['class']) {
                var classDescriptor = e1.nodeName + '.' + e1.attributes['class'].replace(/ /g, '.');
                if (classDescriptor in uniqueDescriptors) {
                    return true;
                }
            }
        }

        if (sameSiblings) {
            return true;
        }

        nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : [];
        nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : [];

        if (nodeList1.length !== nodeList2.length) {
            return false;
        }

        if (preventRecursion) {
            return nodeList1.every(function(element, index) {
                return element.nodeName === nodeList2[index].nodeName;
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
        //  TODO: Do we really need to clone here? Is it not enough to just return the original object?
        return JSON.parse(JSON.stringify(obj));
    };

    /**
     * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
     */
    var findCommonSubsets = function(c1, c2, marked1, marked2) {
        var lcsSize = 0,
            index = [],
            c1Length = c1.length,
            c2Length = c2.length,
            matches = Array.apply(null, new Array(c1Length + 1)).map(function() {
                return [];
            }), // set up the matching table
            uniqueDescriptors = uniqueInBoth(c1, c2),
            // If all of the elements are the same tag, id and class, then we can
            // consider them roughly the same even if they have a different number of
            // children. This will reduce removing and re-adding similar elements.
            subsetsSame = c1Length === c2Length,
            origin, ret, c1Index, c2Index, c1Element, c2Element;

        if (subsetsSame) {

            c1.some(function(element, i) {
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
        for (c1Index = 0; c1Index < c1Length; c1Index++) {
            c1Element = c1[c1Index];
            for (c2Index = 0; c2Index < c2Length; c2Index++) {
                c2Element = c2[c2Index];
                if (!marked1[c1Index] && !marked2[c2Index] && roughlyEqual(c1Element, c2Element, uniqueDescriptors, subsetsSame)) {
                    matches[c1Index + 1][c2Index + 1] = (matches[c1Index][c2Index] ? matches[c1Index][c2Index] + 1 : 1);
                    if (matches[c1Index + 1][c2Index + 1] >= lcsSize) {
                        lcsSize = matches[c1Index + 1][c2Index + 1];
                        index = [c1Index + 1, c2Index + 1];
                    }
                } else {
                    matches[c1Index + 1][c2Index + 1] = 0;
                }
            }
        }

        if (lcsSize === 0) {
            return false;
        }

        return {
            oldValue: index[0] - lcsSize,
            newValue: index[1] - lcsSize,
            length: lcsSize
        };
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
     *
     * So if t1 = <img><canvas><br>, t2 = <canvas><br><img>.
     * The longest subset is "<canvas><br>" (length 2), so it will group 0.
     * The second longest is "<img>" (length 1), so it will be group 1.
     * gaps1 will therefore be [1,0,0] and gaps2 [0,0,1].
     *
     * If an element is not part of any group, it will stay being 'true', which
     * is the initial value. For example:
     * t1 = <img><p></p><br><canvas>, t2 = <b></b><br><canvas><img>
     *
     * The "<p></p>" and "<b></b>" do only show up in one of the two and will
     * therefore be marked by "true". The remaining parts are parts of the
     * groups 0 and 1:
     * gaps1 = [1, true, 0, 0], gaps2 = [true, 0, 0, 1]
     *
     */
    var getGapInformation = function(t1, t2, stable) {

        var gaps1 = t1.childNodes ? makeArray(t1.childNodes.length, true) : [],
            gaps2 = t2.childNodes ? makeArray(t2.childNodes.length, true) : [],
            group = 0,
            length = stable.length,
            i, j, endOld, endNew, subset;

        // give elements from the same subset the same group number
        for (i = 0; i < length; i++) {
            subset = stable[i];
            endOld = subset.oldValue + subset.length;
            endNew = subset.newValue + subset.length;
            for (j = subset.oldValue; j < endOld; j += 1) {
                gaps1[j] = group;
            }
            for (j = subset.newValue; j < endNew; j += 1) {
                gaps2[j] = group;
            }
            group += 1;
        }

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
        var oldChildren = oldTree.childNodes ? oldTree.childNodes : [],
            newChildren = newTree.childNodes ? newTree.childNodes : [],
            marked1 = makeArray(oldChildren.length, false),
            marked2 = makeArray(newChildren.length, false),
            subsets = [],
            subset = true,
            returnIndex = function() {
                return arguments[1];
            },
            markBoth = function(i) {
                marked1[subset.oldValue + i] = true;
                marked2[subset.newValue + i] = true;
            },
            length, subsetArray, i;

        while (subset) {
            subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
            if (subset) {
                subsets.push(subset);
                subsetArray = Array.apply(null, new Array(subset.length)).map(returnIndex);
                length = subsetArray.length;
                for (i = 0; i < length; i++) {
                    markBoth(subsetArray[i]);
                }
            }
        }

        oldTree.subsets = subsets;
        oldTree.subsetsAge = 100;
        return subsets;
    };


    function swap(obj, p1, p2) {
        var tmp = obj[p1];
        obj[p1] = obj[p2];
        obj[p2] = tmp;
    }


    var DiffTracker = function() {
        this.list = [];
    };

    DiffTracker.prototype = {
        list: false,
        add: function(diffs) {
            this.list.push.apply(this.list, diffs);
        },
        forEach: function(fn) {
            var length = this.list.length,
                i;
            for (i = 0; i < length; i++) {
                fn(this.list[i]);
            }
        }
    };

    var diffDOM = function(options) {

        var defaults = {
                debug: false,
                diffcap: 10, // Limit for how many diffs are accepting when debugging. Inactive when debug is false.
                maxDepth: false, // False or a numeral. If set to a numeral, limits the level of depth that the the diff mechanism looks for differences. If false, goes through the entire tree.
                maxChildCount: 50, // False or a numeral. If set to a numeral, does not try to diff the contents of nodes with more children if there are more than maxChildDiffCount differences among child nodes.
                maxChildDiffCount: 3, // Numeral. See maxChildCount.
                valueDiffing: true, // Whether to take into consideration the values of forms that differ from auto assigned values (when a user fills out a form).
                // syntax: textDiff: function (node, currentValue, expectedValue, newValue)
                textDiff: function() {
                    arguments[0].data = arguments[3];
                    return;
                },
                // empty functions were benchmarked as running faster than both
                // `f && f()` and `if (f) { f(); }`
                preVirtualDiffApply: function() {},
                postVirtualDiffApply: function() {},
                preDiffApply: function() {},
                postDiffApply: function() {},
                filterOuterDiff: null,
                compress: false // Whether to work with compressed diffs
            },
            varNames, i, j;

        if (typeof options === "undefined") {
            options = {};
        }

        for (i in defaults) {
            if (typeof options[i] === "undefined") {
                this[i] = defaults[i];
            } else {
                this[i] = options[i];
            }
        }

        var varNames = {
            'addAttribute': 'addAttribute',
            'modifyAttribute': 'modifyAttribute',
            'removeAttribute': 'removeAttribute',
            'modifyTextElement': 'modifyTextElement',
            'relocateGroup': 'relocateGroup',
            'removeElement': 'removeElement',
            'addElement': 'addElement',
            'removeTextElement': 'removeTextElement',
            'addTextElement': 'addTextElement',
            'replaceElement': 'replaceElement',
            'modifyValue': 'modifyValue',
            'modifyChecked': 'modifyChecked',
            'modifySelected': 'modifySelected',
            'modifyComment': 'modifyComment',
            'action': 'action',
            'route': 'route',
            'oldValue': 'oldValue',
            'newValue': 'newValue',
            'element': 'element',
            'group': 'group',
            'from': 'from',
            'to': 'to',
            'name': 'name',
            'value': 'value',
            'data': 'data',
            'attributes': 'attributes',
            'nodeName': 'nodeName',
            'childNodes': 'childNodes',
            'checked': 'checked',
            'selected': 'selected'
        };

        if (this.compress) {
            j = 0;
            this._const = {};
            for (i in varNames) {
                this._const[i] = j;
                j++;
            }
        } else {
            this._const = varNames;
        }
    };

    diffDOM.Diff = Diff;

    diffDOM.prototype = {

        // ===== Create a diff =====

        diff: function(t1Node, t2Node) {

            var t1 = this.nodeToObj(t1Node),
                t2 = this.nodeToObj(t2Node);

            diffcount = 0;

            if (this.debug) {
                this.t1Orig = this.nodeToObj(t1Node);
                this.t2Orig = this.nodeToObj(t2Node);
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
                        window.diffError = [this.t1Orig, this.t2Orig];
                        throw new Error("surpassed diffcap:" + JSON.stringify(this.t1Orig) + " -> " + JSON.stringify(this.t2Orig));
                    }
                }
                diffs = this.findNextDiff(t1, t2, []);

                if (diffs.length === 0) {
                    // Last check if the elements really are the same now.
                    // If not, remove all info about being done and start over.
                    // Sometimes a node can be marked as done, but the creation of subsequent diffs means that it has to be changed again.
                    if (!isEqual(t1, t2)) {
                        if (foundAll) {
                            console.error('Could not find remaining diffs!');
                            console.log({t1, t2});
                        } else {
                            foundAll = true;
                            removeDone(t1);
                            diffs = this.findNextDiff(t1, t2, []);
                        }
                    }
                }
                if (diffs.length > 0) {
                    foundAll = false
                    this.tracker.add(diffs);
                    this.applyVirtual(t1, diffs);
                }
            } while (diffs.length > 0);
            return this.tracker.list;
        },
        findNextDiff: function(t1, t2, route) {
            var diffs, fdiffs;

            if (this.maxDepth && route.length > this.maxDepth) {
                return [];
            }
            // outer differences?
            if (!t1.outerDone) {
                diffs = this.findOuterDiff(t1, t2, route);
                if (this.filterOuterDiff) {
                    fdiffs = this.filterOuterDiff(t1, t2, diffs);
                    if (fdiffs) diffs = fdiffs;
                }
                if (diffs.length > 0) {
                    t1.outerDone = true;
                    return diffs;
                } else {
                    t1.outerDone = true;
                }
            }
            // inner differences?
            if (!t1.innerDone) {
                diffs = this.findInnerDiff(t1, t2, route);
                if (diffs.length > 0) {
                    return diffs;
                } else {
                    t1.innerDone = true;
                }
            }

            if (this.valueDiffing && !t1.valueDone) {
                // value differences?
                diffs = this.findValueDiff(t1, t2, route);

                if (diffs.length > 0) {
                    t1.valueDone = true;
                    return diffs;
                } else {
                    t1.valueDone = true;
                }
            }

            // no differences
            return [];
        },
        findOuterDiff: function(t1, t2, route) {
            var t = this;
            var diffs = [],
                attr,
                attr1, attr2, attrLength, pos, i;

            if (t1.nodeName !== t2.nodeName) {
                return [new Diff()
                    .setValue(t._const.action, t._const.replaceElement)
                    .setValue(t._const.oldValue, cloneObj(t1))
                    .setValue(t._const.newValue, cloneObj(t2))
                    .setValue(t._const.route, route)
                ];
            }

            if (route.length && this.maxChildCount && t1.childNodes && t2.childNodes && t1.childNodes.length >  this.maxChildCount && t2.childNodes.length > this.maxChildCount) {
                var childNodesLength = t1.childNodes.length < t2.childNodes.length ? t1.childNodes.length : t2.childNodes.length, childDiffCount = 0,  j = 0;
                while (childDiffCount < this.maxChildDiffCount && j < childNodesLength) {
                    if (!isEqual(t1.childNodes[j], t2.childNodes[j])) {
                        childDiffCount++;
                    }
                    j++;
                }
                if (childDiffCount === this.maxChildDiffCount) {
                    return [new Diff()
                        .setValue(t._const.action, t._const.replaceElement)
                        .setValue(t._const.oldValue, cloneObj(t1))
                        .setValue(t._const.newValue, cloneObj(t2))
                        .setValue(t._const.route, route)
                    ];
                }
            }

            if (t1.data !== t2.data) {
                // Comment or text node.
                if (t1.nodeName === '#text') {
                    return [new Diff()
                        .setValue(t._const.action, t._const.modifyTextElement)
                        .setValue(t._const.route, route)
                        .setValue(t._const.oldValue, t1.data)
                        .setValue(t._const.newValue, t2.data)
                    ];
                } else {
                    return [new Diff()
                        .setValue(t._const.action, t._const.modifyComment)
                        .setValue(t._const.route, route)
                        .setValue(t._const.oldValue, t1.data)
                        .setValue(t._const.newValue, t2.data)
                    ];
                }

            }


            attr1 = t1.attributes ? Object.keys(t1.attributes).sort() : [];
            attr2 = t2.attributes ? Object.keys(t2.attributes).sort() : [];

            attrLength = attr1.length;
            for (i = 0; i < attrLength; i++) {
                attr = attr1[i];
                pos = attr2.indexOf(attr);
                if (pos === -1) {
                    diffs.push(new Diff()
                        .setValue(t._const.action, t._const.removeAttribute)
                        .setValue(t._const.route, route)
                        .setValue(t._const.name, attr)
                        .setValue(t._const.value, t1.attributes[attr])
                    );
                } else {
                    attr2.splice(pos, 1);
                    if (t1.attributes[attr] !== t2.attributes[attr]) {
                        diffs.push(new Diff()
                            .setValue(t._const.action, t._const.modifyAttribute)
                            .setValue(t._const.route, route)
                            .setValue(t._const.name, attr)
                            .setValue(t._const.oldValue, t1.attributes[attr])
                            .setValue(t._const.newValue, t2.attributes[attr])
                        );
                    }
                }
            }

            attrLength = attr2.length;
            for (i = 0; i < attrLength; i++) {
                attr = attr2[i];
                diffs.push(new Diff()
                    .setValue(t._const.action, t._const.addAttribute)
                    .setValue(t._const.route, route)
                    .setValue(t._const.name, attr)
                    .setValue(t._const.value, t2.attributes[attr])
                );
            }

            return diffs;
        },
        nodeToObj: function(aNode) {
            var objNode = {},
                dobj = this,
                nodeArray, childNode, length, attribute, i;
            objNode.nodeName = aNode.nodeName;
            if (objNode.nodeName === '#text' || objNode.nodeName === '#comment') {
                objNode.data = aNode.data;
            } else {
                if (aNode.attributes && aNode.attributes.length > 0) {
                    objNode.attributes = {};
                    nodeArray = Array.prototype.slice.call(aNode.attributes);
                    length = nodeArray.length;
                    for (i = 0; i < length; i++) {
                        attribute = nodeArray[i];
                        objNode.attributes[attribute.name] = attribute.value;
                    }
                }
                if (objNode.nodeName === 'TEXTAREA') {
                    objNode.value = aNode.value;
                } else if (aNode.childNodes && aNode.childNodes.length > 0) {
                    objNode.childNodes = [];
                    nodeArray = Array.prototype.slice.call(aNode.childNodes);
                    length = nodeArray.length;
                    for (i = 0; i < length; i++) {
                        childNode = nodeArray[i];
                        objNode.childNodes.push(dobj.nodeToObj(childNode));
                    }
                }
                if (this.valueDiffing) {
                    if (aNode.checked !== undefined && aNode.type &&
                        ['radio','checkbox'].indexOf(aNode.type.toLowerCase()) !== -1
                    ) {
                        objNode.checked = aNode.checked;
                    } else if (aNode.value !== undefined) {
                        objNode.value = aNode.value;
                    }
                    if (aNode.selected !== undefined) {
                        objNode.selected = aNode.selected;
                    }
                }
            }
            return objNode;
        },
        objToNode: function(objNode, insideSvg) {
            var node, dobj = this,
                attribute, attributeArray, childNode, childNodeArray, length, i;
            if (objNode.nodeName === '#text') {
                node = document.createTextNode(objNode.data);

            } else if (objNode.nodeName === '#comment') {
                node = document.createComment(objNode.data);
            } else {
                if (objNode.nodeName === 'svg' || insideSvg) {
                    node = document.createElementNS('http://www.w3.org/2000/svg', objNode.nodeName);
                    insideSvg = true;
                } else {
                    node = document.createElement(objNode.nodeName);
                }
                if (objNode.attributes) {
                    attributeArray = Object.keys(objNode.attributes);
                    length = attributeArray.length;
                    for (i = 0; i < length; i++) {
                        attribute = attributeArray[i];
                        node.setAttribute(attribute, objNode.attributes[attribute]);
                    }
                }
                if (objNode.childNodes) {
                    childNodeArray = objNode.childNodes;
                    length = childNodeArray.length;
                    for (i = 0; i < length; i++) {
                        childNode = childNodeArray[i];
                        node.appendChild(dobj.objToNode(childNode, insideSvg));
                    }
                }
                if (this.valueDiffing) {
                    if (objNode.value) {
                        node.value = objNode.value;
                    }
                    if (objNode.checked) {
                        node.checked = objNode.checked;
                    }
                    if (objNode.selected) {
                        node.selected = objNode.selected;
                    }
                }
            }
            return node;
        },
        findInnerDiff: function(t1, t2, route) {
            var oldSubsets = t1.subsets;
            //var subtrees = (t1.childNodes && t2.childNodes) ?  markSubTrees(t1, t2) : [],
            var subtrees = t1.subsets && t1.subsetsAge-- ? t1.subsets : (t1.childNodes && t2.childNodes) ?  markSubTrees(t1, t2) : [],
                t1ChildNodes = t1.childNodes ? t1.childNodes : [],
                t2ChildNodes = t2.childNodes ? t2.childNodes : [],
                childNodesLengthDifference, diffs = [],
                index = 0, t = this,
                last, e1, e2, i;

            if (subtrees.length > 0) {
                /* One or more groups have been identified among the childnodes of t1
                 * and t2.
                 */
                diffs = this.attemptGroupRelocation(t1, t2, subtrees, route);
                if (diffs.length > 0) {
                    return diffs;
                }
            }

            /* 0 or 1 groups of similar child nodes have been found
             * for t1 and t2. 1 If there is 1, it could be a sign that the
             * contents are the same. When the number of groups is below 2,
             * t1 and t2 are made to have the same length and each of the
             * pairs of child nodes are diffed.
             */


            last = Math.max(t1ChildNodes.length, t2ChildNodes.length);
            if (t1ChildNodes.length !== t2ChildNodes.length) {
                childNodesLengthDifference = true;
            }

            for (i = 0; i < last; i += 1) {
                e1 = t1ChildNodes[i];
                e2 = t2ChildNodes[i];

                if (childNodesLengthDifference) {
                    /* t1 and t2 have different amounts of childNodes. Add
                     * and remove as necessary to obtain the same length */
                    if (e1 && !e2) {
                        if (e1.nodeName === '#text') {
                            diffs.push(new Diff()
                                .setValue(t._const.action, t._const.removeTextElement)
                                .setValue(t._const.route, route.concat(index))
                                .setValue(t._const.value, e1.data)
                            );
                            index -= 1;
                        } else {
                            diffs.push(new Diff()
                                .setValue(t._const.action, t._const.removeElement)
                                .setValue(t._const.route, route.concat(index))
                                .setValue(t._const.element, cloneObj(e1))
                            );
                            index -= 1;
                        }

                    } else if (e2 && !e1) {
                        if (e2.nodeName === '#text') {
                            diffs.push(new Diff()
                                .setValue(t._const.action, t._const.addTextElement)
                                .setValue(t._const.route, route.concat(index))
                                .setValue(t._const.value, e2.data)
                            );
                        } else {
                            diffs.push(new Diff()
                                .setValue(t._const.action, t._const.addElement)
                                .setValue(t._const.route, route.concat(index))
                                .setValue(t._const.element, cloneObj(e2))
                            );
                        }
                    }
                }
                /* We are now guaranteed that childNodes e1 and e2 exist,
                 * and that they can be diffed.
                 */
                /* Diffs in child nodes should not affect the parent node,
                 * so we let these diffs be submitted together with other
                 * diffs.
                 */

                if (e1 && e2) {
                    diffs = diffs.concat(this.findNextDiff(e1, e2, route.concat(index)));
                }

                index += 1;

            }
            t1.innerDone = true;
            return diffs;

        },

        attemptGroupRelocation: function(t1, t2, subtrees, route) {
            /* Either t1.childNodes and t2.childNodes have the same length, or
             * there are at least two groups of similar elements can be found.
             * attempts are made at equalizing t1 with t2. First all initial
             * elements with no group affiliation (gaps=true) are removed (if
             * only in t1) or added (if only in t2). Then the creation of a group
             * relocation diff is attempted.
             */
            var t = this;
            var gapInformation = getGapInformation(t1, t2, subtrees),
                gaps1 = gapInformation.gaps1,
                gaps2 = gapInformation.gaps2,
                shortest = Math.min(gaps1.length, gaps2.length),
                destinationDifferent, toGroup,
                group, node, similarNode, testI, diffs = [],
                index1, index2, j;


            for (index2 = 0, index1 = 0; index2 < shortest; index1 += 1, index2 += 1) {
                if (gaps1[index2] === true) {
                    node = t1.childNodes[index1];
                    if (node.nodeName === '#text') {
                        if (t2.childNodes[index2].nodeName === '#text' && node.data !== t2.childNodes[index2].data) {
                            testI = index1;
                            while (t1.childNodes.length > testI + 1 && t1.childNodes[testI + 1].nodeName === '#text') {
                                testI += 1;
                                if (t2.childNodes[index2].data === t1.childNodes[testI].data) {
                                    similarNode = true;
                                    break;
                                }
                            }
                            if (!similarNode) {
                                diffs.push(new Diff()
                                    .setValue(t._const.action, t._const.modifyTextElement)
                                    .setValue(t._const.route, route.concat(index2))
                                    .setValue(t._const.oldValue, node.data)
                                    .setValue(t._const.newValue, t2.childNodes[index2].data)
                                );
                                return diffs;
                            }
                        }
                        diffs.push(new Diff()
                            .setValue(t._const.action, t._const.removeTextElement)
                            .setValue(t._const.route, route.concat(index2))
                            .setValue(t._const.value, node.data)
                        );
                        gaps1.splice(index2, 1);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index2 -= 1;
                    } else {
                        diffs.push(new Diff()
                            .setValue(t._const.action, t._const.removeElement)
                            .setValue(t._const.route, route.concat(index2))
                            .setValue(t._const.element, cloneObj(node))
                        );
                        gaps1.splice(index2, 1);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index2 -= 1;
                    }

                } else if (gaps2[index2] === true) {
                    node = t2.childNodes[index2];
                    if (node.nodeName === '#text') {
                        diffs.push(new Diff()
                            .setValue(t._const.action, t._const.addTextElement)
                            .setValue(t._const.route, route.concat(index2))
                            .setValue(t._const.value, node.data)
                        );
                        gaps1.splice(index2, 0, true);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index1 -= 1;
                    } else {
                        diffs.push(new Diff()
                            .setValue(t._const.action, t._const.addElement)
                            .setValue(t._const.route, route.concat(index2))
                            .setValue(t._const.element, cloneObj(node))
                        );
                        gaps1.splice(index2, 0, true);
                        shortest = Math.min(gaps1.length, gaps2.length);
                        index1 -= 1;
                    }

                } else if (gaps1[index2] !== gaps2[index2]) {
                    if (diffs.length > 0) {
                        return diffs;
                    }
                    // group relocation
                    group = subtrees[gaps1[index2]];
                    toGroup = Math.min(group.newValue, (t1.childNodes.length - group.length));
                    if (toGroup !== group.oldValue) {
                        // Check whether destination nodes are different than originating ones.
                        destinationDifferent = false;
                        for (j = 0; j < group.length; j += 1) {
                            if (!roughlyEqual(t1.childNodes[toGroup + j], t1.childNodes[group.oldValue + j], [], false, true)) {
                                destinationDifferent = true;
                            }
                        }
                        if (destinationDifferent) {
                            return [new Diff()
                                .setValue(t._const.action, t._const.relocateGroup)
                                .setValue('groupLength', group.length)
                                .setValue(t._const.from, group.oldValue)
                                .setValue(t._const.to, toGroup)
                                .setValue(t._const.route, route)
                            ];
                        }
                    }
                }
            }
            return diffs;
        },

        findValueDiff: function(t1, t2, route) {
            // Differences of value. Only useful if the value/selection/checked value
            // differs from what is represented in the DOM. For example in the case
            // of filled out forms, etc.
            var diffs = [];
            var t = this;

            if (t1.selected !== t2.selected) {
                diffs.push(new Diff()
                    .setValue(t._const.action, t._const.modifySelected)
                    .setValue(t._const.oldValue, t1.selected)
                    .setValue(t._const.newValue, t2.selected)
                    .setValue(t._const.route, route)
                );
            }

            if ((t1.value || t2.value) && t1.value !== t2.value && t1.nodeName !== 'OPTION') {
                diffs.push(new Diff()
                    .setValue(t._const.action, t._const.modifyValue)
                    .setValue(t._const.oldValue, t1.value)
                    .setValue(t._const.newValue, t2.value)
                    .setValue(t._const.route, route)
                );
            }
            if (t1.checked !== t2.checked) {
                diffs.push(new Diff()
                    .setValue(t._const.action, t._const.modifyChecked)
                    .setValue(t._const.oldValue, t1.checked)
                    .setValue(t._const.newValue, t2.checked)
                    .setValue(t._const.route, route)
                );
            }

            return diffs;
        },

        // ===== Apply a virtual diff =====

        applyVirtual: function(tree, diffs) {
            var dobj = this,
                length = diffs.length,
                diff, i;
            if (length === 0) {
                return true;
            }
            for (i = 0; i < length; i++) {
                diff = diffs[i];
                dobj.applyVirtualDiff(tree, diff);
            }
            return true;
        },
        getFromVirtualRoute: function(tree, route) {
            var node = tree,
                parentNode, nodeIndex;

            route = route.slice();
            while (route.length > 0) {
                if (!node.childNodes) {
                    return false;
                }
                nodeIndex = route.splice(0, 1)[0];
                parentNode = node;
                node = node.childNodes[nodeIndex];
            }
            return {
                node: node,
                parentNode: parentNode,
                nodeIndex: nodeIndex
            };
        },
        applyVirtualDiff: function(tree, diff) {
            var routeInfo = this.getFromVirtualRoute(tree, diff[this._const.route]),
                node = routeInfo.node,
                parentNode = routeInfo.parentNode,
                nodeIndex = routeInfo.nodeIndex,
                newSubsets = [], splitLength,
                newNode, movedNode, nodeArray, route, length, c, i;

            var t = this;
            // pre-diff hook
            var info = {
                diff: diff,
                node: node
            };

            if (this.preVirtualDiffApply(info)) {
                return true;
            }

            switch (diff[this._const.action]) {
                case this._const.addAttribute:
                    if (!node.attributes) {
                        node.attributes = {};
                    }

                    node.attributes[diff[this._const.name]] = diff[this._const.value];

                    if (diff[this._const.name] === 'checked') {
                        node.checked = true;
                    } else if (diff[this._const.name] === 'selected') {
                        node.selected = true;
                    } else if (node.nodeName === 'INPUT' && diff[this._const.name] === 'value') {
                        node.value = diff[this._const.value];
                    }

                    break;
                case this._const.modifyAttribute:
                    node.attributes[diff[this._const.name]] = diff[this._const.newValue];
                    if (node.nodeName === 'INPUT' && diff[this._const.name] === 'value') {
                        node.value = diff[this._const.value];
                    }
                    break;
                case this._const.removeAttribute:

                    delete node.attributes[diff[this._const.name]];

                    if (Object.keys(node.attributes).length === 0) {
                        delete node.attributes;
                    }

                    if (diff[this._const.name] === 'checked') {
                        node.checked = false;
                    } else if (diff[this._const.name] === 'selected') {
                        delete node.selected;
                    } else if (node.nodeName === 'INPUT' && diff[this._const.name] === 'value') {
                        delete node.value;
                    }

                    break;
                case this._const.modifyTextElement:
                    node.data = diff[this._const.newValue];
                    break;
                case this._const.modifyValue:
                    node.value = diff[this._const.newValue];
                    break;
                case this._const.modifyComment:
                    node.data = diff[this._const.newValue];
                    break;
                case this._const.modifyChecked:
                    node.checked = diff[this._const.newValue];
                    break;
                case this._const.modifySelected:
                    node.selected = diff[this._const.newValue];
                    break;
                case this._const.replaceElement:
                    newNode = cloneObj(diff[this._const.newValue]);
                    newNode.outerDone = true;
                    newNode.innerDone = true;
                    newNode.valueDone = true;
                    parentNode.childNodes[nodeIndex] = newNode;
                    break;
                case this._const.relocateGroup:
                    nodeArray = node.childNodes.splice(diff[this._const.from], diff.groupLength).reverse();
                    length = nodeArray.length;
                    for (i = 0; i < length; i++) {
                        movedNode = nodeArray[i];
                        node.childNodes.splice(diff[t._const.to], 0, movedNode);
                    }
                    if (node.subsets) {

                        node.subsets.forEach(function(map) {
                            if (diff[t._const.from] < diff[t._const.to] && map.oldValue <= diff[t._const.to] && map.oldValue > diff[t._const.from]) {
                                map.oldValue -= diff.groupLength;
                                splitLength = map.oldValue + map.length - diff[t._const.to];
                                if (splitLength > 0) {
                                    // new insertion splits map.
                                    newSubsets.push({
                                        oldValue: diff[t._const.to] + diff.groupLength,
                                        newValue: map.newValue + map.length - splitLength,
                                        length: splitLength
                                    })
                                    map.length -= splitLength;
                                }
                            } else if (diff[t._const.from] > diff[t._const.to] && map.oldValue > diff[t._const.to] && map.oldValue < diff[t._const.from]) {
                                map.oldValue += diff.groupLength;
                                splitLength = map.oldValue + map.length - diff[t._const.to];
                                if (splitLength > 0) {
                                    // new insertion splits map.
                                    newSubsets.push({
                                        oldValue: diff[t._const.to] + diff.groupLength,
                                        newValue: map.newValue + map.length - splitLength,
                                        length: splitLength
                                    })
                                    map.length -= splitLength;
                                }
                            } else if (map.oldValue === diff[t._const.from]) {
                                map.oldValue = diff[t._const.to];
                            }
                        });
                    }

                    break;
                case this._const.removeElement:
                    parentNode.childNodes.splice(nodeIndex, 1);
                    if (parentNode.subsets) {
                        parentNode.subsets.forEach(function(map) {
                            if (map.oldValue > nodeIndex) {
                                map.oldValue -= 1;
                            } else if (map.oldValue === nodeIndex) {
                                map.delete = true;
                            } else if (map.oldValue < nodeIndex && (map.oldValue + map.length) > nodeIndex) {
                                if (map.oldValue + map.length - 1 === nodeIndex) {
                                    map.length--;
                                } else {
                                    newSubsets.push({
                                        newValue: map.newValue + nodeIndex - map.oldValue,
                                        oldValue: nodeIndex,
                                        length: map.length - nodeIndex + map.oldValue - 1
                                    })
                                    map.length = nodeIndex - map.oldValue
                                }
                            }
                        });
                    }
                    node = parentNode;
                    break;
                case this._const.addElement:
                    route = diff[this._const.route].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    node = this.getFromVirtualRoute(tree, route).node;
                    newNode = cloneObj(diff[this._const.element]);
                    newNode.outerDone = true;
                    newNode.innerDone = true;
                    newNode.valueDone = true;

                    if (!node.childNodes) {
                        node.childNodes = [];
                    }

                    if (c >= node.childNodes.length) {
                        node.childNodes.push(newNode);
                    } else {
                        node.childNodes.splice(c, 0, newNode);
                    }
                    if (node.subsets) {
                        node.subsets.forEach(function(map) {
                            if (map.oldValue >= c) {
                                map.oldValue += 1;
                            } else if (map.oldValue < c && (map.oldValue + map.length) > c) {
                                splitLength = map.oldValue + map.length - c
                                newSubsets.push({
                                    newValue: map.newValue + map.length - splitLength,
                                    oldValue: c + 1,
                                    length: splitLength
                                })
                                map.length -= splitLength
                            }
                        });
                    }
                    break;
                case this._const.removeTextElement:
                    parentNode.childNodes.splice(nodeIndex, 1);
                    if (parentNode.nodeName === 'TEXTAREA') {
                        delete parentNode.value;
                    }
                    if (parentNode.subsets) {
                        parentNode.subsets.forEach(function(map) {
                            if (map.oldValue > nodeIndex) {
                                map.oldValue -= 1;
                            } else if (map.oldValue === nodeIndex) {
                                map.delete = true;
                            } else if (map.oldValue < nodeIndex && (map.oldValue + map.length) > nodeIndex) {
                                if (map.oldValue + map.length - 1 === nodeIndex) {
                                    map.length--;
                                } else {
                                    newSubsets.push({
                                        newValue: map.newValue + nodeIndex - map.oldValue,
                                        oldValue: nodeIndex,
                                        length: map.length - nodeIndex + map.oldValue - 1
                                    })
                                    map.length = nodeIndex - map.oldValue
                                }
                            }
                        });
                    }
                    node = parentNode;
                    break;
                case this._const.addTextElement:
                    route = diff[this._const.route].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    newNode = {};
                    newNode.nodeName = '#text';
                    newNode.data = diff[this._const.value];
                    node = this.getFromVirtualRoute(tree, route).node;
                    if (!node.childNodes) {
                        node.childNodes = [];
                    }

                    if (c >= node.childNodes.length) {
                        node.childNodes.push(newNode);
                    } else {
                        node.childNodes.splice(c, 0, newNode);
                    }
                    if (node.nodeName === 'TEXTAREA') {
                        node.value = diff[this._const.newValue];
                    }
                    if (node.subsets) {
                        node.subsets.forEach(function(map) {
                            if (map.oldValue >= c) {
                                map.oldValue += 1;
                            } if (map.oldValue < c && (map.oldValue + map.length) > c) {
                                splitLength = map.oldValue + map.length - c
                                newSubsets.push({
                                    newValue: map.newValue + map.length - splitLength,
                                    oldValue: c + 1,
                                    length: splitLength
                                })
                                map.length -= splitLength
                            }
                        });
                    }
                    break;
                default:
                    console.log('unknown action');
            }

            if (node.subsets) {
                node.subsets = node.subsets.filter(function(map) {
                    return !map.delete && map.oldValue !== map.newValue;
                });
                if (newSubsets.length) {
                    node.subsets = node.subsets.concat(newSubsets);
                }
            }

            // capture newNode for the callback
            info.newNode = newNode;
            this.postVirtualDiffApply(info);

            return;
        },




        // ===== Apply a diff =====

        apply: function(tree, diffs) {
            var dobj = this,
                length = diffs.length,
                diff, i;

            if (length === 0) {
                return true;
            }
            for (i = 0; i < length; i++) {
                diff = diffs[i];
                if (!dobj.applyDiff(tree, diff)) {
                    return false;
                }
            }
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
            var node = this.getFromRoute(tree, diff[this._const.route]),
                newNode, reference, route, nodeArray, length, childNode, index, c;

            var t = this;
            // pre-diff hook
            var info = {
                diff: diff,
                node: node
            };

            if (this.preDiffApply(info)) {
                return true;
            }

            switch (diff[this._const.action]) {
                case this._const.addAttribute:
                    if (!node || !node.setAttribute) {
                        return false;
                    }
                    node.setAttribute(diff[this._const.name], diff[this._const.value]);
                    break;
                case this._const.modifyAttribute:
                    if (!node || !node.setAttribute) {
                        return false;
                    }
                    node.setAttribute(diff[this._const.name], diff[this._const.newValue]);
                    break;
                case this._const.removeAttribute:
                    if (!node || !node.removeAttribute) {
                        return false;
                    }
                    node.removeAttribute(diff[this._const.name]);
                    break;
                case this._const.modifyTextElement:
                    if (!node || node.nodeType !== 3) {
                        return false;
                    }
                    this.textDiff(node, node.data, diff[this._const.oldValue], diff[this._const.newValue]);
                    break;
                case this._const.modifyValue:
                    if (!node || typeof node.value === 'undefined') {
                        return false;
                    }
                    node.value = diff[this._const.newValue];
                    break;
                case this._const.modifyComment:
                    if (!node || typeof node.data === 'undefined') {
                        return false;
                    }
                    this.textDiff(node, node.data, diff[this._const.oldValue], diff[this._const.newValue]);
                    break;
                case this._const.modifyChecked:
                    if (!node || typeof node.checked === 'undefined') {
                        return false;
                    }
                    node.checked = diff[this._const.newValue];
                    break;
                case this._const.modifySelected:
                    if (!node || typeof node.selected === 'undefined') {
                        return false;
                    }
                    node.selected = diff[this._const.newValue];
                    break;
                case this._const.replaceElement:
                    node.parentNode.replaceChild(this.objToNode(diff[this._const.newValue], node.namespaceURI === 'http://www.w3.org/2000/svg'), node);
                    break;
                case this._const.relocateGroup:
                    nodeArray = Array.apply(null, new Array(diff.groupLength)).map(function() {
                        return node.removeChild(node.childNodes[diff[t._const.from]]);
                    });
                    length = nodeArray.length;
                    for (index = 0; index < length; index++) {
                        childNode = nodeArray[index];
                        if (index === 0) {
                            reference = node.childNodes[diff[t._const.to]];
                        }
                        node.insertBefore(childNode, reference || null);
                    }
                    break;
                case this._const.removeElement:
                    node.parentNode.removeChild(node);
                    break;
                case this._const.addElement:
                    route = diff[this._const.route].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    node = this.getFromRoute(tree, route);
                    node.insertBefore(this.objToNode(diff[this._const.element], node.namespaceURI === 'http://www.w3.org/2000/svg'), node.childNodes[c] || null);
                    break;
                case this._const.removeTextElement:
                    if (!node || node.nodeType !== 3) {
                        return false;
                    }
                    node.parentNode.removeChild(node);
                    break;
                case this._const.addTextElement:
                    route = diff[this._const.route].slice();
                    c = route.splice(route.length - 1, 1)[0];
                    newNode = document.createTextNode(diff[this._const.value]);
                    node = this.getFromRoute(tree, route);
                    if (!node || !node.childNodes) {
                        return false;
                    }
                    node.insertBefore(newNode, node.childNodes[c] || null);
                    break;
                default:
                    console.log('unknown action');
            }

            // if a new node was created, we might be interested in it
            // post diff hook
            info.newNode = newNode;
            this.postDiffApply(info);

            return true;
        },

        // ===== Undo a diff =====

        undo: function(tree, diffs) {
            var dobj = this, diff, length = diffs.length, i;
            diffs = diffs.slice();
            if (!length) {
                diffs = [diffs];
            }
            diffs.reverse();
            for (i = 0; i < length; i++) {
                diff = diffs[i];
                dobj.undoDiff(tree, diff);
            }
        },
        undoDiff: function(tree, diff) {

            switch (diff[this._const.action]) {
                case this._const.addAttribute:
                    diff[this._const.action] = this._const.removeAttribute;
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifyAttribute:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.removeAttribute:
                    diff[this._const.action] = this._const.addAttribute;
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifyTextElement:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifyValue:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifyComment:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifyChecked:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.modifySelected:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.replaceElement:
                    swap(diff, this._const.oldValue, this._const.newValue);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.relocateGroup:
                    swap(diff, this._const.from, this._const.to);
                    this.applyDiff(tree, diff);
                    break;
                case this._const.removeElement:
                    diff[this._const.action] = this._const.addElement;
                    this.applyDiff(tree, diff);
                    break;
                case this._const.addElement:
                    diff[this._const.action] = this._const.removeElement;
                    this.applyDiff(tree, diff);
                    break;
                case this._const.removeTextElement:
                    diff[this._const.action] = this._const.addTextElement;
                    this.applyDiff(tree, diff);
                    break;
                case this._const.addTextElement:
                    diff[this._const.action] = this._const.removeTextElement;
                    this.applyDiff(tree, diff);
                    break;
                default:
                    console.log('unknown action');
            }

        }
    };

    return diffDOM;
});
