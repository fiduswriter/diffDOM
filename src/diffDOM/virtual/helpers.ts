import { anyNodeType, nodeType, subsetType } from "../types"

export class Diff {
    constructor(options = {}) {
        Object.entries(options).forEach(([key, value]) => (this[key] = value))
    }

    toString() {
        return JSON.stringify(this)
    }

    setValue(
        aKey: string | number,
        aValue:
            | string
            | number
            | boolean
            | number[]
            | { [key: string]: string | { [key: string]: string } }
            | nodeType
    ) {
        this[aKey] = aValue
        return this
    }
}

function elementDescriptors(el: anyNodeType) {
    const output = []
    output.push(el.nodeName)
    if (el.nodeName !== "#text" && el.nodeName !== "#comment") {
        el = el as nodeType
        if (el.attributes) {
            if (el.attributes["class"]) {
                output.push(
                    `${el.nodeName}.${el.attributes["class"].replace(
                        / /g,
                        "."
                    )}`
                )
            }
            if (el.attributes.id) {
                output.push(`${el.nodeName}#${el.attributes.id}`)
            }
        }
    }
    return output
}

function findUniqueDescriptors(li: anyNodeType[]) {
    const uniqueDescriptors = {}
    const duplicateDescriptors = {}

    li.forEach((node: anyNodeType) => {
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

export const uniqueInBoth = (l1: anyNodeType[], l2: anyNodeType[]) => {
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

export const cloneObj = (obj: object) => {
    if (global.structuredClone) {
        return structuredClone(obj)
    }
    return JSON.parse(JSON.stringify(obj))
}

export function removeDone(tree: nodeType) {
    delete tree.outerDone
    delete tree.innerDone
    delete tree.valueDone
    if (tree.childNodes) {
        return tree.childNodes.every(removeDone)
    } else {
        return true
    }
}

export function isEqual(e1: anyNodeType, e2: anyNodeType) {
    if (
        !["nodeName", "value", "checked", "selected", "data"].every(
            (element) => {
                if (e1[element] !== e2[element]) {
                    return false
                }
                return true
            }
        )
    ) {
        return false
    }
    if (Object.prototype.hasOwnProperty.call(e1, "data")) {
        // Comment or Text
        return true
    }
    e1 = e1 as nodeType
    e2 = e2 as nodeType
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
                    (e1 as nodeType).attributes[attribute] !==
                    (e2 as nodeType).attributes[attribute]
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
            !e1.childNodes.every((childNode: anyNodeType, index: number) =>
                isEqual(childNode, e2.childNodes[index])
            )
        ) {
            return false
        }
    }

    return true
}

export const roughlyEqual = (
    e1: anyNodeType,
    e2: anyNodeType,
    uniqueDescriptors: { [key: string]: boolean },
    sameSiblings: boolean,
    preventRecursion = false
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
        return preventRecursion ? true : e1.data === e2.data
    }

    e1 = e1 as nodeType
    e2 = e2 as nodeType

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
            (element: anyNodeType, index: number) =>
                element.nodeName === nodeList2[index].nodeName
        )
    } else {
        // note: we only allow one level of recursion at any depth. If 'preventRecursion'
        // was not set, we must explicitly force it to true for child iterations.
        const childUniqueDescriptors = uniqueInBoth(nodeList1, nodeList2)
        return nodeList1.every((element: anyNodeType, index: number) =>
            roughlyEqual(
                element,
                nodeList2[index],
                childUniqueDescriptors,
                true,
                true
            )
        )
    }
}

/**
 * based on https://en.wikibooks.org/wiki/Algorithm_implementation/Strings/Longest_common_substring#JavaScript
 */
const findCommonSubsets = (
    c1: anyNodeType[],
    c2: anyNodeType[],
    marked1: boolean[],
    marked2: boolean[]
) => {
    let lcsSize = 0
    let index: number[] = []
    const c1Length = c1.length
    const c2Length = c2.length

    const // set up the matching table
        matches = Array(...new Array(c1Length + 1)).map(() => [])

    const uniqueDescriptors = uniqueInBoth(c1, c2)

    let // If all of the elements are the same tag, id and class, then we can
        // consider them roughly the same even if they have a different number of
        // children. This will reduce removing and re-adding similar elements.
        subsetsSame = c1Length === c2Length

    if (subsetsSame) {
        c1.some((element: anyNodeType, i: number) => {
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
                    subsetsSame
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
    Array(...new Array(n)).map(() => v)

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
    t1: nodeType,
    t2: nodeType,
    stable: subsetType[]
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

export const markSubTrees = (oldTree: nodeType, newTree: nodeType) => {
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
            marked2
        )
        if (subset) {
            subsets.push(subset)
            const subsetArray = Array(...new Array(subset.length)).map(
                returnIndex
            )
            subsetArray.forEach((item) =>
                markBoth(marked1, marked2, subset, item)
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

//export const elementHasValue = (element: Element) : boolean => element instanceof HTMLButtonElement || element instanceof HTMLDataElement || element instanceof HTMLInputElement || element instanceof HTMLLIElement || element instanceof HTMLMeterElement || element instanceof HTMLOptionElement || element instanceof HTMLProgressElement || element instanceof HTMLParamElement
