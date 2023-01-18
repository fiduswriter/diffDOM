import { DiffDOMOptions, nodeType, textNodeType } from "../types"

export function objToNode(
    objNode: nodeType,
    insideSvg: boolean,
    options: DiffDOMOptions
) {
    let node: Element | Text | Comment
    if (objNode.nodeName === "#text") {
        node = options.document.createTextNode(objNode.data)
    } else if (objNode.nodeName === "#comment") {
        node = options.document.createComment(objNode.data)
    } else {
        if (insideSvg) {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                objNode.nodeName
            )
        } else if (objNode.nodeName.toLowerCase() === "svg") {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            )
            insideSvg = true
        } else {
            node = options.document.createElement(objNode.nodeName)
        }
        if (objNode.attributes) {
            Object.entries(objNode.attributes).forEach(([key, value]) =>
                (node as Element).setAttribute(key, value)
            )
        }
        if (objNode.childNodes) {
            node = node as Element
            objNode.childNodes.forEach((childNode: nodeType | textNodeType) =>
                node.appendChild(objToNode(childNode, insideSvg, options))
            )
        }
        if (options.valueDiffing) {
            if (objNode.value) {
                // @ts-expect-error TS(2339): Property 'value' does not exist on type 'Element'.
                node.value = objNode.value
            }
            if (objNode.checked) {
                // @ts-expect-error TS(2339): Property 'checked' does not exist on type 'Element... Remove this comment to see the full error message
                node.checked = objNode.checked
            }
            if (objNode.selected) {
                // @ts-expect-error TS(2339): Property 'selected' does not exist on type 'Elemen... Remove this comment to see the full error message
                node.selected = objNode.selected
            }
        }
    }
    return node
}
