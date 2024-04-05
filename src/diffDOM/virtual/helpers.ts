import {
    diffNodeType,
    elementDiffNodeType,
    elementNodeType,
    nodeType,
    subsetType,
    textDiffNodeType,
    textNodeType,
} from "../types"
import { Diff } from "../helpers"
const elementDescriptors = (el: diffNodeType) => {
    const output = []
    output.push(el.nodeName)
    if (el.nodeName !== "#text" && el.nodeName !== "#comment") {
        el = el as elementDiffNodeType
        if (el.attributes) {
            if (el.attributes["class"]) {
                output.push(
                    `${el.nodeName}.${el.attributes["class"].replace(
                        / /g,
                        ".",
                    )}`,
                )
            }
            if (el.attributes.id) {
                output.push(`${el.nodeName}#${el.attributes.id}`)
            }
        }
    }
    return output
}

const findUniqueDescriptors = (li: diffNodeType[]) => {
    const uniqueDescriptors = {}
    const duplicateDescriptors = {}

    li.forEach((node: nodeType) => {
        elementDescriptors(node).forEach((descriptor) => {
            const inUnique = descriptor in uniqueDescriptors
            const inDupes = descriptor in duplicateDescriptors
            if (!inUnique && !inDupes) {
                uniqueDescriptors[descriptor] = true
            } else if (inUnique) {
                delete uniqueDescriptors[descriptor]
                duplicateDescriptors[descriptor] = true
            }
        })
    })

    return uniqueDescriptors
}

export const uniqueInBoth = (l1: diffNodeType[], l2: diffNodeType[]) => {
    const l1Unique = findUniqueDescriptors(l1)
    const l2Unique = findUniqueDescriptors(l2)
    const inBoth = {}

    Object.keys(l1Unique).forEach((key) => {
        if (l2Unique[key]) {
            inBoth[key] = true
        }
    })

    return inBoth
}

export const removeDone = (tree: elementDiffNodeType) => {
    delete tree.outerDone
    delete tree.innerDone
    delete tree.valueDone
    if (tree.childNodes) {
        return tree.childNodes.every(removeDone)
    } else {
        return true
    }
}

export const cleanNode = (diffNode: diffNodeType) => {
    if (Object.prototype.hasOwnProperty.call(diffNode, "data")) {
        const textNode: textNodeType = {
            nodeName: diffNode.nodeName === "#text" ? "#text" : "#comment",
            data: (diffNode as textDiffNodeType).data,
        }
        return textNode
    } else {
        const elementNode: elementNodeType = {
            nodeName: diffNode.nodeName,
        }
        diffNode = diffNode as elementDiffNodeType
        if (Object.prototype.hasOwnProperty.call(diffNode, "attributes")) {
            elementNode.attributes = { ...diffNode.attributes }
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "checked")) {
            elementNode.checked = diffNode.checked
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "value")) {
            elementNode.value = diffNode.value
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "selected")) {
            elementNode.selected = diffNode.selected
        }
        if (Object.prototype.hasOwnProperty.call(diffNode, "childNodes")) {
            elementNode.childNodes = diffNode.childNodes.map((diffChildNode) =>
                cleanNode(diffChildNode),
            )
        }
        return elementNode
    }
}

export const isEqual = (e1: diffNodeType, e2: diffNodeType) => {
    if (
        !["nodeName", "value", "checked", "selected", "data"].every(
            (element) => {
                if (e1[element] !== e2[element]) {
                    return false
                }
                return true
            },
        )
    ) {
        return false
    }
    if (Object.prototype.hasOwnProperty.call(e1, "data")) {
        // Comment or Text
        return true
    }
    e1 = e1 as elementDiffNodeType
    e2 = e2 as elementDiffNodeType
    if (Boolean(e1.attributes) !== Boolean(e2.attributes)) {
        return false
    }

    if (Boolean(e1.childNodes) !== Boolean(e2.childNodes)) {
        return false
    }
    if (e1.attributes) {
        const e1Attributes = Object.keys(e1.attributes)
        const e2Attributes = Object.keys(e2.attributes)

        if (e1Attributes.length !== e2Attributes.length) {
            return false
        }
        if (
            !e1Attributes.every((attribute) => {
                if (
                    (e1 as elementDiffNodeType).attributes[attribute] !==
                    (e2 as elementDiffNodeType).attributes[attribute]
                ) {
                    return false
                }
                return true
            })
        ) {
            return false
        }
    }
    if (e1.childNodes) {
        if (e1.childNodes.length !== e2.childNodes.length) {
            return false
        }
        if (
            !e1.childNodes.every((childNode: nodeType, index: number) =>
                isEqual(childNode, e2.childNodes[index]),
            )
        ) {
            return false
        }
    }

    return true
}

export const roughlyEqual = (
    e1: diffNodeType,
    e2: diffNodeType,
    uniqueDescriptors: { [key: string]: boolean },
    sameSiblings: boolean,
    preventRecursion = false,
) => {
    if (!e1 || !e2) {
        return false
    }

    if (e1.nodeName !== e2.nodeName) {
        return false
    }

    if (["#text", "#comment"].includes(e1.nodeName)) {
        // Note that we initially don't care what the text content of a node is,
        // the mere fact that it's the same tag and "has text" means it's roughly
        // equal, and then we can find out the true text difference later.
        return preventRecursion
            ? true
            : (e1 as textDiffNodeType).data === (e2 as textDiffNodeType).data
    }

    e1 = e1 as elementDiffNodeType
    e2 = e2 as elementDiffNodeType

    if (e1.nodeName in uniqueDescriptors) {
        return true
    }

    if (e1.attributes && e2.attributes) {
        if (e1.attributes.id) {
            if (e1.attributes.id !== e2.attributes.id) {
                return false
            } else {
                const idDescriptor = `${e1.nodeName}#${e1.attributes.id}`
                if (idDescriptor in uniqueDescriptors) {
                    return true
                }
            }
        }
        if (
            e1.attributes["class"] &&
            e1.attributes["class"] === e2.attributes["class"]
        ) {
            const classDescriptor = `${e1.nodeName}.${e1.attributes[
                "class"
            ].replace(/ /g, ".")}`
            if (classDescriptor in uniqueDescriptors) {
                return true
            }
        }
    }

    if (sameSiblings) {
        return true
    }

    const nodeList1 = e1.childNodes ? e1.childNodes.slice().reverse() : []
    const nodeList2 = e2.childNodes ? e2.childNodes.slice().reverse() : []

    if (nodeList1.length !== nodeList2.length) {
        return false
    }

    if (preventRecursion) {
        return nodeList1.every(
            (element: nodeType, index: number) =>
                element.nodeName === nodeList2[index].nodeName,
        )
    } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        // was not set, we must explicitly force it to true for child iterations.
        const childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2)
        return nodeList1.every((element: nodeType, index: number) =>
            roughlyEqual(
                element,
                nodeList2[index],
                childUniqueDescriptors,
                true,
                true,
            ),
        )
    }
}

/**
 * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
 */
const findCommonSubsets = (
    c1: diffNodeType[],
    c2: diffNodeType[],
    marked1: boolean[],
    marked2: boolean[],
) => {
    let lcsSize = 0
    let index: number[] = []
    const c1Length = c1.length
    const c2Length = c2.length

    const // set up the matching table
        matches = [...new Array(c1Length + 1)].map(() => [])

    const uniqueDescriptors = uniqueInBoth(c1, c2)

    let // If all of the elements are the same tag, id and class, then we can
        // consider them roughly the same even if they have a different number of
        // children. This will reduce removing and re-adding similar elements.
        subsetsSame = c1Length === c2Length

    if (subsetsSame) {
        c1.some((element: nodeType, i: number) => {
            const c1Desc = elementDescriptors(element)
            const c2Desc = elementDescriptors(c2[i])
            if (c1Desc.length !== c2Desc.length) {
                subsetsSame = false
                return true
            }
            c1Desc.some((description, i) => {
                if (description !== c2Desc[i]) {
                    subsetsSame = false
                    return true
                }
            })
            if (!subsetsSame) {
                return true
            }
        })
    }

    // fill the matches with distance values
    for (let c1Index = 0; c1Index < c1Length; c1Index++) {
        const c1Element = c1[c1Index]
        for (let c2Index = 0; c2Index < c2Length; c2Index++) {
            const c2Element = c2[c2Index]
            if (
                !marked1[c1Index] &&
                !marked2[c2Index] &&
                roughlyEqual(
                    c1Element,
                    c2Element,
                    uniqueDescriptors,
                    subsetsSame,
                )
            ) {
                matches[c1Index + 1][c2Index + 1] = matches[c1Index][c2Index]
                    ? matches[c1Index][c2Index] + 1
                    : 1
                if (matches[c1Index + 1][c2Index + 1] >= lcsSize) {
                    lcsSize = matches[c1Index + 1][c2Index + 1]
                    index = [c1Index + 1, c2Index + 1]
                }
            } else {
                matches[c1Index + 1][c2Index + 1] = 0
            }
        }
    }

    if (lcsSize === 0) {
        return false
    }

    return {
        oldValue: index[0] - lcsSize,
        newValue: index[1] - lcsSize,
        length: lcsSize,
    }
}

const makeBooleanArray = (n: number, v: boolean) =>
    [...new Array(n)].map(() => v)

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
export const getGapInformation = (
    t1: elementDiffNodeType,
    t2: elementDiffNodeType,
    stable: subsetType[],
) => {
    const gaps1: (true | number)[] = t1.childNodes
        ? (makeBooleanArray(t1.childNodes.length, true) as true[])
        : []
    const gaps2: (true | number)[] = t2.childNodes
        ? (makeBooleanArray(t2.childNodes.length, true) as true[])
        : []
    let group = 0

    // give elements from the same subset the same group number
    stable.forEach((subset: subsetType) => {
        const endOld = subset.oldValue + subset.length
        const endNew = subset.newValue + subset.length

        for (let j = subset.oldValue; j < endOld; j += 1) {
            gaps1[j] = group
        }
        for (let j = subset.newValue; j < endNew; j += 1) {
            gaps2[j] = group
        }
        group += 1
    })

    return {
        gaps1,
        gaps2,
    }
}

/**
 * Find all matching subsets, based on immediate child differences only.
 */
const markBoth = (marked1, marked2, subset: subsetType, i: number) => {
    marked1[subset.oldValue + i] = true
    marked2[subset.newValue + i] = true
}

export const markSubTrees = (
    oldTree: elementDiffNodeType,
    newTree: elementDiffNodeType,
) => {
    // note: the child lists are views, and so update as we update old/newTree
    const oldChildren = oldTree.childNodes ? oldTree.childNodes : []

    const newChildren = newTree.childNodes ? newTree.childNodes : []
    const marked1 = makeBooleanArray(oldChildren.length, false)
    const marked2 = makeBooleanArray(newChildren.length, false)
    const subsets = []

    const returnIndex = function () {
        return arguments[1]
    }

    let foundAllSubsets = false

    while (!foundAllSubsets) {
        const subset = findCommonSubsets(
            oldChildren,
            newChildren,
            marked1,
            marked2,
        )
        if (subset) {
            subsets.push(subset)
            const subsetArray = [...new Array(subset.length)].map(returnIndex)
            subsetArray.forEach((item) =>
                markBoth(marked1, marked2, subset, item),
            )
        } else {
            foundAllSubsets = true
        }
    }

    oldTree.subsets = subsets
    oldTree.subsetsAge = 100
    return subsets
}

export class DiffTracker {
    list: Diff[]
    constructor() {
        this.list = []
    }

    add(diffs: Diff[]) {
        this.list.push(...diffs)
    }
    forEach(fn: (Diff) => void) {
        this.list.forEach((li: Diff) => fn(li))
    }
}
