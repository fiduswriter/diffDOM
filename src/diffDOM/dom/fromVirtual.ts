import { DiffDOMOptions, elementNodeType, textNodeType } from "../types"
import { checkElementType } from "../helpers"

export function objToNode(
    objNode: elementNodeType,
    insideSvg: boolean,
    options: DiffDOMOptions,
) {
    let node: Element | Text | Comment
    if (objNode.nodeName === "#text") {
        node = options.document.createTextNode((objNode as textNodeType).data)
    } else if (objNode.nodeName === "#comment") {
        node = options.document.createComment((objNode as textNodeType).data)
    } else {
        if (insideSvg) {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                objNode.nodeName,
            )
            if (objNode.nodeName === "foreignObject") {
                insideSvg = false
            }
        } else if (objNode.nodeName.toLowerCase() === "svg") {
            node = options.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg",
            )
            insideSvg = true
        } else {
            node = options.document.createElement(objNode.nodeName)
        }
        if (objNode.attributes) {
            Object.entries(objNode.attributes).forEach(([key, value]) =>
                (node as Element).setAttribute(key, value),
            )
        }
        if (objNode.childNodes) {
            node = node as Element
            objNode.childNodes.forEach(
                (childNode: elementNodeType | textNodeType) =>
                    node.appendChild(objToNode(childNode, insideSvg, options)),
            )
        }
        if (options.valueDiffing) {
            if (
                objNode.value &&
                checkElementType(
                    node,
                    "HTMLButtonElement",
                    "HTMLDataElement",
                    "HTMLInputElement",
                    "HTMLLIElement",
                    "HTMLMeterElement",
                    "HTMLOptionElement",
                    "HTMLProgressElement",
                    "HTMLParamElement",
                )
            ) {
                ;(
                    node as
                        | HTMLButtonElement
                        | HTMLDataElement
                        | HTMLInputElement
                        | HTMLLIElement
                        | HTMLMeterElement
                        | HTMLOptionElement
                        | HTMLProgressElement
                        | HTMLParamElement
                ).value = objNode.value
            }
            if (objNode.checked && checkElementType(node, "HTMLInputElement")) {
                ;(node as HTMLInputElement).checked = objNode.checked
            }
            if (
                objNode.selected &&
                checkElementType(node, "HTMLOptionElement")
            ) {
                ;(node as HTMLOptionElement).selected = objNode.selected
            }
        }
    }
    return node
}
