import { DiffDOMOptions, elementNodeType, nodeType, subsetType } from "../types"
import { Diff } from "../helpers"
import { cleanNode } from "./helpers"
// ===== Apply a virtual diff =====

function getFromVirtualRoute(tree: elementNodeType, route: number[]) {
    let node = tree
    let parentNode
    let nodeIndex

    route = route.slice()
    while (route.length > 0) {
        nodeIndex = route.splice(0, 1)[0]
        parentNode = node
        node = node.childNodes ? node.childNodes[nodeIndex] : undefined
    }
    return {
        node,
        parentNode,
        nodeIndex,
    }
}

function applyVirtualDiff(
    tree: elementNodeType,
    diff: Diff,
    options: DiffDOMOptions, // {preVirtualDiffApply, postVirtualDiffApply, _const}
) {
    let node, parentNode, nodeIndex

    if (
        ![options._const.addElement, options._const.addTextElement].includes(
            diff[options._const.action],
        )
    ) {
        // For adding nodes, we calculate the route later on. It's different because it includes the position of the newly added item.
        const routeInfo = getFromVirtualRoute(tree, diff[options._const.route])
        node = routeInfo.node
        parentNode = routeInfo.parentNode
        nodeIndex = routeInfo.nodeIndex
    }

    const newSubsets: subsetType[] = []

    // pre-diff hook
    const info = {
        diff,
        node,
    }

    if (options.preVirtualDiffApply(info)) {
        return true
    }

    let newNode
    let nodeArray
    let route

    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            if (!node.attributes) {
                node.attributes = {}
            }

            node.attributes[diff[options._const.name]] =
                diff[options._const.value]

            if (diff[options._const.name] === "checked") {
                node.checked = true
            } else if (diff[options._const.name] === "selected") {
                node.selected = true
            } else if (
                node.nodeName === "INPUT" &&
                diff[options._const.name] === "value"
            ) {
                node.value = diff[options._const.value]
            }

            break
        case options._const.modifyAttribute:
            node.attributes[diff[options._const.name]] =
                diff[options._const.newValue]
            break
        case options._const.removeAttribute:
            delete node.attributes[diff[options._const.name]]

            if (Object.keys(node.attributes).length === 0) {
                delete node.attributes
            }

            if (diff[options._const.name] === "checked") {
                node.checked = false
            } else if (diff[options._const.name] === "selected") {
                delete node.selected
            } else if (
                node.nodeName === "INPUT" &&
                diff[options._const.name] === "value"
            ) {
                delete node.value
            }

            break
        case options._const.modifyTextElement:
            node.data = diff[options._const.newValue]
            if (parentNode.nodeName === "TEXTAREA") {
                parentNode.value = diff[options._const.newValue]
            }
            break
        case options._const.modifyValue:
            node.value = diff[options._const.newValue]
            break
        case options._const.modifyComment:
            node.data = diff[options._const.newValue]
            break
        case options._const.modifyChecked:
            node.checked = diff[options._const.newValue]
            break
        case options._const.modifySelected:
            node.selected = diff[options._const.newValue]
            break
        case options._const.replaceElement:
            newNode = cleanNode(diff[options._const.newValue])
            parentNode.childNodes[nodeIndex] = newNode
            break
        case options._const.relocateGroup:
            nodeArray = node.childNodes
                .splice(
                    diff[options._const.from],
                    diff[options._const.groupLength],
                )
                .reverse()
            nodeArray.forEach((movedNode: nodeType) =>
                node.childNodes.splice(diff[options._const.to], 0, movedNode),
            )
            if (node.subsets) {
                node.subsets.forEach((map: subsetType) => {
                    if (
                        diff[options._const.from] < diff[options._const.to] &&
                        map.oldValue <= diff[options._const.to] &&
                        map.oldValue > diff[options._const.from]
                    ) {
                        map.oldValue -= diff[options._const.groupLength]
                        const splitLength =
                            map.oldValue + map.length - diff[options._const.to]
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue:
                                    diff[options._const.to] +
                                    diff[options._const.groupLength],
                                newValue:
                                    map.newValue + map.length - splitLength,
                                length: splitLength,
                            })
                            map.length -= splitLength
                        }
                    } else if (
                        diff[options._const.from] > diff[options._const.to] &&
                        map.oldValue > diff[options._const.to] &&
                        map.oldValue < diff[options._const.from]
                    ) {
                        map.oldValue += diff[options._const.groupLength]
                        const splitLength =
                            map.oldValue + map.length - diff[options._const.to]
                        if (splitLength > 0) {
                            // new insertion splits map.
                            newSubsets.push({
                                oldValue:
                                    diff[options._const.to] +
                                    diff[options._const.groupLength],
                                newValue:
                                    map.newValue + map.length - splitLength,
                                length: splitLength,
                            })
                            map.length -= splitLength
                        }
                    } else if (map.oldValue === diff[options._const.from]) {
                        map.oldValue = diff[options._const.to]
                    }
                })
            }

            break
        case options._const.removeElement:
            parentNode.childNodes.splice(nodeIndex, 1)
            if (parentNode.subsets) {
                parentNode.subsets.forEach((map: subsetType) => {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1
                    } else if (map.oldValue === nodeIndex) {
                        map.delete = true
                    } else if (
                        map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex
                    ) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--
                        } else {
                            newSubsets.push({
                                newValue:
                                    map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length:
                                    map.length - nodeIndex + map.oldValue - 1,
                            })
                            map.length = nodeIndex - map.oldValue
                        }
                    }
                })
            }
            node = parentNode
            break
        case options._const.addElement: {
            route = diff[options._const.route].slice()
            const c: number = route.splice(route.length - 1, 1)[0]
            node = getFromVirtualRoute(tree, route)?.node
            newNode = cleanNode(diff[options._const.element])

            if (!node.childNodes) {
                node.childNodes = []
            }

            if (c >= node.childNodes.length) {
                node.childNodes.push(newNode)
            } else {
                node.childNodes.splice(c, 0, newNode)
            }
            if (node.subsets) {
                node.subsets.forEach((map: subsetType) => {
                    if (map.oldValue >= c) {
                        map.oldValue += 1
                    } else if (
                        map.oldValue < c &&
                        map.oldValue + map.length > c
                    ) {
                        const splitLength = map.oldValue + map.length - c
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength,
                        })
                        map.length -= splitLength
                    }
                })
            }
            break
        }
        case options._const.removeTextElement:
            parentNode.childNodes.splice(nodeIndex, 1)
            if (parentNode.nodeName === "TEXTAREA") {
                delete parentNode.value
            }
            if (parentNode.subsets) {
                parentNode.subsets.forEach((map: subsetType) => {
                    if (map.oldValue > nodeIndex) {
                        map.oldValue -= 1
                    } else if (map.oldValue === nodeIndex) {
                        map.delete = true
                    } else if (
                        map.oldValue < nodeIndex &&
                        map.oldValue + map.length > nodeIndex
                    ) {
                        if (map.oldValue + map.length - 1 === nodeIndex) {
                            map.length--
                        } else {
                            newSubsets.push({
                                newValue:
                                    map.newValue + nodeIndex - map.oldValue,
                                oldValue: nodeIndex,
                                length:
                                    map.length - nodeIndex + map.oldValue - 1,
                            })
                            map.length = nodeIndex - map.oldValue
                        }
                    }
                })
            }
            node = parentNode
            break
        case options._const.addTextElement: {
            route = diff[options._const.route].slice()
            const c: number = route.splice(route.length - 1, 1)[0]
            newNode = {
                nodeName: "#text",
                data: diff[options._const.value],
            }
            node = getFromVirtualRoute(tree, route).node
            if (!node.childNodes) {
                node.childNodes = []
            }

            if (c >= node.childNodes.length) {
                node.childNodes.push(newNode)
            } else {
                node.childNodes.splice(c, 0, newNode)
            }
            if (node.nodeName === "TEXTAREA") {
                node.value = diff[options._const.newValue]
            }
            if (node.subsets) {
                node.subsets.forEach((map: subsetType) => {
                    if (map.oldValue >= c) {
                        map.oldValue += 1
                    }
                    if (map.oldValue < c && map.oldValue + map.length > c) {
                        const splitLength = map.oldValue + map.length - c
                        newSubsets.push({
                            newValue: map.newValue + map.length - splitLength,
                            oldValue: c + 1,
                            length: splitLength,
                        })
                        map.length -= splitLength
                    }
                })
            }
            break
        }
        default:
            console.log("unknown action")
    }

    if (node.subsets) {
        node.subsets = node.subsets.filter(
            (map: subsetType) => !map.delete && map.oldValue !== map.newValue,
        )
        if (newSubsets.length) {
            node.subsets = node.subsets.concat(newSubsets)
        }
    }

    options.postVirtualDiffApply({
        node: info.node,
        diff: info.diff,
        newNode,
    })

    return
}

export function applyVirtual(
    tree: elementNodeType,
    diffs: Diff[],
    options: DiffDOMOptions,
) {
    diffs.forEach((diff: Diff) => {
        applyVirtualDiff(tree, diff, options)
    })
    return true
}
