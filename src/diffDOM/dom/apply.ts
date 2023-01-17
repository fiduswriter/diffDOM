import { objToNode } from "./fromVirtual"

// ===== Apply a diff =====

function getFromRoute(node: Element, route: number[]) {
    route = route.slice()
    while (route.length > 0) {
        if (!node.childNodes) {
            return false
        }
        const c = route.splice(0, 1)[0]
        // @ts-expect-error TS(2740): Type 'ChildNode' is missing the following properti... Remove this comment to see the full error message
        node = node.childNodes[c]
    }
    return node
}

export function applyDiff(
    tree: any,
    diff: any,
    options: any // {preDiffApply, postDiffApply, textDiff, valueDiffing, _const}
) {
    let node = getFromRoute(tree, diff[options._const.route])
    let newNode
    let reference: Element
    let route
    let nodeArray
    let c

    // pre-diff hook
    const info = {
        diff,
        node,
    }

    if (options.preDiffApply(info)) {
        return true
    }

    switch (diff[options._const.action]) {
        case options._const.addAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(
                diff[options._const.name],
                diff[options._const.value]
            )
            break
        case options._const.modifyAttribute:
            if (!node || !node.setAttribute) {
                return false
            }
            node.setAttribute(
                diff[options._const.name],
                diff[options._const.newValue]
            )
            if (
                node.nodeName === "INPUT"
                && diff[options._const.name] === "value"
            ) {
                // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Element'.
                node.value = diff[options._const.newValue]
            }
            break
        case options._const.removeAttribute:
            if (!node || !node.removeAttribute) {
                return false
            }
            node.removeAttribute(diff[options._const.name])
            break
        case options._const.modifyTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            options.textDiff(
                node,
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'Element'.
                node.data,
                diff[options._const.oldValue],
                diff[options._const.newValue]
            )
            break
        case options._const.modifyValue:
            // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Element'.
            if (!node || typeof node.value === "undefined") {
                return false
            }
            // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Element'.
            node.value = diff[options._const.newValue]
            break
        case options._const.modifyComment:
            // @ts-expect-error TS(2339): Property 'data' does not exist on type 'Element'.
            if (!node || typeof node.data === "undefined") {
                return false
            }
            options.textDiff(
                node,
                // @ts-expect-error TS(2339): Property 'data' does not exist on type 'Element'.
                node.data,
                diff[options._const.oldValue],
                diff[options._const.newValue]
            )
            break
        case options._const.modifyChecked:
            // @ts-expect-error TS(2339): Property 'checked' does not exist on type 'Element... Remove this comment to see the full error message
            if (!node || typeof node.checked === "undefined") {
                return false
            }
            // @ts-expect-error TS(2339): Property 'checked' does not exist on type 'Element... Remove this comment to see the full error message
            node.checked = diff[options._const.newValue]
            break
        case options._const.modifySelected:
            // @ts-expect-error TS(2339): Property 'selected' does not exist on type 'Elemen... Remove this comment to see the full error message
            if (!node || typeof node.selected === "undefined") {
                return false
            }
            // @ts-expect-error TS(2339): Property 'selected' does not exist on type 'Elemen... Remove this comment to see the full error message
            node.selected = diff[options._const.newValue]
            break
        case options._const.replaceElement:
            // @ts-expect-error TS(2339): Property 'parentNode' does not exist on type 'fals... Remove this comment to see the full error message
            node.parentNode.replaceChild(
                objToNode(
                    diff[options._const.newValue],
                    diff[options._const.newValue].nodeName.toLowerCase()
                        === "svg",
                    options
                ),
                node
            )
            break
        case options._const.relocateGroup:
            nodeArray = Array(...new Array(diff.groupLength)).map(() =>
                // @ts-expect-error TS(2339): Property 'removeChild' does not exist on type 'boo... Remove this comment to see the full error message
                node.removeChild(node.childNodes[diff[options._const.from]])
            )
            nodeArray.forEach((childNode, index) => {
                if (index === 0) {
                    // @ts-expect-error TS(2339): Property 'childNodes' does not exist on type 'bool... Remove this comment to see the full error message
                    reference = node.childNodes[diff[options._const.to]]
                }
                // @ts-expect-error TS(2339): Property 'insertBefore' does not exist on type 'bo... Remove this comment to see the full error message
                node.insertBefore(childNode, reference || null)
            })
            break
        case options._const.removeElement:
            // @ts-expect-error TS(2339): Property 'parentNode' does not exist on type 'fals... Remove this comment to see the full error message
            node.parentNode.removeChild(node)
            break
        case options._const.addElement:
            route = diff[options._const.route].slice()
            c = route.splice(route.length - 1, 1)[0]
            node = getFromRoute(tree, route)
            // @ts-expect-error TS(2339): Property 'insertBefore' does not exist on type 'fa... Remove this comment to see the full error message
            node.insertBefore(
                objToNode(
                    diff[options._const.element],
                    // @ts-expect-error TS(2339): Property 'namespaceURI' does not exist on type 'fa... Remove this comment to see the full error message
                    node.namespaceURI === "http://www.w3.org/2000/svg",
                    options
                ),
                // @ts-expect-error TS(2339): Property 'childNodes' does not exist on type 'fals... Remove this comment to see the full error message
                node.childNodes[c] || null
            )
            break
        case options._const.removeTextElement:
            if (!node || node.nodeType !== 3) {
                return false
            }
            node.parentNode.removeChild(node)
            break
        case options._const.addTextElement:
            route = diff[options._const.route].slice()
            c = route.splice(route.length - 1, 1)[0]
            newNode = options.document.createTextNode(
                diff[options._const.value]
            )
            node = getFromRoute(tree, route)
            if (!node || !node.childNodes) {
                return false
            }
            node.insertBefore(newNode, node.childNodes[c] || null)
            break
        default:
            console.log("unknown action")
    }

    // if a new node was created, we might be interested in its
    // post diff hook
    // @ts-expect-error TS(2339): Property 'newNode' does not exist on type '{ diff:... Remove this comment to see the full error message
    info.newNode = newNode
    options.postDiffApply(info)

    return true
}

export function applyDOM(tree: any, diffs: any, options: any) {
    return diffs.every((diff: any) => applyDiff(tree, diff, options))
}
