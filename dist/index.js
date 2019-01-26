'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var diffcount;
var foundAll = false;

var Diff = function Diff(options) {
    var this$1 = this;
    if ( options === void 0 ) options = {};

    Object.entries(options).forEach(function (ref) {
        var key = ref[0];
        var value = ref[1];

        return this$1[key] = value;
    });
};

Diff.prototype.toString = function toString () {
    return JSON.stringify(this)
};

Diff.prototype.setValue = function setValue (aKey, aValue) {
    this[aKey] = aValue;
    return this
};

function elementDescriptors(el) {
    var output = [];
    if (el.nodeName !== '#text' && el.nodeName !== '#comment') {
        output.push(el.nodeName);
        if (el.attributes) {
            if (el.attributes['class']) {
                output.push(((el.nodeName) + "." + (el.attributes['class'].replace(/ /g, '.'))));
            }
            if (el.attributes.id) {
                output.push(((el.nodeName) + "#" + (el.attributes.id)));
            }
        }

    }
    return output
}

function findUniqueDescriptors(li) {
    var uniqueDescriptors = {};
    var duplicateDescriptors = {};

    li.forEach(function (node) {
        elementDescriptors(node).forEach(function (descriptor) {
            var inUnique = descriptor in uniqueDescriptors;
            var inDupes = descriptor in duplicateDescriptors;
            if (!inUnique && !inDupes) {
                uniqueDescriptors[descriptor] = true;
            } else if (inUnique) {
                delete uniqueDescriptors[descriptor];
                duplicateDescriptors[descriptor] = true;
            }
        });
    });

    return uniqueDescriptors
}

function uniqueInBoth(l1, l2) {
    var l1Unique = findUniqueDescriptors(l1);
    var l2Unique = findUniqueDescriptors(l2);
    var inBoth = {};

    Object.keys(l1Unique).forEach(function (key) {
        if (l2Unique[key]) {
            inBoth[key] = true;
        }
    });

    return inBoth
}

function removeDone(tree) {
    delete tree.outerDone;
    delete tree.innerDone;
    delete tree.valueDone;
    if (tree.childNodes) {
        return tree.childNodes.every(removeDone)
    } else {
        return true
    }
}

function isEqual(e1, e2) {
    if (!['nodeName', 'value', 'checked', 'selected', 'data'].every(function (element) {
            if (e1[element] !== e2[element]) {
                return false
            }
            return true
        })) {
        return false
    }

    if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
        return false
    }

    if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
        return false
    }
    if (e1.attributes) {
        var e1Attributes = Object.keys(e1.attributes);
        var e2Attributes = Object.keys(e2.attributes);

        if (e1Attributes.length !== e2Attributes.length) {
            return false
        }
        if (!e1Attributes.every(function (attribute) {
                if (e1.attributes[attribute] !== e2.attributes[attribute]) {
                    return false
                }
                return true
            })) {
            return false
        }
    }
    if (e1.childNodes) {
        if (e1.childNodes.length !== e2.childNodes.length) {
            return false
        }
        if (!e1.childNodes.every(function (childNode, index) { return isEqual(childNode, e2.childNodes[index]); })) {

            return false
        }

    }

    return true
}


function roughlyEqual(e1, e2, uniqueDescriptors, sameSiblings, preventRecursion) {

    if (!e1 || !e2) {
        return false
    }

    if (e1.nodeName !== e2.nodeName) {
        return false
    }

    if (e1.nodeName === '#text') {
        // Note that we initially don't care what the text content of a node is,
        // the mere fact that it's the same tag and "has text" means it's roughly
        // equal, and then we can find out the true text difference later.
        return preventRecursion ? true : e1.data === e2.data
    }


    if (e1.nodeName in uniqueDescriptors) {
        return true
    }

    if (e1.attributes && e2.attributes) {

        if (e1.attributes.id) {
            if (e1.attributes.id !== e2.attributes.id) {
                return false
            } else {
                var idDescriptor = (e1.nodeName) + "#" + (e1.attributes.id);
                if (idDescriptor in uniqueDescriptors) {
                    return true
                }
            }
        }
        if (e1.attributes['class'] && e1.attributes['class'] === e2.attributes['class']) {
            var classDescriptor = (e1.nodeName) + "." + (e1.attributes['class'].replace(/ /g, '.'));
            if (classDescriptor in uniqueDescriptors) {
                return true
            }
        }
    }

    if (sameSiblings) {
        return true
    }

    var nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : [];
    var nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : [];

    if (nodeList1.length !== nodeList2.length) {
        return false
    }

    if (preventRecursion) {
        return nodeList1.every(function (element, index) { return element.nodeName === nodeList2[index].nodeName; })
    } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        // was not set, we must explicitly force it to true for child iterations.
        var childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2);
        return nodeList1.every(function (element, index) { return roughlyEqual(element, nodeList2[index], childUniqueDescriptors, true, true); })
    }
}


function cloneObj(obj) { //  TODO: Do we really need to clone here? Is it not enough to just return the original object?
    return JSON.parse(JSON.stringify(obj))
}
/**
 * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
 */
function findCommonSubsets(c1, c2, marked1, marked2) {
    var lcsSize = 0;
    var index = [];
    var c1Length = c1.length;
    var c2Length = c2.length;

    var // set up the matching table
        matches = Array.apply(void 0, new Array(c1Length + 1)).map(function () { return []; });

    var uniqueDescriptors = uniqueInBoth(c1, c2);

    var // If all of the elements are the same tag, id and class, then we can
        // consider them roughly the same even if they have a different number of
        // children. This will reduce removing and re-adding similar elements.
        subsetsSame = c1Length === c2Length;

    if (subsetsSame) {

        c1.some(function (element, i) {
            var c1Desc = elementDescriptors(element);
            var c2Desc = elementDescriptors(c2[i]);
            if (c1Desc.length !== c2Desc.length) {
                subsetsSame = false;
                return true
            }
            c1Desc.some(function (description, i) {
                if (description !== c2Desc[i]) {
                    subsetsSame = false;
                    return true
                }
            });
            if (!subsetsSame) {
                return true
            }
        });
    }

    // fill the matches with distance values
    for (var c1Index = 0; c1Index < c1Length; c1Index++) {
        var c1Element = c1[c1Index];
        for (var c2Index = 0; c2Index < c2Length; c2Index++) {
            var c2Element = c2[c2Index];
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
        return false
    }

    return {
        oldValue: index[0] - lcsSize,
        newValue: index[1] - lcsSize,
        length: lcsSize
    }
}

/**
 * This should really be a predefined function in Array...
 */
function makeArray(n, v) {
    return Array.apply(void 0, new Array(n)).map(function () { return v; })
}

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
function getGapInformation(t1, t2, stable) {
    var gaps1 = t1.childNodes ? makeArray(t1.childNodes.length, true) : [];
    var gaps2 = t2.childNodes ? makeArray(t2.childNodes.length, true) : [];
    var group = 0;

    // give elements from the same subset the same group number
    stable.forEach(function (subset) {
        var endOld = subset.oldValue + subset.length;
        var endNew = subset.newValue + subset.length;

        for (var j = subset.oldValue; j < endOld; j += 1) {
            gaps1[j] = group;
        }
        for (var j$1 = subset.newValue; j$1 < endNew; j$1 += 1) {
            gaps2[j$1] = group;
        }
        group += 1;
    });

    return {
        gaps1: gaps1,
        gaps2: gaps2
    }
}

/**
 * Find all matching subsets, based on immediate child differences only.
 */
function markSubTrees(oldTree, newTree) {
    // note: the child lists are views, and so update as we update old/newTree
    var oldChildren = oldTree.childNodes ? oldTree.childNodes : [];

    var newChildren = newTree.childNodes ? newTree.childNodes : [];
    var marked1 = makeArray(oldChildren.length, false);
    var marked2 = makeArray(newChildren.length, false);
    var subsets = [];
    var subset = true;

    var returnIndex = function() {
        return arguments[1]
    };

    var markBoth = function (i) {
        marked1[subset.oldValue + i] = true;
        marked2[subset.newValue + i] = true;
    };

    while (subset) {
        subset = findCommonSubsets(oldChildren, newChildren, marked1, marked2);
        if (subset) {
            subsets.push(subset);
            var subsetArray = Array.apply(void 0, new Array(subset.length)).map(returnIndex);
            subsetArray.forEach(function (item) { return markBoth(item); });
        }
    }

    oldTree.subsets = subsets;
    oldTree.subsetsAge = 100;
    return subsets
}


function swap(obj, p1, p2) {
    var tmp = obj[p1];
    obj[p1] = obj[p2];
    obj[p2] = tmp;
}


var DiffTracker = function DiffTracker() {
    this.list = [];
};

DiffTracker.prototype.add = function add (diffs) {
        var ref;

    (ref = this.list).push.apply(ref, diffs);
};
DiffTracker.prototype.forEach = function forEach (fn) {
    this.list.forEach(function (li) { return fn(li); });
};

var DiffDOM = function DiffDOM(ref) {
    var this$1 = this;
    var debug = ref.debug; if ( debug === void 0 ) debug = false;
    var diffcap = ref.diffcap; if ( diffcap === void 0 ) diffcap = 10;
    var maxDepth = ref.maxDepth; if ( maxDepth === void 0 ) maxDepth = false;
    var maxChildCount = ref.maxChildCount; if ( maxChildCount === void 0 ) maxChildCount = 50;
    var maxChildDiffCount = ref.maxChildDiffCount; if ( maxChildDiffCount === void 0 ) maxChildDiffCount = 3;
    var valueDiffing = ref.valueDiffing; if ( valueDiffing === void 0 ) valueDiffing = true;
    var textDiff = ref.textDiff; if ( textDiff === void 0 ) textDiff = function() {
        arguments[0].data = arguments[3];
        return
    };
    var preVirtualDiffApply = ref.preVirtualDiffApply; if ( preVirtualDiffApply === void 0 ) preVirtualDiffApply = function() {};
    var postVirtualDiffApply = ref.postVirtualDiffApply; if ( postVirtualDiffApply === void 0 ) postVirtualDiffApply = function() {};
    var preDiffApply = ref.preDiffApply; if ( preDiffApply === void 0 ) preDiffApply = function() {};
    var postDiffApply = ref.postDiffApply; if ( postDiffApply === void 0 ) postDiffApply = function() {};
    var filterOuterDiff = ref.filterOuterDiff; if ( filterOuterDiff === void 0 ) filterOuterDiff = null;
    var compress = ref.compress; if ( compress === void 0 ) compress = false;


    this.debug = debug;
    this.diffcap = diffcap;
    this.maxDepth = maxDepth;
    this.maxChildCount = maxChildCount;
    this.maxChildDiffCount = maxChildDiffCount;
    this.valueDiffing = valueDiffing;
    this.textDiff = textDiff;
    this.preVirtualDiffApply = preVirtualDiffApply;
    this.postVirtualDiffApply = postVirtualDiffApply;
    this.preDiffApply = preDiffApply;
    this.postDiffApply = postDiffApply;
    this.filterOuterDiff = filterOuterDiff;
    this.compress = compress;

    var varNames = ["addAttribute", "modifyAttribute", "removeAttribute",
        "modifyTextElement", "relocateGroup", "removeElement", "addElement",
        "removeTextElement", "addTextElement", "replaceElement", "modifyValue",
        "modifyChecked", "modifySelected", "modifyComment", "action", "route",
        "oldValue", "newValue", "element", "group", "from", "to", "name",
        "value", "data", "attributes", "nodeName", "childNodes", "checked",
        "selected"
    ];
    this._const = {};
    if (this.compress) {
        varNames.forEach(function (varName, index) { return this$1._const[varName] = index; });
    } else {
        varNames.forEach(function (varName) { return this$1._const[varName] = varName; });
    }
};

// ===== Create a diff =====

DiffDOM.prototype.diff = function diff (t1Node, t2Node) {
    var t1 = this.nodeToObj(t1Node);
    var t2 = this.nodeToObj(t2Node);

    diffcount = 0;

    if (this.debug) {
        this.t1Orig = this.nodeToObj(t1Node);
        this.t2Orig = this.nodeToObj(t2Node);
    }

    this.tracker = new DiffTracker();
    return this.findDiffs(t1, t2)
};

DiffDOM.prototype.findDiffs = function findDiffs (t1, t2) {
    var diffs;
    do {
        if (this.debug) {
            diffcount += 1;
            if (diffcount > this.diffcap) {
                window.diffError = [this.t1Orig, this.t2Orig];
                throw new Error(("surpassed diffcap:" + (JSON.stringify(this.t1Orig)) + " -> " + (JSON.stringify(this.t2Orig))))
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
                    console.log({
                        t1: t1,
                        t2: t2
                    });
                } else {
                    foundAll = true;
                    removeDone(t1);
                    diffs = this.findNextDiff(t1, t2, []);
                }
            }
        }
        if (diffs.length > 0) {
            foundAll = false;
            this.tracker.add(diffs);
            this.applyVirtual(t1, diffs);
        }
    } while (diffs.length > 0)
    return this.tracker.list
};

DiffDOM.prototype.findNextDiff = function findNextDiff (t1, t2, route) {
    var diffs;
    var fdiffs;

    if (this.maxDepth && route.length > this.maxDepth) {
        return []
    }
    // outer differences?
    if (!t1.outerDone) {
        diffs = this.findOuterDiff(t1, t2, route);
        if (this.filterOuterDiff) {
            fdiffs = this.filterOuterDiff(t1, t2, diffs);
            if (fdiffs) { diffs = fdiffs; }
        }
        if (diffs.length > 0) {
            t1.outerDone = true;
            return diffs
        } else {
            t1.outerDone = true;
        }
    }
    // inner differences?
    if (!t1.innerDone) {
        diffs = this.findInnerDiff(t1, t2, route);
        if (diffs.length > 0) {
            return diffs
        } else {
            t1.innerDone = true;
        }
    }

    if (this.valueDiffing && !t1.valueDone) {
        // value differences?
        diffs = this.findValueDiff(t1, t2, route);

        if (diffs.length > 0) {
            t1.valueDone = true;
            return diffs
        } else {
            t1.valueDone = true;
        }
    }

    // no differences
    return []
};

DiffDOM.prototype.findOuterDiff = function findOuterDiff (t1, t2, route) {
    var diffs = [];
    var attr;
    var attr1;
    var attr2;
    var attrLength;
    var pos;
    var i;

    if (t1.nodeName !== t2.nodeName) {
        return [new Diff()
            .setValue(this._const.action, this._const.replaceElement)
            .setValue(this._const.oldValue, cloneObj(t1))
            .setValue(this._const.newValue, cloneObj(t2))
            .setValue(this._const.route, route)
        ]
    }

    if (route.length && this.maxChildCount && t1.childNodes && t2.childNodes && t1.childNodes.length > this.maxChildCount && t2.childNodes.length > this.maxChildCount) {
        var childNodesLength = t1.childNodes.length < t2.childNodes.length ? t1.childNodes.length : t2.childNodes.length;
        var childDiffCount = 0;
        var j = 0;
        while (childDiffCount < this.maxChildDiffCount && j < childNodesLength) {
            if (!isEqual(t1.childNodes[j], t2.childNodes[j])) {
                childDiffCount++;
            }
            j++;
        }
        if (childDiffCount === this.maxChildDiffCount) {
            return [new Diff()
                .setValue(this._const.action, this._const.replaceElement)
                .setValue(this._const.oldValue, cloneObj(t1))
                .setValue(this._const.newValue, cloneObj(t2))
                .setValue(this._const.route, route)
            ]
        }
    }

    if (t1.data !== t2.data) {
        // Comment or text node.
        if (t1.nodeName === '#text') {
            return [new Diff()
                .setValue(this._const.action, this._const.modifyTextElement)
                .setValue(this._const.route, route)
                .setValue(this._const.oldValue, t1.data)
                .setValue(this._const.newValue, t2.data)
            ]
        } else {
            return [new Diff()
                .setValue(this._const.action, this._const.modifyComment)
                .setValue(this._const.route, route)
                .setValue(this._const.oldValue, t1.data)
                .setValue(this._const.newValue, t2.data)
            ]
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
                .setValue(this._const.action, this._const.removeAttribute)
                .setValue(this._const.route, route)
                .setValue(this._const.name, attr)
                .setValue(this._const.value, t1.attributes[attr])
            );
        } else {
            attr2.splice(pos, 1);
            if (t1.attributes[attr] !== t2.attributes[attr]) {
                diffs.push(new Diff()
                    .setValue(this._const.action, this._const.modifyAttribute)
                    .setValue(this._const.route, route)
                    .setValue(this._const.name, attr)
                    .setValue(this._const.oldValue, t1.attributes[attr])
                    .setValue(this._const.newValue, t2.attributes[attr])
                );
            }
        }
    }

    attrLength = attr2.length;
    for (i = 0; i < attrLength; i++) {
        attr = attr2[i];
        diffs.push(new Diff()
            .setValue(this._const.action, this._const.addAttribute)
            .setValue(this._const.route, route)
            .setValue(this._const.name, attr)
            .setValue(this._const.value, t2.attributes[attr])
        );
    }

    return diffs
};

DiffDOM.prototype.nodeToObj = function nodeToObj (aNode) {
    var objNode = {};
    var dobj = this;
    var nodeArray;
    var childNode;
    var length;
    var attribute;
    var i;
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
            if (aNode.checked !== undefined && aNode.type && ['radio', 'checkbox'].includes(aNode.type.toLowerCase())) {
                objNode.checked = aNode.checked;
            } else if (aNode.value !== undefined) {
                objNode.value = aNode.value;
            }
            if (aNode.selected !== undefined) {
                objNode.selected = aNode.selected;
            }
        }
    }
    return objNode
};

DiffDOM.prototype.objToNode = function objToNode (objNode, insideSvg) {
    var node;
    var dobj = this;
    var attribute;
    var attributeArray;
    var childNode;
    var childNodeArray;
    var length;
    var i;
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
    return node
};

DiffDOM.prototype.findInnerDiff = function findInnerDiff (t1, t2, route) {

    //var subtrees = (t1.childNodes && t2.childNodes) ?  markSubTrees(t1, t2) : [],
    var subtrees = t1.subsets && t1.subsetsAge-- ? t1.subsets : (t1.childNodes && t2.childNodes) ? markSubTrees(t1, t2) : [];

    var t1ChildNodes = t1.childNodes ? t1.childNodes : [];
    var t2ChildNodes = t2.childNodes ? t2.childNodes : [];
    var childNodesLengthDifference;
    var diffs = [];
    var index = 0;

    if (subtrees.length > 0) {
        /* One or more groups have been identified among the childnodes of t1
         * and t2.
         */
        diffs = this.attemptGroupRelocation(t1, t2, subtrees, route);
        if (diffs.length > 0) {
            return diffs
        }
    }

    /* 0 or 1 groups of similar child nodes have been found
     * for t1 and t2. 1 If there is 1, it could be a sign that the
     * contents are the same. When the number of groups is below 2,
     * t1 and t2 are made to have the same length and each of the
     * pairs of child nodes are diffed.
     */

    var last = Math.max(t1ChildNodes.length, t2ChildNodes.length);
    if (t1ChildNodes.length !== t2ChildNodes.length) {
        childNodesLengthDifference = true;
    }

    for (var i = 0; i < last; i += 1) {
        var e1 = t1ChildNodes[i];
        var e2 = t2ChildNodes[i];

        if (childNodesLengthDifference) {
            /* t1 and t2 have different amounts of childNodes. Add
             * and remove as necessary to obtain the same length */
            if (e1 && !e2) {
                if (e1.nodeName === '#text') {
                    diffs.push(new Diff()
                        .setValue(this._const.action, this._const.removeTextElement)
                        .setValue(this._const.route, route.concat(index))
                        .setValue(this._const.value, e1.data)
                    );
                    index -= 1;
                } else {
                    diffs.push(new Diff()
                        .setValue(this._const.action, this._const.removeElement)
                        .setValue(this._const.route, route.concat(index))
                        .setValue(this._const.element, cloneObj(e1))
                    );
                    index -= 1;
                }

            } else if (e2 && !e1) {
                if (e2.nodeName === '#text') {
                    diffs.push(new Diff()
                        .setValue(this._const.action, this._const.addTextElement)
                        .setValue(this._const.route, route.concat(index))
                        .setValue(this._const.value, e2.data)
                    );
                } else {
                    diffs.push(new Diff()
                        .setValue(this._const.action, this._const.addElement)
                        .setValue(this._const.route, route.concat(index))
                        .setValue(this._const.element, cloneObj(e2))
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
    return diffs
};

DiffDOM.prototype.attemptGroupRelocation = function attemptGroupRelocation (t1, t2, subtrees, route) {
    /* Either t1.childNodes and t2.childNodes have the same length, or
     * there are at least two groups of similar elements can be found.
     * attempts are made at equalizing t1 with t2. First all initial
     * elements with no group affiliation (gaps=true) are removed (if
     * only in t1) or added (if only in t2). Then the creation of a group
     * relocation diff is attempted.
     */
    var gapInformation = getGapInformation(t1, t2, subtrees);
    var gaps1 = gapInformation.gaps1;
    var gaps2 = gapInformation.gaps2;
    var shortest = Math.min(gaps1.length, gaps2.length);
    var destinationDifferent;
    var toGroup;
    var group;
    var node;
    var similarNode;
    var testI;
    var diffs = [];


    for (var index2 = 0, index1 = 0; index2 < shortest; index1 += 1, index2 += 1) {
        if (gaps1[index2] === true) {
            node = t1.childNodes[index1];
            if (node.nodeName === '#text') {
                if (t2.childNodes[index2].nodeName === '#text' && node.data !== t2.childNodes[index2].data) {
                    testI = index1;
                    while (t1.childNodes.length > testI + 1 && t1.childNodes[testI + 1].nodeName === '#text') {
                        testI += 1;
                        if (t2.childNodes[index2].data === t1.childNodes[testI].data) {
                            similarNode = true;
                            break
                        }
                    }
                    if (!similarNode) {
                        diffs.push(new Diff()
                            .setValue(this._const.action, this._const.modifyTextElement)
                            .setValue(this._const.route, route.concat(index2))
                            .setValue(this._const.oldValue, node.data)
                            .setValue(this._const.newValue, t2.childNodes[index2].data)
                        );
                        return diffs
                    }
                }
                diffs.push(new Diff()
                    .setValue(this._const.action, this._const.removeTextElement)
                    .setValue(this._const.route, route.concat(index2))
                    .setValue(this._const.value, node.data)
                );
                gaps1.splice(index2, 1);
                shortest = Math.min(gaps1.length, gaps2.length);
                index2 -= 1;
            } else {
                diffs.push(new Diff()
                    .setValue(this._const.action, this._const.removeElement)
                    .setValue(this._const.route, route.concat(index2))
                    .setValue(this._const.element, cloneObj(node))
                );
                gaps1.splice(index2, 1);
                shortest = Math.min(gaps1.length, gaps2.length);
                index2 -= 1;
            }

        } else if (gaps2[index2] === true) {
            node = t2.childNodes[index2];
            if (node.nodeName === '#text') {
                diffs.push(new Diff()
                    .setValue(this._const.action, this._const.addTextElement)
                    .setValue(this._const.route, route.concat(index2))
                    .setValue(this._const.value, node.data)
                );
                gaps1.splice(index2, 0, true);
                shortest = Math.min(gaps1.length, gaps2.length);
                index1 -= 1;
            } else {
                diffs.push(new Diff()
                    .setValue(this._const.action, this._const.addElement)
                    .setValue(this._const.route, route.concat(index2))
                    .setValue(this._const.element, cloneObj(node))
                );
                gaps1.splice(index2, 0, true);
                shortest = Math.min(gaps1.length, gaps2.length);
                index1 -= 1;
            }

        } else if (gaps1[index2] !== gaps2[index2]) {
            if (diffs.length > 0) {
                return diffs
            }
            // group relocation
            group = subtrees[gaps1[index2]];
            toGroup = Math.min(group.newValue, (t1.childNodes.length - group.length));
            if (toGroup !== group.oldValue) {
                // Check whether destination nodes are different than originating ones.
                destinationDifferent = false;
                for (var j = 0; j < group.length; j += 1) {
                    if (!roughlyEqual(t1.childNodes[toGroup + j], t1.childNodes[group.oldValue + j], [], false, true)) {
                        destinationDifferent = true;
                    }
                }
                if (destinationDifferent) {
                    return [new Diff()
                        .setValue(this._const.action, this._const.relocateGroup)
                        .setValue('groupLength', group.length)
                        .setValue(this._const.from, group.oldValue)
                        .setValue(this._const.to, toGroup)
                        .setValue(this._const.route, route)
                    ]
                }
            }
        }
    }
    return diffs
};

DiffDOM.prototype.findValueDiff = function findValueDiff (t1, t2, route) {
    // Differences of value. Only useful if the value/selection/checked value
    // differs from what is represented in the DOM. For example in the case
    // of filled out forms, etc.
    var diffs = [];

    if (t1.selected !== t2.selected) {
        diffs.push(new Diff()
            .setValue(this._const.action, this._const.modifySelected)
            .setValue(this._const.oldValue, t1.selected)
            .setValue(this._const.newValue, t2.selected)
            .setValue(this._const.route, route)
        );
    }

    if ((t1.value || t2.value) && t1.value !== t2.value && t1.nodeName !== 'OPTION') {
        diffs.push(new Diff()
            .setValue(this._const.action, this._const.modifyValue)
            .setValue(this._const.oldValue, t1.value || "")
            .setValue(this._const.newValue, t2.value || "")
            .setValue(this._const.route, route)
        );
    }
    if (t1.checked !== t2.checked) {
        diffs.push(new Diff()
            .setValue(this._const.action, this._const.modifyChecked)
            .setValue(this._const.oldValue, t1.checked)
            .setValue(this._const.newValue, t2.checked)
            .setValue(this._const.route, route)
        );
    }

    return diffs
};

// ===== Apply a virtual diff =====

DiffDOM.prototype.applyVirtual = function applyVirtual (tree, diffs) {
        var this$1 = this;

    diffs.forEach(function (diff) {
        this$1.applyVirtualDiff(tree, diff);
    });
    return true
};

DiffDOM.prototype.getFromVirtualRoute = function getFromVirtualRoute (tree, route) {
    var node = tree;
    var parentNode;
    var nodeIndex;

    route = route.slice();
    while (route.length > 0) {
        if (!node.childNodes) {
            return false
        }
        nodeIndex = route.splice(0, 1)[0];
        parentNode = node;
        node = node.childNodes[nodeIndex];
    }
    return {
        node: node,
        parentNode: parentNode,
        nodeIndex: nodeIndex
    }
};

DiffDOM.prototype.applyVirtualDiff = function applyVirtualDiff (tree, diff) {
        var this$1 = this;

    var routeInfo = this.getFromVirtualRoute(tree, diff[this._const.route]);
    var node = routeInfo.node;
    var parentNode = routeInfo.parentNode;
    var nodeIndex = routeInfo.nodeIndex;
    var newSubsets = [];

    // pre-diff hook
    var info = {
        diff: diff,
        node: node
    };

    if (this.preVirtualDiffApply(info)) {
        return true
    }

    var newNode;
    var nodeArray;
    var route;
    var c;
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

            break
        case this._const.modifyAttribute:
            node.attributes[diff[this._const.name]] = diff[this._const.newValue];
            break
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

            break
        case this._const.modifyTextElement:
            node.data = diff[this._const.newValue];
            break
        case this._const.modifyValue:
            node.value = diff[this._const.newValue];
            break
        case this._const.modifyComment:
            node.data = diff[this._const.newValue];
            break
        case this._const.modifyChecked:
            node.checked = diff[this._const.newValue];
            break
        case this._const.modifySelected:
            node.selected = diff[this._const.newValue];
            break
        case this._const.replaceElement:
            newNode = cloneObj(diff[this._const.newValue]);
            newNode.outerDone = true;
            newNode.innerDone = true;
            newNode.valueDone = true;
            parentNode.childNodes[nodeIndex] = newNode;
            break
        case this._const.relocateGroup:
            nodeArray = node.childNodes.splice(diff[this._const.from], diff.groupLength).reverse();
            nodeArray.forEach(function (movedNode) { return node.childNodes.splice(diff[this$1._const.to], 0, movedNode); });
            if (node.subsets) {
                node.subsets.forEach(function (map) {
                    if (diff[this$1._const.from] < diff[this$1._const.to] && map.oldValue <= diff[this$1._const.to] && map.oldValue > diff[this$1._const.from]) {
                        map.oldValue -= diff.groupLength;
                        var splitLength = map.oldValue + map.length - diff[this$1._const.to];
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue: diff[this$1._const.to] + diff.groupLength,
                                newValue: map.newValue + map.length - splitLength,
                                length: splitLength
                            });
                            map.length -= splitLength;
                        }
                    } else if (diff[this$1._const.from] > diff[this$1._const.to] && map.oldValue > diff[this$1._const.to] && map.oldValue < diff[this$1._const.from]) {
                        map.oldValue += diff.groupLength;
                        var splitLength$1 = map.oldValue + map.length - diff[this$1._const.to];
                        if (splitLength$1 > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue: diff[this$1._const.to] + diff.groupLength,
                                newValue: map.newValue + map.length - splitLength$1,
                                length: splitLength$1
                            });
                            map.length -= splitLength$1;
                        }
                    } else if (map.oldValue === diff[this$1._const.from]) {
                        map.oldValue = diff[this$1._const.to];
                    }
                });
            }

            break
        case this._const.removeElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.subsets) {
                parentNode.subsets.forEach(function (map) {
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
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break
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
                node.subsets.forEach(function (map) {
                    if (map.oldValue >= c) {
                        map.oldValue += 1;
                    } else if (map.oldValue < c && (map.oldValue + map.length) > c) {
                        var splitLength = map.oldValue + map.length - c;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break
        case this._const.removeTextElement:
            parentNode.childNodes.splice(nodeIndex, 1);
            if (parentNode.nodeName === 'TEXTAREA') {
                delete parentNode.value;
            }
            if (parentNode.subsets) {
                parentNode.subsets.forEach(function (map) {
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
                            });
                            map.length = nodeIndex - map.oldValue;
                        }
                    }
                });
            }
            node = parentNode;
            break
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
                node.subsets.forEach(function (map) {
                    if (map.oldValue >= c) {
                        map.oldValue += 1;
                    }
                    if (map.oldValue < c && (map.oldValue + map.length) > c) {
                        var splitLength = map.oldValue + map.length - c;
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength
                        });
                        map.length -= splitLength;
                    }
                });
            }
            break
        default:
            console.log('unknown action');
    }

    if (node.subsets) {
        node.subsets = node.subsets.filter(function (map) { return !map.delete && map.oldValue !== map.newValue; });
        if (newSubsets.length) {
            node.subsets = node.subsets.concat(newSubsets);
        }
    }

    // capture newNode for the callback
    info.newNode = newNode;
    this.postVirtualDiffApply(info);

    return
};

// ===== Apply a diff =====

DiffDOM.prototype.apply = function apply (tree, diffs) {
        var this$1 = this;

    return diffs.every(function (diff) { return this$1.applyDiff(tree, diff); })
};


DiffDOM.prototype.getFromRoute = function getFromRoute (node, route) {
    route = route.slice();
    while (route.length > 0) {
        if (!node.childNodes) {
            return false
        }
        var c = route.splice(0, 1)[0];
        node = node.childNodes[c];
    }
    return node
};

DiffDOM.prototype.applyDiff = function applyDiff (tree, diff) {
        var this$1 = this;

    var node = this.getFromRoute(tree, diff[this._const.route]);
    var newNode;
    var reference;
    var route;
    var nodeArray;
    var c;

    // pre-diff hook
    var info = {
        diff: diff,
        node: node
    };

    if (this.preDiffApply(info)) {
        return true
    }

    switch (diff[this._const.action]) {
        case this._const.addAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(diff[this._const.name], diff[this._const.value]);
            break
        case this._const.modifyAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(diff[this._const.name], diff[this._const.newValue]);
            if (node.nodeName === 'INPUT' && diff[this._const.name] === 'value') {
                node.value = diff[this._const.oldValue];
            }
            break
        case this._const.removeAttribute:
            if (!node || !node.removeAttribute) {
                return false
            }
            node.removeAttribute(diff[this._const.name]);
            break
        case this._const.modifyTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            this.textDiff(node, node.data, diff[this._const.oldValue], diff[this._const.newValue]);
            break
        case this._const.modifyValue:
            if (!node || typeof node.value === 'undefined') {
                return false
            }
            node.value = diff[this._const.newValue];
            break
        case this._const.modifyComment:
            if (!node || typeof node.data === 'undefined') {
                return false
            }
            this.textDiff(node, node.data, diff[this._const.oldValue], diff[this._const.newValue]);
            break
        case this._const.modifyChecked:
            if (!node || typeof node.checked === 'undefined') {
                return false
            }
            node.checked = diff[this._const.newValue];
            break
        case this._const.modifySelected:
            if (!node || typeof node.selected === 'undefined') {
                return false
            }
            node.selected = diff[this._const.newValue];
            break
        case this._const.replaceElement:
            node.parentNode.replaceChild(this.objToNode(diff[this._const.newValue], node.namespaceURI === 'http://www.w3.org/2000/svg'), node);
            break
        case this._const.relocateGroup:
            nodeArray = Array.apply(void 0, new Array(diff.groupLength)).map(function () { return node.removeChild(node.childNodes[diff[this$1._const.from]]); });
            nodeArray.forEach(function (childNode, index) {
                if (index === 0) {
                    reference = node.childNodes[diff[this$1._const.to]];
                }
                node.insertBefore(childNode, reference || null);
            });
            break
        case this._const.removeElement:
            node.parentNode.removeChild(node);
            break
        case this._const.addElement:
            route = diff[this._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            node = this.getFromRoute(tree, route);
            node.insertBefore(this.objToNode(diff[this._const.element], node.namespaceURI === 'http://www.w3.org/2000/svg'), node.childNodes[c] || null);
            break
        case this._const.removeTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            node.parentNode.removeChild(node);
            break
        case this._const.addTextElement:
            route = diff[this._const.route].slice();
            c = route.splice(route.length - 1, 1)[0];
            newNode = document.createTextNode(diff[this._const.value]);
            node = this.getFromRoute(tree, route);
            if (!node || !node.childNodes) {
                return false
            }
            node.insertBefore(newNode, node.childNodes[c] || null);
            break
        default:
            console.log('unknown action');
    }

    // if a new node was created, we might be interested in it
    // post diff hook
    info.newNode = newNode;
    this.postDiffApply(info);

    return true
};

// ===== Undo a diff =====

DiffDOM.prototype.undo = function undo (tree, diffs) {
        var this$1 = this;

    if (!diffs.length) {
        diffs = [diffs];
    }
    diffs = diffs.slice();
    diffs.reverse();
    diffs.forEach(function (diff) {
        this$1.undoDiff(tree, diff);
    });
};

DiffDOM.prototype.undoDiff = function undoDiff (tree, diff) {

    switch (diff[this._const.action]) {
        case this._const.addAttribute:
            diff[this._const.action] = this._const.removeAttribute;
            this.applyDiff(tree, diff);
            break
        case this._const.modifyAttribute:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.removeAttribute:
            diff[this._const.action] = this._const.addAttribute;
            this.applyDiff(tree, diff);
            break
        case this._const.modifyTextElement:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.modifyValue:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.modifyComment:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.modifyChecked:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.modifySelected:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.replaceElement:
            swap(diff, this._const.oldValue, this._const.newValue);
            this.applyDiff(tree, diff);
            break
        case this._const.relocateGroup:
            swap(diff, this._const.from, this._const.to);
            this.applyDiff(tree, diff);
            break
        case this._const.removeElement:
            diff[this._const.action] = this._const.addElement;
            this.applyDiff(tree, diff);
            break
        case this._const.addElement:
            diff[this._const.action] = this._const.removeElement;
            this.applyDiff(tree, diff);
            break
        case this._const.removeTextElement:
            diff[this._const.action] = this._const.addTextElement;
            this.applyDiff(tree, diff);
            break
        case this._const.addTextElement:
            diff[this._const.action] = this._const.removeTextElement;
            this.applyDiff(tree, diff);
            break
        default:
            console.log('unknown action');
    }

};

/**
 * Use TraceLogger to figure out function calls inside
 * JS objects by wrapping an object with a TraceLogger
 * instance.
 *
 * Pretty-prints the call trace (using unicode box code)
 * when tracelogger.toString() is called.
 */

/**
 * Wrap an object by calling new TraceLogger(obj)
 *
 * If you're familiar with Python decorators, this
 * does roughly the same thing, adding pre/post
 * call hook logging calls so that you can see
 * what's going on.
 */
var TraceLogger = function TraceLogger(obj) {
    var this$1 = this;
    if ( obj === void 0 ) obj = {};

    this.pad = "│   ";
    this.padding = "";
    this.tick = 1;
    this.messages = [];
    var wrapkey = function (obj, key) {
        // trace this function
        var oldfn = obj[key];
        obj[key] = function () {
            var args = [], len = arguments.length;
            while ( len-- ) args[ len ] = arguments[ len ];

            this$1.fin(key, Array.prototype.slice.call(args));
            var result = oldfn.apply(obj, args);
            this$1.fout(key, result);
            return result
        };
    };
    // can't use Object.keys for prototype walking
    for (var key in obj) {
        if (typeof obj[key] === "function") {
            wrapkey(obj, key);
        }
    }
    this.log("┌ TRACELOG START");
};
// called when entering a function
TraceLogger.prototype.fin = function fin (fn, args) {
    this.padding += this.pad;
    this.log(("├─> entering " + fn), args);
};
// called when exiting a function
TraceLogger.prototype.fout = function fout (fn, result) {
    this.log("│<──┘ generated return value", result);
    this.padding = this.padding.substring(0, this.padding.length - this.pad.length);
};
// log message formatting
TraceLogger.prototype.format = function format (s, tick) {
    var nf = function(t) {
        t = "" + t;
        while (t.length < 4) {
            t = "0" + t;
        }
        return t
    };
    return ((nf(tick)) + "> " + (this.padding) + s)
};
// log a trace message
TraceLogger.prototype.log = function log () {
    var s = Array.prototype.slice.call(arguments);
    var stringCollapse = function(v) {
        if (!v) {
            return "<falsey>"
        }
        if (typeof v === "string") {
            return v
        }
        if (v instanceof HTMLElement) {
            return v.outerHTML || "<empty>"
        }
        if (v instanceof Array) {
            return ("[" + (v.map(stringCollapse).join(",")) + "]")
        }
        return v.toString() || v.valueOf() || "<unknown>"
    };
    s = s.map(stringCollapse).join(", ");
    this.messages.push(this.format(s, this.tick++));
};
// turn the log into a structured string with
// unicode box codes to make it a sensible trace.
TraceLogger.prototype.toString = function toString () {
    var cap = "×   ";
    var terminator = "└───";
    while (terminator.length <= this.padding.length + this.pad.length) {
        terminator += cap;
    }
    var _ = this.padding;
    this.padding = "";
    terminator = this.format(terminator, this.tick);
    this.padding = _;
    return ((this.messages.join("\n")) + "\n" + terminator)
};

exports.DiffDOM = DiffDOM;
exports.TraceLogger = TraceLogger;
