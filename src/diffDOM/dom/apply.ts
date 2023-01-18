import { DiffDOMOptions, diffType, nodeType } from "../types"
import { Diff } from "../helpers"

import { objToNode } from "./fromVirtual"

// ===== Apply a diff =====

const getFromRoute = (
    node: Element,
    route: number[]
): Element | Text | false => {
    route = route.slice()
    while (route.length > 0) {
        const c = route.splice(0, 1)[0]
        node = node.childNodes[c] as Element
    }
    return node
}

export function applyDiff(
    tree: Element,
    diff: diffType,
    options: DiffDOMOptions // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    const action = diff[options._const.action] as string | number
    const route = diff[options._const.route] as number[]
    let node

    if (
        ![options._const.addElement, options._const.addTextElement].includes(
            action
        )
    ) {
        // For adding nodes, we calculate the route later on. It's different because it includes the position of the newly added item.
        node = getFromRoute(tree, route)
    }

    let newNode
    let reference: Element
    let nodeArray

    // pre-diff hook
    const info = {
        diff,
        node,
    }

    if (options.preDiffApply(info)) {
        return true
    }

    switch (action) {
        case options._const.addAttribute:
            if (!node || !(node instanceof Element)) {
                return false
            }
            node.setAttribute(
                diff[options._const.name] as string,
                diff[options._const.value] as string
            )
            break
        case options._const.modifyAttribute:
            if (!node || !(node instanceof Element)) {
                return false
            }
            node.setAttribute(
                diff[options._const.name] as string,
                diff[options._const.newValue] as string
            )
            if (
                node instanceof HTMLInputElement &&
                diff[options._const.name] === "value"
            ) {
                node.value = diff[options._const.newValue] as string
            }
            break
        case options._const.removeAttribute:
            if (!node || !(node instanceof Element)) {
                return false
            }
            node.removeAttribute(diff[options._const.name] as string)
            break
        case options._const.modifyTextElement:
            if (!node || !(node instanceof Text)) {
                return false
            }
            options.textDiff(
                node,
                node.data,
                diff[options._const.oldValue] as string,
                diff[options._const.newValue] as string
            )
            break
        case options._const.modifyValue:
            if (!node || typeof node.value === "undefined") {
                return false
            }
            node.value = diff[options._const.newValue]
            break
        case options._const.modifyComment:
            if (!node || !(node instanceof Comment)) {
                return false
            }
            options.textDiff(
                node,
                node.data,
                diff[options._const.oldValue] as string,
                diff[options._const.newValue] as string
            )
            break
        case options._const.modifyChecked:
            if (!node || typeof node.checked === "undefined") {
                return false
            }
            node.checked = diff[options._const.newValue]
            break
        case options._const.modifySelected:
            if (!node || typeof node.selected === "undefined") {
                return false
            }
            node.selected = diff[options._const.newValue]
            break
        case options._const.replaceElement:
            node.parentNode.replaceChild(
                objToNode(
                    diff[options._const.newValue] as nodeType,
                    (
                        diff[options._const.newValue] as nodeType
                    ).nodeName.toLowerCase() === "svg",
                    options
                ),
                node
            )
            break
        case options._const.relocateGroup:
            nodeArray = Array(
                ...new Array(diff[options._const.groupLength])
            ).map(() =>
                node.removeChild(
                    node.childNodes[diff[options._const.from] as number]
                )
            )
            nodeArray.forEach((childNode, index) => {
                if (index === 0) {
                    reference =
                        node.childNodes[diff[options._const.to] as number]
                }
                node.insertBefore(childNode, reference || null)
            })
            break
        case options._const.removeElement:
            node.parentNode.removeChild(node)
            break
        case options._const.addElement: {
            const parentRoute = route.slice()
            const c: number = parentRoute.splice(parentRoute.length - 1, 1)[0]
            node = getFromRoute(tree, parentRoute)
            if (!(node instanceof Element)) {
                return false
            }
            node.insertBefore(
                objToNode(
                    diff[options._const.element] as nodeType,
                    node.namespaceURI === "http://www.w3.org/2000/svg",
                    options
                ),
                node.childNodes[c] || null
            )
            break
        }
        case options._const.removeTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            node.parentNode.removeChild(node)
            break
        case options._const.addTextElement: {
            const parentRoute = route.slice()
            const c: number = parentRoute.splice(parentRoute.length - 1, 1)[0]
            newNode = options.document.createTextNode(
                diff[options._const.value] as string
            )
            node = getFromRoute(tree, parentRoute)
            if (!node.childNodes) {
                return false
            }
            node.insertBefore(newNode, node.childNodes[c] || null)
            break
        }
        default:
            console.log("unknown action")
    }

    // if a new node was created, we might be interested in its
    // post diff hook
    options.postDiffApply({
        diff: info.diff,
        node: info.node,
        newNode,
    })

    return true
}

export function applyDOM(
    tree: Element,
    diffs: (Diff | diffType)[],
    options: DiffDOMOptions
) {
    return diffs.every((diff: Diff | diffType) =>
        applyDiff(tree, diff as diffType, options)
    )
}
