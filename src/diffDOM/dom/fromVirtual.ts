import { DiffDOMOptions, elementNodeType, textNodeType } from "../types"

export function objToNode(
    objNode: elementNodeType,
    insideSvg: boolean,
    options: DiffDOMOptions
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
            objNode.childNodes.forEach(
                (childNode: elementNodeType | textNodeType) =>
                    node.appendChild(objToNode(childNode, insideSvg, options))
            )
        }
        if (options.valueDiffing) {
            if (
                objNode.value &&
                (node instanceof HTMLButtonElement ||
                    node instanceof HTMLDataElement ||
                    node instanceof HTMLInputElement ||
                    node instanceof HTMLLIElement ||
                    node instanceof HTMLMeterElement ||
                    node instanceof HTMLOptionElement ||
                    node instanceof HTMLProgressElement ||
                    node instanceof HTMLParamElement)
            ) {
                node.value = objNode.value
            }
            if (objNode.checked && node instanceof HTMLInputElement) {
                node.checked = objNode.checked
            }
            if (objNode.selected && node instanceof HTMLOptionElement) {
                node.selected = objNode.selected
            }
        }
    }
    return node
}
